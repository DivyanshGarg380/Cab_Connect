import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth.routes.js';
import cookieParser from 'cookie-parser';
import rideRoutes from './routes/ride.routes.js';
import { apiLimit } from './middleware/rateLimit.middleware.js';
import adminRoutes from './routes/admin.route.js';

const app = express();
app.use(apiLimit);
app.use(cors());
app.use(express.json());
app.use(cookieParser());
app.use('/admin', adminRoutes);

app.get('/', (req, res) => {
  res.send('Cab Connect Backend is running');
});
app.use('/auth', authRoutes);
app.use('/rides', rideRoutes);

export default app;
