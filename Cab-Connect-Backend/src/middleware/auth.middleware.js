import jwt from 'jsonwebtoken';

// Cache the secret — avoids process.env lookup on every request
const JWT_SECRET = process.env.JWT_ACCESS_SECRET;

const authMiddleware = (req, res, next) => {
  try {
    let token = null;

    // Check Authorization header first (faster than cookie parser path)
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.charCodeAt(0) === 66) { // 'B' for "Bearer"
      token = authHeader.slice(7); // skip "Bearer "
    }

    if (!token && req.cookies?.token) {
      token = req.cookies.token;
    }

    if (!token) {
      return res.status(401).json({ message: "Unauthorized: No token provided" });
    }

    // jwt.verify is synchronous CPU work — keep it, but avoid re-reading env
    const decoded = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.userId;
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Unauthorized: Invalid or expired token' });
  }
};

export default authMiddleware;
