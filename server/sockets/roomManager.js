const Room = require('../models/Room');

/**
 * RoomManager holds the authoritative, in-memory state for every *live*
 * room (who's connected, current playback position, etc). Persistent
 * facts (queue contents, participant roster, room settings) are written
 * through to MongoDB; highly dynamic playback ticks are not, so we don't
 * hammer the database every time someone's video position changes.
 *
 * Keyed by roomCode. One process = one instance of this map, which is
 * exactly the seam you'd swap for a Redis-backed store when scaling to
 * multiple Socket.IO instances (see README "Scaling").
 */
class RoomManager {
  constructor() {
    this.liveRooms = new Map(); // roomCode -> LiveRoomState
  }

  getOrCreate(roomCode) {
    if (!this.liveRooms.has(roomCode)) {
      this.liveRooms.set(roomCode, {
        sockets: new Map(), // socketId -> { userId, name, avatarUrl, role }
        playbackState: 'paused',
        currentTime: 0,
        lastTick: Date.now(),
        typing: new Set(),
      });
    }
    return this.liveRooms.get(roomCode);
  }

  addSocket(roomCode, socketId, participant) {
    const live = this.getOrCreate(roomCode);
    live.sockets.set(socketId, participant);
    return live;
  }

  removeSocket(roomCode, socketId) {
    const live = this.liveRooms.get(roomCode);
    if (!live) return null;
    live.sockets.delete(socketId);
    if (live.sockets.size === 0) {
      // Keep playback state around briefly isn't necessary - drop it.
      this.liveRooms.delete(roomCode);
    }
    return live;
  }

  getParticipants(roomCode) {
    const live = this.liveRooms.get(roomCode);
    if (!live) return [];
    return Array.from(live.sockets.values());
  }

  count(roomCode) {
    const live = this.liveRooms.get(roomCode);
    return live ? live.sockets.size : 0;
  }

  // Interpolates current playback position based on elapsed real time.
  getEstimatedTime(roomCode) {
    const live = this.liveRooms.get(roomCode);
    if (!live) return 0;
    if (live.playbackState !== 'playing') return live.currentTime;
    const elapsed = (Date.now() - live.lastTick) / 1000;
    return live.currentTime + elapsed;
  }

  setPlayback(roomCode, { state, time }) {
    const live = this.getOrCreate(roomCode);
    if (state) live.playbackState = state;
    if (typeof time === 'number') live.currentTime = time;
    live.lastTick = Date.now();
    return live;
  }

  findRole(roomCode, socketId) {
    const live = this.liveRooms.get(roomCode);
    const p = live && live.sockets.get(socketId);
    return p ? p.role : null;
  }

  canControlPlayback(roomCode, socketId) {
    const role = this.findRole(roomCode, socketId);
    return role === 'host' || role === 'moderator';
  }

  isHost(roomCode, socketId) {
    return this.findRole(roomCode, socketId) === 'host';
  }

  // Periodically flush the playback position to MongoDB so it survives
  // server restarts / late joiners hitting the REST API. Called on a
  // low-frequency interval, not on every socket event.
  async persistPlaybackSnapshot(roomCode) {
    const live = this.liveRooms.get(roomCode);
    if (!live) return;
    try {
      await Room.findOneAndUpdate(
        { roomCode },
        {
          playbackState: live.playbackState,
          currentTime: this.getEstimatedTime(roomCode),
          lastUpdatedAt: new Date(),
        }
      );
    } catch (err) {
      console.error('[roomManager] failed to persist snapshot for', roomCode, err.message);
    }
  }
}

module.exports = new RoomManager();
