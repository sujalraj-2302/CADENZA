const express = require('express');
const rateLimit = require('express-rate-limit');
const { signup, login, logout, me } = require('../controllers/authController');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

// Throttle auth endpoints to slow down credential stuffing / brute force.
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 30 });

router.post('/signup', authLimiter, signup);
router.post('/login', authLimiter, login);
router.post('/logout', logout);
router.get('/me', requireAuth, me);

module.exports = router;
