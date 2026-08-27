const express = require('express');
const { createRoom, getRoom, joinRoom, leaveRoom } = require('../controllers/roomController');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

router.use(requireAuth);

router.post('/', createRoom);
router.get('/:roomCode', getRoom);
router.post('/:roomCode/join', joinRoom);
router.post('/:roomCode/leave', leaveRoom);

module.exports = router;
