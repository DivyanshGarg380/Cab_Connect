import mongoose from 'mongoose';

export const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      // Connection pool: default is 5, bump to handle 10k concurrent
      maxPoolSize: 100,
      minPoolSize: 10,
      // Don't let idle connections sit forever
      maxIdleTimeMS: 30000,
      // Fail fast on connection issues rather than queuing forever
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      // Heartbeat keeps the pool healthy under load
      heartbeatFrequencyMS: 10000,
    });
    console.log('MongoDB connected');
  } catch (error) {
    console.error('MongoDB connection failed:', error.message);
    process.exit(1);
  }
};

export const disconnectDB = async () => {
  try {
    await mongoose.disconnect();
    console.log('MongoDB disconnected');
  } catch (error) {
    console.error('MongoDB disconnection failed:', error.message);
    process.exit(1);
  }
};

export default mongoose;
