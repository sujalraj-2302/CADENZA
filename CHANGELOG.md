# CADENZA Frontend / Room Update

This package contains the fresh versions of every file changed or added for the requested CADENZA update.

## Visual / UX

- Kept the existing CADENZA logo, typography, black/gold/red theme, and signature red `E` unchanged.
- Added a more informative landing experience with four feature cards, Login/Sign Up CTAs, and a centered "Co-powered by Sujal Raj" footer.
- Added the same product-value feature section to Home after authentication.
- Reworked the desktop room into three areas: participants on the left, YouTube video in the center, and live chat on the right.
- Added watching count, sync status, Invite, and Leave controls to the room header.
- Kept host-disconnect behavior: nobody is automatically promoted to host.

## Chat

- Join/leave/host-disconnect system messages.
- Reply to a specific message.
- Emoji reactions on individual messages.
- Pinned active poll at the top of chat.
- Host/moderator-only poll creation UI.

## YouTube

- Removed the server-side YouTube Data API dependency.
- Removed the YouTube Data API key requirement; queue metadata now has a no-key fallback.
- The key is never exposed as a `VITE_*` browser variable.
- Added YouTube IFrame API timeout/error handling and a retry state.
- Room join now applies the server playback state and estimated time.
- Drift checking runs every second and corrects meaningful drift above 0.65 seconds.

## Files

### Changed

- `README.md`
- `server/server.js`
- `server/sockets/index.js`
- `server/.env.example`
- `client/src/pages/Landing.jsx`
- `client/src/pages/Home.jsx`
- `client/src/pages/RoomPage.jsx`
- `client/src/components/Room/Chat.jsx`
- `client/src/components/Room/Poll.jsx`
- `client/src/components/Room/ParticipantList.jsx`
- `client/src/components/Room/Queue.jsx`
- `client/src/components/Room/VideoPlayer.jsx`
- `client/src/components/Room/sidebar.css`
- `client/src/components/Room/poll.css`
- `client/src/components/Room/video-player.css`
- `client/src/hooks/useYouTubePlayer.js`

### Added

- `client/src/pages/landing.css`
- `client/src/components/Room/PollComposer.jsx`
- `client/src/api/youtube.js`
- `server/controllers/youtubeController.js`
- `server/routes/youtubeRoutes.js`
