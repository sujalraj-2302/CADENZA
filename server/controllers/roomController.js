const Room = require('../models/Room');
const generateRoomCode = require('../utils/generateRoomCode');

async function createRoom(req, res, next) {
  try {
    const { name, privacy, theme } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Room name is required.' });
    }

    let roomCode;
    for (let attempts = 0; attempts < 5; attempts++) {
      const candidate = generateRoomCode();
      // eslint-disable-next-line no-await-in-loop
      const clash = await Room.findOne({ roomCode: candidate });
      if (!clash) {
        roomCode = candidate;
        break;
      }
    }
    if (!roomCode) return res.status(500).json({ error: 'Could not generate a room code, try again.' });

    const room = await Room.create({
      roomCode,
      name: name.trim(),
      host: req.userId,
      privacy: ['private', 'link-only', 'public'].includes(privacy) ? privacy : 'link-only',
      theme: theme || 'midnight-cinema',
      participants: [{ user: req.userId, role: 'host' }],
    });

    res.status(201).json({ room });
  } catch (err) {
    next(err);
  }
}

async function getRoom(req, res, next) {
  try {
    const room = await Room.findOne({ roomCode: req.params.roomCode.toUpperCase() })
      .populate('host', 'name username avatarUrl')
      .populate('participants.user', 'name username avatarUrl');

    if (!room || !room.active) return res.status(404).json({ error: 'Room not found.' });

    if (room.privacy === 'private') {
      const isParticipant = room.participants.some((p) => p.user._id.toString() === req.userId);
      if (!isParticipant) return res.status(403).json({ error: 'This room is private.' });
    }

    res.json({ room });
  } catch (err) {
    next(err);
  }
}

async function joinRoom(req, res, next) {
  try {
    const room = await Room.findOne({ roomCode: req.params.roomCode.toUpperCase() });
    if (!room || !room.active) return res.status(404).json({ error: 'Room not found.' });

    const already = room.participants.some((p) => p.user.toString() === req.userId);
    if (!already) {
      room.participants.push({ user: req.userId, role: 'participant' });
      await room.save();
    }

    res.json({ room });
  } catch (err) {
    next(err);
  }
}

async function leaveRoom(req, res, next) {
  try {
    const room = await Room.findOne({ roomCode: req.params.roomCode.toUpperCase() });
    if (!room) return res.status(404).json({ error: 'Room not found.' });

    room.participants = room.participants.filter((p) => p.user.toString() !== req.userId);
    await room.save();

    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
}

module.exports = { createRoom, getRoom, joinRoom, leaveRoom };
