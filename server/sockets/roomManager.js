const Room = require('../models/Room');

class RoomManager {
  constructor() {
    this.liveRooms = new Map();
  }

  getOrCreate(roomCode) {
    if (!this.liveRooms.has(roomCode)) {
      this.liveRooms.set(roomCode, {
        sockets: new Map(),
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
