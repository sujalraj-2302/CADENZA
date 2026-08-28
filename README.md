# CADENZA

**One Room. One Rhythm.**

CADENZA is a real-time YouTube watch-party platform. Create a room, share a code, and watch YouTube together with synchronized playback, live reactions, chat, a votable queue, and role-based moderation — built to feel like a digital cinema room, not a WebSocket demo.

---

## Features

- Email/username + password auth (JWT in an httpOnly cookie, bcrypt hashing)
- Persistent login across refreshes
- Cinematic CADENZA logo intro — every letter falls into place, the signature **E** arrives last, lands lower and tilted, in the accent red
- Create / join rooms with a 6-character code, shareable link, and privacy levels (private / link-only / public)
- Server-authoritative real-time playback sync (play, pause, seek, change video) via Socket.IO
- Role system — Host, Moderator, Participant — enforced on the server, never trusted from the client
- Smart video queue with voting and automatic advance
- Real-time emoji reactions that float over the video
- Room chat
- Lightweight live polls
- Room themes (Midnight Cinema, Aurora, Sunset, Ocean, Minimal)
- Cinema Mode (video-first, sidebar collapses)
- Sync health indicator + automatic drift correction
- Responsive layout (desktop, tablet, mobile)

## Tech Stack

| Layer          | Choice                                              |
|----------------|------------------------------------------------------|
| Frontend       | React + Vite, React Router, Framer Motion, Lucide Icons, Axios |
| Backend        | Node.js + Express                                     |
| Database       | MongoDB + Mongoose                                    |
| Real-time      | Socket.IO                                             |
| Auth           | JWT (httpOnly cookie) + bcrypt                        |
| Video          | YouTube IFrame Player API                             |

## Architecture

```
cadenza/
├── client/                 React app (Vite)
│   └── src/
│       ├── api/            Axios calls to the REST API
│       ├── components/     Logo, Auth, Room, Navbar, Common
│       ├── context/        AuthContext, SocketContext
│       ├── hooks/          useYouTubePlayer
│       ├── pages/          Landing, Login, Signup, Home, RoomPage, Profile, Settings
│       └── styles/         theme.css — the entire design system
│
└── server/                 Express + Socket.IO
    ├── config/db.js        MongoDB connection
    ├── models/              User, Room (Mongoose schemas)
    ├── middleware/          requireAuth, error handler
    ├── controllers/         authController, roomController
    ├── routes/               REST endpoints
    ├── sockets/
    │   ├── index.js          all Socket.IO event handlers
    │   └── roomManager.js    in-memory authoritative live-room state
    └── utils/                JWT/cookie helpers, room code generator
```

### Authentication flow

1. Signup/login hits `POST /api/auth/signup` or `/login`.
2. On success the server signs a JWT and sets it as an **httpOnly cookie** (`cadenza_token`) — never exposed to JS, never stored in `localStorage`.
3. Every subsequent request (REST and Socket.IO) sends the cookie automatically (`withCredentials: true`).
4. `GET /api/auth/me` on app load restores the session, so refreshing never logs the user out.
5. `requireAuth` middleware verifies the JWT and attaches `req.user`/`req.userId` — the server never trusts a user id sent in the request body.

### Real-time / WebSocket architecture

- `RoomManager` (`server/sockets/roomManager.js`) is the **single source of truth** for live playback state per room: who's connected, current time, play/pause state. It's an in-memory `Map` keyed by room code — deliberately the seam you'd swap for a Redis-backed store (`@socket.io/redis-adapter`) if you needed multiple server instances.
- Persistent facts (queue contents, participants, room settings) are written straight through to MongoDB. Highly dynamic playback ticks are **not** written on every event — the server flushes a snapshot to MongoDB every 8 seconds, and clients report their local time every 4 seconds so the server can correct drift beyond a small threshold without visible jitter.
- Playback control events (`play`, `pause`, `seek`, `change_video`) are only accepted from sockets whose *server-recorded* role is `host` or `moderator` — role is looked up server-side per event, never taken from the client.
- If the Host disconnects, no one is silently promoted. The room keeps working; a "Host disconnected" banner appears.

