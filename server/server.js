require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const { Server } = require('socket.io');

const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const roomRoutes = require('./routes/roomRoutes');
const groupRoutes = require('./routes/groupRoutes');
const errorHandler = require('./middleware/errorHandler');
const registerSocketHandlers = require('./sockets');

const PORT = process.env.PORT || 5000;
const configuredOrigins = (process.env.CLIENT_URL || '')
  .split(',')
  .map((origin) => origin.trim().replace(/\/$/, ''))
  .filter(Boolean);
const allowedOrigins = new Set([
  ...configuredOrigins,
  'http://localhost:5173',
  'http://127.0.0.1:5173',
]);

async function start() {
  await connectDB();

  const app = express();
  const server = http.createServer(app);
  const io = new Server(server, {
    cors: { origin: [...allowedOrigins], credentials: true },
  });

  app.use(cors({ origin: [...allowedOrigins], credentials: true }));
  app.use(express.json());
  app.use(cookieParser());

  app.get('/api/health', (req, res) => res.json({ ok: true }));
  app.use('/api/auth', authRoutes);
  app.use('/api/rooms', roomRoutes);
  app.use('/api/groups', groupRoutes);

  app.use(errorHandler);

  registerSocketHandlers(io);

  server.listen(PORT, () => {
    console.log(`[cadenza] server listening on port ${PORT}`);
  });
}

start();
