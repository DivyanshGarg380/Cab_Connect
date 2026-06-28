import User from "../models/User.model.js";

// Lean query — only fetch the two ban fields, no Mongoose overhead
const banMiddleware = async (req, res, next) => {
  const user = await User.findById(req.userId)
    .select("banUntil isPermanantlyBanned")
    .lean();

  if (!user) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  if (user.isPermanantlyBanned) {
    return res.status(403).json({ message: "You are permanently banned from this action" });
  }

  if (user.banUntil && user.banUntil > new Date()) {
    return res.status(403).json({ message: "You are temporarily banned" });
  }

  next();
};

export default banMiddleware;