### Database structure

**User**: name, username (unique), email (unique), passwordHash, avatarUrl, timestamps.

**Room**: roomCode (unique), name, host, participants (`[{ user, role, joinedAt }]`), privacy, theme, currentVideo, playbackState, currentTime, queue (`[{ videoId, title, thumbnail, addedBy, votes[] }]`), timestamps.

## Environment Variables

**server/.env** (copy from `server/.env.example`):

```
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_secret
PORT=5000
CLIENT_URL=http://localhost:5173
NODE_ENV=development
```

**client/.env** (copy from `client/.env.example`):

```
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
```

`.env` is git-ignored in both packages — only the `.env.example` files are committed.

## Local Setup

```bash
# 1. Backend
cd server
npm install
cp .env.example .env      # fill in your MongoDB URI and a JWT secret
npm run dev                # starts on http://localhost:5000

# 2. Frontend (separate terminal)
cd client
npm install
cp .env.example .env
npm run dev                # starts on http://localhost:5173
```

Open `http://localhost:5173` — sign up, create a room, and open the room link in a second browser (or incognito window) to see synchronized playback.

## Deployment

- **Backend**: any Node host (Render, Railway, Fly.io, EC2…). Set the same env vars; make sure `CLIENT_URL` points at your deployed frontend origin, and set `NODE_ENV=production` so the auth cookie is sent with `Secure`/`SameSite=None` (required for cross-origin cookies over HTTPS).
- **Frontend**: `npm run build` in `client/`, deploy the `dist/` folder (Vercel, Netlify, Cloudflare Pages…). Set `VITE_API_URL`/`VITE_SOCKET_URL` to your backend's public URL.
- **MongoDB**: MongoDB Atlas works well for a managed, production-ready database.

#### Render checklist

For separate Render services, set these backend environment variables:

```
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_secret
CLIENT_URL=https://your-frontend.onrender.com
NODE_ENV=production
```

Set these frontend environment variables before building the static site, then redeploy it:

```
VITE_API_URL=https://your-backend.onrender.com/api
VITE_SOCKET_URL=https://your-backend.onrender.com
```

Configure the frontend service as a Static Site with build command `npm install && npm run build`, publish directory `client/dist`, and a rewrite from `/*` to `/index.html`. `VITE_*` values are embedded during the build, so changing them requires a new deploy.
- **Scaling**: when running multiple server instances, add the `@socket.io/redis-adapter` and move `RoomManager`'s in-memory `Map` to Redis — the module boundary is already there to make that a contained change.

## Key Technical Decisions

- **httpOnly cookie over localStorage** for the JWT — protects the token from XSS; the tradeoff is CORS must explicitly allow credentials and the client must set `withCredentials: true` everywhere (REST + Socket.IO).
- **Server-authoritative state** — the client never assumes its local playback state is correct. All play/pause/seek/queue mutations go through the server, which validates the sender's role before broadcasting.
- **MongoDB for persistence, memory for hot state** — writing every playback tick to Mongo would be wasteful and slow; `RoomManager` keeps that in memory and only checkpoints it periodically.
- **No auto host reassignment** — silently promoting a random participant to Host on disconnect is a worse experience than a brief "Host disconnected" banner while the room keeps playing.


## Latest Frontend Interaction Updates

- Landing and Home now explain CADENZA's unique features using the existing black/gold/red visual identity.
- Login/Sign Up actions remain the primary entry points on the landing experience.
- Room layout is now **participants left / video center / live chat right** on desktop.
- The room header keeps the CADENZA wordmark at top-left and adds watching count, sync state, Invite, and a red Leave action at top-right.
- Chat supports replying to individual messages and emoji reactions.
- Host and moderator users can create a poll directly from chat; the active poll is pinned above the messages.
- Join/leave/host-disconnect events appear as lightweight system messages in chat.
- YouTube playback uses the YouTube IFrame Player API; no YouTube Data API key is required.
- YouTube player loading and playback errors now show a controlled retry state instead of leaving a silent black player.
- Playback synchronization uses the server-authoritative clock with frequent drift checks and a tighter correction threshold.
