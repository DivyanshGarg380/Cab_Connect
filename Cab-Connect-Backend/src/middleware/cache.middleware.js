import redisClient from "../config/redis.js";
import jwt from "jsonwebtoken";
import { extractToken } from "./auth.middleware.js";

const JWT_SECRET = process.env.JWT_ACCESS_SECRET;

export const cacheWithAuth = (keyBuilder, ttl = 60) => {
  return async (req, res, next) => {
    if (!redisClient.isOpen) {
      return _verifyAndNext(req, res, next);
    }

    const key = typeof keyBuilder === "function" ? keyBuilder(req) : keyBuilder;

    try {
      const cached = await redisClient.get(key);
      if (cached) {
        res.setHeader('X-Cache', 'HIT');
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        return res.end(cached);
      }
    } catch (e) {
      console.error('Redis GET error:', e.message);
    }

    _verifyAndNext(req, res, next, key, ttl);
  };
};

export const cache = (keyBuilder, ttl = 60) => {
  return async (req, res, next) => {
    if (!redisClient.isOpen) return next();

    const key = typeof keyBuilder === "function" ? keyBuilder(req) : keyBuilder;

    try {
      const cached = await redisClient.get(key);
      if (cached) {
        res.setHeader('X-Cache', 'HIT');
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        return res.end(cached);
      }
    } catch (e) {
      console.error('Redis GET error:', e.message);
      return next();
    }

    res.setHeader('X-Cache', 'MISS');
    _wrapJson(res, key, ttl);
    next();
  };
};

function _verifyAndNext(req, res, next, cacheKey, ttl) {
  try {
    const token = extractToken(req);
    if (!token) return res.status(401).json({ message: "Unauthorized: No token provided" });
    const decoded = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.userId;
    req.user = decoded;
  } catch {
    return res.status(401).json({ message: "Unauthorized: Invalid or expired token" });
  }

  res.setHeader('X-Cache', 'MISS');
  if (cacheKey) _wrapJson(res, cacheKey, ttl);
  next();
}

function _wrapJson(res, key, ttl) {
  const originalJson = res.json.bind(res);
  res.json = (body) => {
    if (res.statusCode < 400) {
      redisClient.setEx(key, ttl, JSON.stringify(body))
        .catch(e => console.error('Redis SET error:', e.message));
    }
    return originalJson(body);
  };
}