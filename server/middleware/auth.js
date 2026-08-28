const { verifyToken, COOKIE_NAME } = require('../utils/token');
const User = require('../models/User');

async function requireAuth(req, res, next) {
  try {
    const token = req.cookies[COOKIE_NAME];
    if (!token) return res.status(401).json({ error: 'Not authenticated.' });

    const payload = verifyToken(token);
    const user = await User.findById(payload.sub);
    if (!user) return res.status(401).json({ error: 'Not authenticated.' });

    req.userId = user._id.toString();
    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Not authenticated.' });
  }
}

async function attachUserIfPresent(req, res, next) {
  try {
    const token = req.cookies[COOKIE_NAME];
    if (!token) return next();
    const payload = verifyToken(token);
    const user = await User.findById(payload.sub);
    if (user) {
      req.userId = user._id.toString();
      req.user = user;
    }
    next();
  } catch (err) {
    next();
  }
}

module.exports = { requireAuth, attachUserIfPresent };
