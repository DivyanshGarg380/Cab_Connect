import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth.routes.js';
import cookieParser from 'cookie-parser';
import rideRoutes from './routes/ride.routes.js';
import { apiLimit } from './middleware/rateLimit.middleware.js';
import adminRoutes from './routes/admin.route.js';
import notificationRoutes from './routes/notification.route.js';


const app = express();
app.use(apiLimit);
app.use(cors());
app.use(express.json());
app.use(cookieParser());


app.get('/', (req, res) => {
  res.send('Cab Connect Backend is running');
});
app.use('/auth', authRoutes);
app.use('/rides', rideRoutes);
app.use('/admin', adminRoutes);
app.use('/notifications', notificationRoutes);

export default app;
