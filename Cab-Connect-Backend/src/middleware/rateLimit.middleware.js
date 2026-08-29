import rateLimit, { ipKeyGenerator } from "express-rate-limit";
import { RedisStore } from "rate-limit-redis";
import redisClient from "../config/redis.js";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_ACCESS_SECRET;

const makeRedisStore = (prefix) =>
  new RedisStore({
    sendCommand: (...args) => redisClient.sendCommand(args),
    prefix,
  });

const userKeyGenerator = (req) => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader) {
      const token = authHeader.slice(7);
      const decoded = jwt.verify(token, JWT_SECRET);
      return `uid:${decoded.userId}`;
    }
  } catch {
    // fall back to IP for unauthenticated requests
  }
  return ipKeyGenerator(req);
};

export const apiLimit = rateLimit({
  windowMs: 30 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  store: makeRedisStore("rl:api:"),
  keyGenerator: userKeyGenerator,
  message: { message: "Too many requests, please try again later" },
  skipFailedRequests: true,
  skip: (req) => req.path === "/health",
});

export const otpLimit = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  store: makeRedisStore("rl:otp:"),
  message: { message: "Too many OTP requests. Please wait." },
});