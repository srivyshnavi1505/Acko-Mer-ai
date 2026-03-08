import { io } from 'socket.io-client';

let socket = null;

export const connectSocket = () => {
  if (socket?.connected) return socket;

  socket = io(process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000', {
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
  });

  socket.on('connect', () => console.log('Socket connected:', socket.id));
  socket.on('disconnect', (reason) => console.log('Socket disconnected:', reason));
  socket.on('connect_error', (err) => console.error('Socket connection error:', err.message));

  return socket;
};

export const joinSession = (sessionId) => {
  if (socket) socket.emit('join:session', sessionId);
};

export const leaveSession = (sessionId) => {
  if (socket) socket.emit('leave:session', sessionId);
};

export const sendTranscriptionChunk = (sessionId, text) => {
  if (socket) socket.emit('transcription:chunk', { sessionId, text, timestamp: Date.now() });
};

export const sendTranscriptionAudioChunk = (sessionId, audioBlob) => {
  if (socket) socket.emit('transcription:audio_chunk', { sessionId, audioBlob, timestamp: Date.now() });
};

export const onEvent = (event, callback) => {
  if (socket) socket.on(event, callback);
  return () => { if (socket) socket.off(event, callback); };
};

export const disconnectSocket = () => {
  if (socket) { socket.disconnect(); socket = null; }
};

export const getSocket = () => socket;
