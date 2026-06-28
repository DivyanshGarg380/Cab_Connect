import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },
    isVerified: { type: Boolean, default: false },
    role: { type: String, enum: ['user', 'admin'], default: 'user' },
    banCount: { type: Number, default: 0 },
    banUntil: { type: Date, default: null },
    isPermanantlyBanned: { type: Boolean, default: false },
  },
  { timestamps: true }
);

userSchema.index({ _id: 1, banUntil: 1, isPermanantlyBanned: 1 });
userSchema.index({ role: 1 });

export default mongoose.models.User || mongoose.model('User', userSchema);
