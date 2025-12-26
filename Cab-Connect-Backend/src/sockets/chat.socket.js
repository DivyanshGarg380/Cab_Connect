import jwt from 'jsonwebtoken';
import Ride from '../models/Ride.model.js';
import Message from '../models/Message.model.js';
import User from "../models/User.model.js"

export const initChatSocket = (io) => {
    io.use((socket, next) => {
        const token = socket.handshake.auth?.token;

        if (!token) {
            return next(new Error('Unauthenticated: No token provided'));
        }

        try {
            const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
            socket.userId = decoded.userId;
            next();
        } catch (err) {
            return next(new Error('Unauthenticated: Invalid token'));
        }
    });

    io.on('connection', (socket) => {
        console.log(`Socket connected: ${socket.userId}`);
        socket.join(socket.userId);
        // join ride chat
        socket.on('join-ride', async (rideId) => {
            const ride = await Ride.findById(rideId);

            if (!ride) {
                return socket.emit('error', 'Ride not found');
            }

            if(ride.status === 'expired'){
                return socket.emit('error', 'Ride has Expired');
            }

            const isParticipant = ride.participants.some(
                (p) => p.toString() === socket.userId
            );

            if (!isParticipant) {
                return socket.emit('error', 'Access denied to this ride chat');
            }

            socket.join(rideId);
            console.log(`User ${socket.userId} joined ride ${rideId}`);
        });5

        // sending messages
        socket.on('send-message', async ({ rideId, content }) => {
            const ride = await Ride.findById(rideId);

            const user = await User.findById(socket.userId);

            if(!user){
                return socket.emit('error', 'User not found');
            }

            if (user.isPermanentlyBanned || (user.banUntil && user.banUntil > new Date())) {
                 return socket.emit('error', 'You are banned from Conversing in this chat');
            }

            if(!ride || ride.status === 'expired'){
                socket.emit('ride-ended', {
                    message: 'This ride is no longer active',
                });
                socket.leave(rideId);
                return;
            }
            const isParticipant = ride.participants.some(
                (p) => p.toString() === socket.userId
            );
            if (!isParticipant) {
                return socket.emit('error', 'Access denied to this ride chat');
            }

            if (!content || !content.trim()) {
                return socket.emit('error', 'Message cannot be empty');
            }

            if(content.length > 500){
                return socket.emit('error', 'Message too long');
            }

            const message = await Message.create({
                ride: rideId,
                sender: socket.userId,
                text: content,
            });

            console.log(
             `Message from ${socket.userId} in ride ${rideId}: ${content}`
            );

            io.to(rideId).emit('new-message', {
                rideId,
                sender: socket.userId,
                text: message.text,
                createdAt: message.createdAt,
            });
        });
    });
};