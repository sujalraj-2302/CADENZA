const cookie = require('cookie');
const { verifyToken, COOKIE_NAME } = require('../utils/token');
const User = require('../models/User');
const Room = require('../models/Room');
const roomManager = require('./roomManager');

const DRIFT_THRESHOLD_SECONDS = 0.65; // correct meaningful drift without visible jitter
const SNAPSHOT_INTERVAL_MS = 8000;

function registerSocketHandlers(io) {
  // Authenticate the socket using the same httpOnly cookie the REST API uses.
  io.use(async (socket, next) => {
    try {
      const raw = socket.handshake.headers.cookie || '';
      const parsed = cookie.parse(raw);
      const token = parsed[COOKIE_NAME];
      if (!token) return next(new Error('unauthenticated'));

      const payload = verifyToken(token);
      const user = await User.findById(payload.sub);
      if (!user) return next(new Error('unauthenticated'));

      socket.userId = user._id.toString();
      socket.userName = user.name;
      socket.avatarUrl = user.avatarUrl;
      next();
    } catch (err) {
      next(new Error('unauthenticated'));
    }
  });

  io.on('connection', (socket) => {
    let currentRoomCode = null;

    socket.on('join_room', async ({ roomCode }, ack) => {
      try {
        const code = (roomCode || '').toUpperCase();
        const room = await Room.findOne({ roomCode: code });
        if (!room || !room.active) return ack && ack({ error: 'Room not found' });

        const membership = room.participants.find((p) => p.user.toString() === socket.userId);
        const role = membership ? membership.role : 'participant';

        if (role === 'host' && room.hostConnected === false) {
          room.hostConnected = true;
          await room.save();
        }

        currentRoomCode = code;
        socket.join(code);
        roomManager.addSocket(code, socket.id, {
          socketId: socket.id,
          userId: socket.userId,
          name: socket.userName,
          avatarUrl: socket.avatarUrl,
          role,
        });

        // Bring the live in-memory clock in sync with the DB snapshot the
        // first time this room becomes live in this process.
        const live = roomManager.getOrCreate(code);
        if (roomManager.count(code) === 1) {
          roomManager.setPlayback(code, { state: room.playbackState, time: room.currentTime });
        }

        socket.to(code).emit('user_joined', {
          socketId: socket.id,
          userId: socket.userId,
          name: socket.userName,
          role,
          count: roomManager.count(code),
        });

        ack &&
          ack({
            room,
            playback: {
              state: live.playbackState,
              time: roomManager.getEstimatedTime(code),
            },
            participants: roomManager.getParticipants(code),
            hostConnected: room.hostConnected !== false,
          });
      } catch (err) {
        ack && ack({ error: 'Could not join room' });
      }
    });

    socket.on('leave_room', () => leaveCurrentRoom());

    // --- Playback control (host/moderator only, server-enforced) ---
    socket.on('play', ({ time }) => {
      if (!currentRoomCode || !roomManager.canControlPlayback(currentRoomCode, socket.id)) return;
      roomManager.setPlayback(currentRoomCode, { state: 'playing', time });
      roomManager.persistPlaybackSnapshot(currentRoomCode);
      socket.to(currentRoomCode).emit('play', { time });
    });

    socket.on('pause', ({ time }) => {
      if (!currentRoomCode || !roomManager.canControlPlayback(currentRoomCode, socket.id)) return;
      roomManager.setPlayback(currentRoomCode, { state: 'paused', time });
      roomManager.persistPlaybackSnapshot(currentRoomCode);
      socket.to(currentRoomCode).emit('pause', { time });
    });

    socket.on('seek', ({ time }) => {
      if (!currentRoomCode || !roomManager.canControlPlayback(currentRoomCode, socket.id)) return;
      roomManager.setPlayback(currentRoomCode, { time });
      roomManager.persistPlaybackSnapshot(currentRoomCode);
      socket.to(currentRoomCode).emit('seek', { time });
    });

    // Clients report their local time; server only corrects on real drift,
    // never on every tick, to keep playback smooth.
    socket.on('report_time', ({ time, state }) => {
      if (!currentRoomCode || typeof time !== 'number') return;
      const live = roomManager.liveRooms.get(currentRoomCode);
      if (!live) return;
      const authoritative = roomManager.getEstimatedTime(currentRoomCode);
      const drifted = Math.abs(authoritative - time) > DRIFT_THRESHOLD_SECONDS;
      const stateMismatch = state && state !== live.playbackState;
      if (drifted) socket.emit('seek', { time: authoritative });
      if (stateMismatch) socket.emit(live.playbackState, { time: authoritative });
    });

    async function startVideo(roomCode, video) {
      roomManager.setPlayback(roomCode, { state: 'playing', time: 0 });
      await Room.findOneAndUpdate(
        { roomCode },
        { currentVideo: { videoId: video.videoId, title: video.title || '', thumbnail: video.thumbnail || '' }, playbackState: 'playing', currentTime: 0 }
      );
      io.to(roomCode).emit('change_video', {
        videoId: video.videoId,
        title: video.title || '',
        thumbnail: video.thumbnail || '',
      });
    }

    socket.on('change_video', async ({ videoId, title, thumbnail }) => {
      if (!currentRoomCode || !roomManager.canControlPlayback(currentRoomCode, socket.id)) return;
      if (!/^[a-zA-Z0-9_-]{11}$/.test(videoId || '')) return;
      await startVideo(currentRoomCode, { videoId, title, thumbnail });
    });

    // --- Queue ---
    socket.on('add_to_queue', async ({ videoId, title, thumbnail, duration }) => {
      if (!currentRoomCode || !/^[a-zA-Z0-9_-]{11}$/.test(videoId || '')) return;
      const room = await Room.findOne({ roomCode: currentRoomCode });
      if (!room) return;

      const video = { videoId, title: title || '', thumbnail: thumbnail || '', duration: Number.isFinite(duration) ? duration : null };

      // If a host/moderator adds the first video to an empty room, start it
      // immediately. This removes the old dead-end where videos could be
      // added to the queue but no client ever emitted change_video.
      if (!room.currentVideo?.videoId && roomManager.canControlPlayback(currentRoomCode, socket.id)) {
        await startVideo(currentRoomCode, video);
        return;
      }

      room.queue.push({ ...video, addedBy: socket.userId, addedByName: socket.userName });
      await room.save();
      io.to(currentRoomCode).emit('queue_updated', { queue: room.queue });
    });

    socket.on('play_queue_item', async ({ _id, videoId, title, thumbnail }) => {
      if (!currentRoomCode || !roomManager.canControlPlayback(currentRoomCode, socket.id)) return;
      const room = await Room.findOne({ roomCode: currentRoomCode });
      if (!room) return;
      const item = _id ? room.queue.id(_id) : null;
      if (!item && !videoId) return;

      const video = item
        ? { videoId: item.videoId, title: item.title, thumbnail: item.thumbnail }
        : { videoId, title: title || '', thumbnail: thumbnail || '' };

      if (item) {
        room.queue = room.queue.filter((q) => q._id.toString() !== _id);
        await room.save();
        io.to(currentRoomCode).emit('queue_updated', { queue: room.queue });
      }

      await startVideo(currentRoomCode, video);
    });

    socket.on('remove_from_queue', async ({ itemId }) => {
      if (!currentRoomCode || !roomManager.canControlPlayback(currentRoomCode, socket.id)) return;
      const room = await Room.findOne({ roomCode: currentRoomCode });
      if (!room) return;
      room.queue = room.queue.filter((q) => q._id.toString() !== itemId);
      await room.save();
      io.to(currentRoomCode).emit('queue_updated', { queue: room.queue });
    });

    socket.on('vote_queue_item', async ({ itemId }) => {
      if (!currentRoomCode) return;
      const room = await Room.findOne({ roomCode: currentRoomCode });
      if (!room) return;
      const item = room.queue.id(itemId);
      if (!item) return;
      const idx = item.votes.findIndex((v) => v.toString() === socket.userId);
      if (idx >= 0) item.votes.splice(idx, 1);
      else item.votes.push(socket.userId);
      await room.save();
      io.to(currentRoomCode).emit('queue_updated', { queue: room.queue });
    });

    socket.on('video_ended', async () => {
      if (!currentRoomCode || !roomManager.canControlPlayback(currentRoomCode, socket.id)) return;
      const room = await Room.findOne({ roomCode: currentRoomCode });
      if (!room) return;

      if (room.queue.length === 0) {
        roomManager.setPlayback(currentRoomCode, { state: 'paused', time: 0 });
        await Room.findOneAndUpdate({ roomCode: currentRoomCode }, { playbackState: 'paused', currentTime: 0 });
        io.to(currentRoomCode).emit('pause', { time: 0 });
        return;
      }

      const next = [...room.queue].sort((a, b) => b.votes.length - a.votes.length || new Date(a.createdAt) - new Date(b.createdAt))[0];
      room.queue = room.queue.filter((q) => q._id.toString() !== next._id.toString());
      await room.save();
      io.to(currentRoomCode).emit('queue_updated', { queue: room.queue });
      await startVideo(currentRoomCode, next);
    });

    // --- Reactions ---
    socket.on('react', ({ emoji, videoTime }) => {
      if (!currentRoomCode) return;
      io.to(currentRoomCode).emit('reaction', {
        emoji,
        videoTime,
        userId: socket.userId,
        name: socket.userName,
        at: Date.now(),
      });
    });

    // --- Chat ---
    socket.on('send_message', ({ text, replyTo, videoId, videoTime }) => {
      if (!currentRoomCode || !text || !text.trim()) return;
      const clean = text.trim().slice(0, 500); // basic sanitation: length cap; React escapes output
      io.to(currentRoomCode).emit('message', {
        id: `${socket.id}-${Date.now()}`,
        text: clean,
        replyTo: replyTo || null,
        userId: socket.userId,
        name: socket.userName,
        videoId: typeof videoId === 'string' ? videoId : null,
        videoTime: typeof videoTime === 'number' ? Math.max(0, videoTime) : null,
        at: Date.now(),
      });
    });

    // --- Room audio signaling ---
    socket.on('audio_offer', ({ to, offer }) => {
      if (!currentRoomCode || !to || !offer) return;
      io.to(to).emit('audio_offer', { from: socket.id, offer });
    });
    socket.on('audio_answer', ({ to, answer }) => {
      if (!currentRoomCode || !to || !answer) return;
      io.to(to).emit('audio_answer', { from: socket.id, answer });
    });
    socket.on('audio_ice', ({ to, candidate }) => {
      if (!currentRoomCode || !to || !candidate) return;
      io.to(to).emit('audio_ice', { from: socket.id, candidate });
    });
    socket.on('audio_state', ({ enabled }) => {
      if (!currentRoomCode) return;
      io.to(currentRoomCode).emit('audio_state', { socketId: socket.id, userId: socket.userId, enabled: Boolean(enabled) });
    });
    socket.on('audio_mute', ({ socketId, muted }) => {
      if (!currentRoomCode || !roomManager.canControlPlayback(currentRoomCode, socket.id) || !socketId) return;
      io.to(socketId).emit('audio_mute', { muted: Boolean(muted) });
      io.to(currentRoomCode).emit('audio_mute_state', { socketId, muted: Boolean(muted) });
    });

    socket.on('react_message', ({ messageId, emoji }) => {
      if (!currentRoomCode || !messageId || typeof emoji !== 'string') return;
      const allowed = ['❤️', '😂', '🔥', '👏', '😱'];
      if (!allowed.includes(emoji)) return;
      io.to(currentRoomCode).emit('message_reaction', { messageId, emoji, userId: socket.userId, at: Date.now() });
    });

    socket.on('typing', ({ isTyping }) => {
      if (!currentRoomCode) return;
      socket.to(currentRoomCode).emit('typing', { userId: socket.userId, name: socket.userName, isTyping });
    });

    // --- Roles (host only) ---
    socket.on('assign_role', async ({ userId, role }) => {
      if (!currentRoomCode || !roomManager.isHost(currentRoomCode, socket.id)) return;
      if (!['moderator', 'participant'].includes(role)) return;

      const room = await Room.findOne({ roomCode: currentRoomCode });
      if (!room) return;
      const member = room.participants.find((p) => p.user.toString() === userId);
      if (!member) return;
      member.role = role;
      await room.save();

      const live = roomManager.liveRooms.get(currentRoomCode);
      if (live) {
        for (const [, p] of live.sockets) {
          if (p.userId === userId) p.role = role;
        }
      }
      io.to(currentRoomCode).emit('role_assigned', { userId, role });
    });

    socket.on('remove_participant', async ({ userId }) => {
      if (!currentRoomCode || !roomManager.isHost(currentRoomCode, socket.id)) return;
      const room = await Room.findOne({ roomCode: currentRoomCode });
      if (!room) return;
      room.participants = room.participants.filter((p) => p.user.toString() !== userId);
      await room.save();

      const live = roomManager.liveRooms.get(currentRoomCode);
      if (live) {
        for (const [sid, p] of live.sockets) {
          if (p.userId === userId) {
            io.to(sid).emit('participant_removed', { userId });
            io.sockets.sockets.get(sid)?.leave(currentRoomCode);
          }
        }
      }
      io.to(currentRoomCode).emit('user_left', { userId, count: roomManager.count(currentRoomCode) });
    });

    // --- Theme ---
    socket.on('change_theme', async ({ theme }) => {
      if (!currentRoomCode || !roomManager.canControlPlayback(currentRoomCode, socket.id)) return;
      await Room.findOneAndUpdate({ roomCode: currentRoomCode }, { theme });
      io.to(currentRoomCode).emit('theme_changed', { theme });
    });

    // --- Polls (lightweight, in-memory per live room) ---
    socket.on('create_poll', ({ question, options }) => {
      if (!currentRoomCode || !roomManager.canControlPlayback(currentRoomCode, socket.id)) return;
      const live = roomManager.getOrCreate(currentRoomCode);
      live.poll = {
        question,
        options: options.map((text) => ({ text, votes: [] })),
        createdAt: Date.now(),
      };
      io.to(currentRoomCode).emit('poll_created', live.poll);
    });

    socket.on('vote_poll', ({ optionIndex }) => {
      if (!currentRoomCode) return;
      const live = roomManager.liveRooms.get(currentRoomCode);
      if (!live || !live.poll) return;
      live.poll.options.forEach((o) => {
        o.votes = o.votes.filter((v) => v !== socket.userId);
      });
      if (live.poll.options[optionIndex]) live.poll.options[optionIndex].votes.push(socket.userId);
      io.to(currentRoomCode).emit('poll_updated', live.poll);
    });

    socket.on('disconnect', () => leaveCurrentRoom());

    function leaveCurrentRoom() {
      if (!currentRoomCode) return;
      const roomCode = currentRoomCode;
      const wasHost = roomManager.isHost(currentRoomCode, socket.id);
      roomManager.persistPlaybackSnapshot(roomCode);
      roomManager.removeSocket(currentRoomCode, socket.id);
      if (wasHost) {
        Room.findOneAndUpdate({ roomCode: currentRoomCode }, { hostConnected: false }).catch((err) => console.error('[room] host disconnect update failed:', err.message));
      }
      socket.leave(currentRoomCode);

      io.to(currentRoomCode).emit('user_left', {
        userId: socket.userId,
        count: roomManager.count(currentRoomCode),
        wasHost,
      });

      currentRoomCode = null;
    }
  });

  // Periodically persist live playback snapshots so state survives restarts
  // and REST clients (e.g. a fresh page load) see an up-to-date position.
  setInterval(() => {
    for (const roomCode of roomManager.liveRooms.keys()) {
      roomManager.persistPlaybackSnapshot(roomCode);
    }
  }, SNAPSHOT_INTERVAL_MS);
}

module.exports = registerSocketHandlers;
