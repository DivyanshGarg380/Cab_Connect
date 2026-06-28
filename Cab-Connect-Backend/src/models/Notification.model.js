import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true, // queries are always filtered by user
  },
  message: { type: String, required: true },
  read: { type: Boolean, default: false },
  readAt: { type: Date, default: null },
  type: {
    type: String,
    enum: ["ride", "admin", "system"],
    default: "system",
  },
  meta: { type: Object, default: {} },
  deleteAt: {
    type: Date,
    default: null,
    index: { expires: 0 },
  },
}, { timestamps: true });

// Compound index: user + read status is the most common query pattern
notificationSchema.index({ user: 1, read: 1, createdAt: -1 });

export default mongoose.models.Notification ||
  mongoose.model('Notification', notificationSchema);
