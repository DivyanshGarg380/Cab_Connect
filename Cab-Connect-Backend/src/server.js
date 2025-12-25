import dotenv from 'dotenv';
dotenv.config();

import app from './app.js';
import { connectDB } from './config/db.js';
import { Server } from 'socket.io';
import http from 'http';
import { initChatSocket } from './sockets/chat.socket.js';
import { expireOldRides } from './jobs/expireRides.job.js';
import { deleteExpiredRides } from './jobs/deleteExpiredRides.job.js';

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

setInterval(expireOldRides, 5*60*1000);
setInterval(deleteExpiredRides, 30*60*1000);


server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
