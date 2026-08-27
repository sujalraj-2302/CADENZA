const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { signToken, setAuthCookie, clearAuthCookie } = require('../utils/token');

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

async function signup(req, res, next) {
  try {
    const { name, username, email, password, confirmPassword } = req.body;

    if (!name || !username || !email || !password || !confirmPassword) {
      return res.status(400).json({ error: 'All fields are required.' });
    }
    if (!EMAIL_RE.test(email)) {
      return res.status(400).json({ error: 'Enter a valid email address.' });
    }
    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters.' });
    }
    if (password !== confirmPassword) {
      return res.status(400).json({ error: 'Passwords do not match.' });
    }
    if (!/^[a-zA-Z0-9_]{3,24}$/.test(username)) {
      return res.status(400).json({ error: 'Username must be 3-24 characters (letters, numbers, underscore).' });
    }

    const existing = await User.findOne({
      $or: [{ email: email.toLowerCase() }, { username: username.toLowerCase() }],
    });
    if (existing) {
      if (existing.email === email.toLowerCase()) {
        return res.status(409).json({ error: 'Email already registered.' });
      }
      return res.status(409).json({ error: 'Username already exists.' });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await User.create({ name, username: username.toLowerCase(), email: email.toLowerCase(), passwordHash });

    const token = signToken(user._id.toString());
    setAuthCookie(res, token);
    res.status(201).json({ user: user.toSafeObject() });
  } catch (err) {
    next(err);
  }
}

async function login(req, res, next) {
  try {
    const { identifier, password } = req.body; // identifier = email or username
    if (!identifier || !password) {
      return res.status(400).json({ error: 'Email/username and password are required.' });
    }

    const user = await User.findOne({
      $or: [{ email: identifier.toLowerCase() }, { username: identifier.toLowerCase() }],
    });
    if (!user) return res.status(401).json({ error: 'Incorrect email or password.' });

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return res.status(401).json({ error: 'Incorrect email or password.' });

    const token = signToken(user._id.toString());
    setAuthCookie(res, token);
    res.json({ user: user.toSafeObject() });
  } catch (err) {
    next(err);
  }
}

function logout(req, res) {
  clearAuthCookie(res);
  res.json({ ok: true });
}

function me(req, res) {
  res.json({ user: req.user.toSafeObject() });
}

module.exports = { signup, login, logout, me };
