import User from '../models/User.model.js';

const adminMiddleware = async (req, res, next) => {
  try {
    // Only fetch role — no need for the full document
    const user = await User.findById(req.userId).select("role").lean();
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin Access Required' });
    }
    next();
  } catch (error) {
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

export default adminMiddleware;
