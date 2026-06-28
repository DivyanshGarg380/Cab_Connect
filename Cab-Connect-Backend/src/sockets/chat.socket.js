import jwt from 'jsonwebtoken';
import Ride from '../models/Ride.model.js';
import Message from '../models/Message.model.js';
import User from "../models/User.model.js";
import { invalidateRideMessagesCache } from "../utils/cacheInvalidate.js";

const JWT_SECRET = process.env.JWT_ACCESS_SECRET;

export const initChatSocket = (io) => {
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error('Unauthenticated: No token provided'));

    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      socket.userId = decoded.userId;
      next();
    } catch {
      next(new Error('Unauthenticated: Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    socket.join(socket.userId);

    socket.on('join-ride', async (rideId) => {
      try {
        const ride = await Ride.findById(rideId)
          .select("status participants")
          .lean();

        if (!ride) return socket.emit('error', 'Ride not found');
        if (ride.status === 'expired') return socket.emit('error', 'Ride has expired');

        const isParticipant = ride.participants.some(
          (p) => p.toString() === socket.userId
        );
        if (!isParticipant) return socket.emit('error', 'Access denied to this ride chat');

        socket.join(rideId);
      } catch (err) {
        console.error('join-ride error:', err.message);
        socket.emit('error', 'Server error');
      }
    });

    socket.on('send-message', async ({ rideId, content }) => {
      try {
        if (!content || !content.trim()) return socket.emit('error', 'Message cannot be empty');
        if (content.length > 500) return socket.emit('error', 'Message too long');

        
        const [ride, user] = await Promise.all([
          Ride.findById(rideId).select("status participants").lean(),
          User.findById(socket.userId).select("isPermanantlyBanned banUntil").lean(),
        ]);

        if (!user) return socket.emit('error', 'User not found');

        if (user.isPermanantlyBanned || (user.banUntil && user.banUntil > new Date())) {
          return socket.emit('error', 'You are banned from conversing in this chat');
        }

        if (!ride || ride.status === 'expired') {
          socket.emit('ride-ended', { message: 'This ride is no longer active' });
          socket.leave(rideId);
          return;
        }

        const isParticipant = ride.participants.some(
          (p) => p.toString() === socket.userId
        );
        if (!isParticipant) return socket.emit('error', 'Access denied to this ride chat');

        const message = await Message.create({
          ride: rideId,
          sender: socket.userId,
          text: content.trim(),
        });

        await invalidateRideMessagesCache(rideId);

        io.to(rideId).emit('new-message', {
          rideId,
          sender: socket.userId,
          text: message.text,
          createdAt: message.createdAt,
        });
      } catch (err) {
        console.error('send-message error:', err.message);
        socket.emit('error', 'Server error');
      }
    });
  });
};