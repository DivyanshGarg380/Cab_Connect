import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_ACCESS_SECRET;

export const extractToken = (req) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.charCodeAt(0) === 66) {
    return authHeader.slice(7);
  }
  return req.cookies?.token ?? null;
};

const authMiddleware = (req, res, next) => {
  try {
    const token = extractToken(req);
    if (!token) {
      return res.status(401).json({ message: "Unauthorized: No token provided" });
    }
    const decoded = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.userId;
    req.user = decoded;
    next();
  } catch {
    return res.status(401).json({ message: 'Unauthorized: Invalid or expired token' });
  }
};

export default authMiddleware;