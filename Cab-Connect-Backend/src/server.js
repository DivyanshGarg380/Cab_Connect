import dotenv from 'dotenv';
dotenv.config();

import app from './app.js';
import { connectDB } from './config/db.js';
import { Server } from 'socket.io';
import http from 'http';
import { initChatSocket } from './sockets/chat.socket.js';

const PORT = process.env.PORT || 5000;

connectDB();

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*", // will tighten later -_-
  }
});


initChatSocket(io);

export { io };

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
