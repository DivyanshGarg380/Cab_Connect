import express from 'express';
import cors from 'cors';
import compression from 'compression';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { apiLimit } from './middleware/rateLimit.middleware.js';

let swaggerReady = false;

const lazySwagger = async (req, res, next) => {
  if (!swaggerReady) {
    const [{ default: swaggerUi }, { default: swaggerSpec }] = await Promise.all([
      import('swagger-ui-express'),
      import('./swagger.js'),
    ]);
    req.app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
    swaggerReady = true;
  }
  next();
};

import authRoutes from './routes/auth.routes.js';
import rideRoutes from './routes/ride.routes.js';
import adminRoutes from './routes/admin.route.js';
import notificationRoutes from './routes/notification.route.js';
import reportRoutes from './routes/report.routes.js';
import adminReportRoutes  from './routes/adminReport.routes.js';
import userRoutes from './routes/userRoutes.js';

const app = express();

app.use(helmet());
app.set('trust proxy', 1);

app.use(compression({ threshold: 1024 }));

app.use(cors());
app.use(express.json({ limit: '10kb' }));
app.use(cookieParser());

app.use(apiLimit);

app.get('/', (req, res) => res.send('Cab Connect Backend is running'));
app.get('/health', (req, res) => res.status(200).json({ ok: true, pid: process.pid }));

app.get('/docs', lazySwagger);
app.get('/docs/*splat', lazySwagger);

app.use('/users', userRoutes);
app.use('/auth', authRoutes);
app.use('/rides', rideRoutes);
app.use('/admin', adminRoutes);
app.use('/notifications', notificationRoutes);
app.use('/reports', reportRoutes);
app.use('/admin/reports', adminReportRoutes);

app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ message: 'Internal server error' });
});

export default app;
