const { customAlphabet } = require('nanoid');

// Unambiguous uppercase alphabet (no 0/O, 1/I) for room codes people type by hand.
const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const nanoid = customAlphabet(alphabet, 6);

function generateRoomCode() {
  return nanoid();
}

module.exports = generateRoomCode;
