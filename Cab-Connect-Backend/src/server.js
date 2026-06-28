import dotenv from 'dotenv';
dotenv.config();

import cluster from 'cluster';
import os from 'os';

const WORKERS = parseInt(process.env.WEB_CONCURRENCY) || os.cpus().length;

if (cluster.isPrimary && process.env.NODE_ENV === 'production') {
  console.log(`Primary ${process.pid} starting ${WORKERS} workers`);
  for (let i = 0; i < WORKERS; i++) cluster.fork();
  cluster.on('exit', (worker, code, signal) => {
    console.error(`Worker ${worker.process.pid} died (${signal || code}). Restarting...`);
    cluster.fork();
  });
} else {
  startServer();
}

async function startServer() {
  const app = (await import('./app.js')).default;
  const { connectDB } = await import('./config/db.js');
  const { connectRedis } = await import('./config/redis.js');
  const { Server } = await import('socket.io');
  const { createAdapter } = await import('@socket.io/redis-adapter');
  const { createClient } = await import('redis');
  const http = await import('http');
  const { initChatSocket } = await import('./sockets/chat.socket.js');
  const { startCronJobs } = await import('./jobs/cron.job.js');
  await import('./workers/rideExpiry.worker.js');

  const PORT = process.env.PORT || 5000;

  try {
    await Promise.all([connectDB(), connectRedis()]);

    const server = http.createServer(app);

    // Redis adapter — required for socket.io to work across cluster workers
    const pubClient = createClient({ url: process.env.REDIS_URL });
    const subClient = pubClient.duplicate();
    await Promise.all([pubClient.connect(), subClient.connect()]);

    const io = new Server(server, {
      cors: { origin: process.env.CLIENT_ORIGIN || '*' },
      pingTimeout: 60000,
      pingInterval: 25000,
      transports: ['websocket', 'polling'],
      maxHttpBufferSize: 1e6,
      // Adapter bridges socket events across all cluster workers
      adapter: createAdapter(pubClient, subClient),
    });

    // Expose io via app — avoids circular imports (routes use req.app.get('io'))
    app.set('io', io);

    initChatSocket(io);
    startCronJobs();

    server.listen(PORT, () => {
      console.log(`Worker ${process.pid} listening on port ${PORT}`);
    });

    const shutdown = async (signal) => {
      console.log(`${signal} — shutting down gracefully`);
      server.close(() => process.exit(0));
      setTimeout(() => process.exit(1), 10000);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT',  () => shutdown('SIGINT'));

  } catch (err) {
    console.error('Failed to start server:', err);
    if (process.env.NODE_ENV !== 'test') process.exit(1);
    throw err;
  }
}

export {};
