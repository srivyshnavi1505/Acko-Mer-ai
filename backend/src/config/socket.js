const { Server } = require('socket.io');
const logger = require('./logger');

let io = null;

const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:3000',
      methods: ['GET', 'POST'],
      credentials: true,
    },
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  io.on('connection', (socket) => {
    logger.info(`Socket connected: ${socket.id}`);

    socket.on('join:session', (sessionId) => {
      socket.join(`session:${sessionId}`);
      logger.info(`Socket ${socket.id} joined session:${sessionId}`);
      socket.emit('joined', { sessionId });
    });

    socket.on('leave:session', (sessionId) => socket.leave(`session:${sessionId}`));

    socket.on('transcription:chunk', (data) => {
      socket.to(`session:${data.sessionId}`).emit('transcription:update', data);
    });

    socket.on('transcription:audio_chunk', async (data) => {
      // Process partial audio chunk for real-time transcription
      try {
        const { transcribeAudio } = require('../services/openaiService');
        const result = await transcribeAudio(data.audioBlob, 'en'); // Assume language
        socket.to(`session:${data.sessionId}`).emit('transcription:partial', {
          text: result.text,
          timestamp: data.timestamp
        });
      } catch (err) {
        console.error('Partial transcription error:', err);
      }
    });

    socket.on('disconnect', (reason) => logger.info(`Socket ${socket.id} disconnected: ${reason}`));
    socket.on('error', (err) => logger.error(`Socket error ${socket.id}:`, err.message));
  });

  return io;
};

const getIO = () => io;
const emitToSession = (sessionId, event, data) => {
  if (io) io.to(`session:${sessionId}`).emit(event, data);
};

module.exports = { initSocket, getIO, emitToSession };
