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

// --------------------------------------------------
// CORS CONFIGURATION
// --------------------------------------------------

const configuredOrigins = (process.env.CLIENT_URL || '')
  .split(',')
  .map((origin) => origin.trim().replace(/\/$/, ''))
  .filter(Boolean);

const allowedOrigins = new Set([
  ...configuredOrigins,
  'http://localhost:5173',
  'http://127.0.0.1:5173',
]);

// --------------------------------------------------
// START SERVER
// --------------------------------------------------

async function start() {
  try {
    // Connect to MongoDB first
    await connectDB();

    const app = express();

    // Create HTTP server
    const server = http.createServer(app);

    // --------------------------------------------------
    // SOCKET.IO
    // --------------------------------------------------

    const io = new Server(server, {
      cors: {
        origin: [...allowedOrigins],
        credentials: true,
      },
    });

    // --------------------------------------------------
    // MIDDLEWARE
    // --------------------------------------------------

    app.use(
      cors({
        origin: [...allowedOrigins],
        credentials: true,
      })
    );

    app.use(express.json());
    app.use(cookieParser());

    app.get('/', (req, res) => {
      res.status(200).json({
        ok: true,
        message: 'Cadenza API is running',
        health: '/api/health',
      });
    });

    // --------------------------------------------------
    // HEALTH CHECK
    // --------------------------------------------------

    app.get('/api/health', (req, res) => {
      res.status(200).json({
        ok: true,
        message: 'Cadenza server is running',
      });
    });

    // --------------------------------------------------
    // API ROUTES
    // --------------------------------------------------

    app.use('/api/auth', authRoutes);
    app.use('/api/rooms', roomRoutes);
    app.use('/api/groups', groupRoutes);

    // --------------------------------------------------
    // SOCKET HANDLERS
    // --------------------------------------------------

    registerSocketHandlers(io);

    // --------------------------------------------------
    // ERROR HANDLER
    // --------------------------------------------------

    app.use(errorHandler);

    // --------------------------------------------------
    // START LISTENING
    // --------------------------------------------------

    server.listen(PORT, () => {
      console.log('[cadenza] server listening on port ' + PORT);
      console.log('[cadenza] allowed origins: ' + [...allowedOrigins].join(', '));
    });
  } catch (error) {
    console.error('[cadenza] failed to start server:', error);
    process.exit(1);
  }
}

start();
