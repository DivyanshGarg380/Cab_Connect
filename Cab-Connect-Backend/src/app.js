import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth.routes.js';
import cookieParser from 'cookie-parser';
import rideRoutes from './routes/ride.routes.js';
import { apiLimit } from './middleware/rateLimit.middleware.js';
import adminRoutes from './routes/admin.route.js';
import notificationRoutes from './routes/notification.route.js';
import reportRoutes from "./routes/report.routes.js";
import adminReportRoutes from "./routes/adminReport.routes.js";
import swaggerUi from "swagger-ui-express";
import swaggerSpec from "./swagger.js";
import userRoutes from "./routes/userRoutes.js"; 

const app = express();
app.use(apiLimit);
app.use(cors());
app.use(express.json());
app.use(cookieParser());

/**
 * @swagger
 * tags:
 *   name: Health
 *   description: Health & server status APIs
 */

/**
 * @swagger
 * /:
 *   get:
 *     summary: Root health check
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: API running
 */

/**
 * @swagger
 * /health:
 *   get:
 *     summary: API health endpoint
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Healthy response
 */


app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use("/api/users", userRoutes);

app.get('/', (req, res) => {
  res.send('Cab Connect Backend is running');
});
app.set("trust proxy", 1);

app.get("/health", (req, res) => res.status(200).json({ ok: true }));

app.use('/auth', authRoutes);
app.use('/rides', rideRoutes);
app.use('/admin', adminRoutes);
app.use('/notifications', notificationRoutes);
app.use("/reports", reportRoutes);
app.use("/admin/reports", adminReportRoutes);

export default app;
