const { customAlphabet } = require('nanoid');

const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const nanoid = customAlphabet(alphabet, 6);

function generateRoomCode() {
  return nanoid();
}

module.exports = generateRoomCode;
