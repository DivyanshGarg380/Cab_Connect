import { io } from 'socket.io-client';

const ACCESS_TOKEN = "Test Done";
const RIDE_ID = "Test Done";

const socket = io('http://localhost:5000', {
    auth: { token: ACCESS_TOKEN },
});

socket.on('connect', () => {
    console.log('Connected as socket id:', socket.id);

    socket.emit('join-ride', RIDE_ID);

    socket.emit('send-message', {
        rideId: RIDE_ID,
        content: 'Hello from backend Test Script!',
    });
});

// Test complete for Chat features