import express from 'express';
import cors from 'cors';
import compression from 'compression';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { apiLimit } from './middleware/rateLimit.middleware.js';

// Lazy-load heavy swagger deps — don't pay the cost on every worker startup
// in production unless /docs is actually hit
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

import authRoutes         from './routes/auth.routes.js';
import rideRoutes         from './routes/ride.routes.js';
import adminRoutes        from './routes/admin.route.js';
import notificationRoutes from './routes/notification.route.js';
import reportRoutes       from './routes/report.routes.js';
import adminReportRoutes  from './routes/adminReport.routes.js';
import userRoutes         from './routes/userRoutes.js';

const app = express();

// ── Security ──────────────────────────────────────────────────────────────────
app.use(helmet());
app.set('trust proxy', 1);

// ── Perf ─────────────────────────────────────────────────────────────────────
// compression: ~70% smaller payloads
// threshold: 1kb — don't compress tiny responses (overhead > gain)
app.use(compression({ threshold: 1024 }));

// ── Parsing ───────────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json({ limit: '10kb' }));
app.use(cookieParser());

// ── Rate limiting ─────────────────────────────────────────────────────────────
app.use(apiLimit);

// ── Routes ────────────────────────────────────────────────────────────────────
app.get('/', (req, res) => res.send('Cab Connect Backend is running'));
app.get('/health', (req, res) => res.status(200).json({ ok: true, pid: process.pid }));

app.get('/docs*', lazySwagger);

app.use('/users',          userRoutes);
app.use('/auth',           authRoutes);
app.use('/rides',          rideRoutes);
app.use('/admin',          adminRoutes);
app.use('/notifications',  notificationRoutes);
app.use('/reports',        reportRoutes);
app.use('/admin/reports',  adminReportRoutes);

// ── Global error handler ─────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ message: 'Internal server error' });
});

export default app;
