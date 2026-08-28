const mongoose = require('mongoose');

const QueueItemSchema = new mongoose.Schema(
  {
    videoId: { type: String, required: true },
    title: { type: String, default: '' },
    thumbnail: { type: String, default: '' },
    duration: { type: Number, default: null },
    addedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    addedByName: { type: String, default: 'Someone' },
    votes: { type: [mongoose.Schema.Types.ObjectId], default: [] },
  },
  { _id: true, timestamps: true }
);

const ParticipantSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    role: { type: String, enum: ['host', 'moderator', 'participant'], default: 'participant' },
    joinedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const RoomSchema = new mongoose.Schema(
  {
    roomCode: { type: String, required: true, unique: true, uppercase: true },
    name: { type: String, required: true, trim: true, maxlength: 60 },
    host: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    hostConnected: { type: Boolean, default: true },
    participants: { type: [ParticipantSchema], default: [] },
    privacy: { type: String, enum: ['private', 'link-only', 'public'], default: 'link-only' },
    theme: { type: String, default: 'midnight-cinema' },

    currentVideo: {
      videoId: { type: String, default: null },
      title: { type: String, default: '' },
      thumbnail: { type: String, default: '' },
    },
    playbackState: { type: String, enum: ['playing', 'paused'], default: 'paused' },
    currentTime: { type: Number, default: 0 },
    lastUpdatedAt: { type: Date, default: Date.now },

    queue: { type: [QueueItemSchema], default: [] },

    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Room', RoomSchema);
