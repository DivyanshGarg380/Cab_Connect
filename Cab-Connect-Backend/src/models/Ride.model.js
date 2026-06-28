import mongoose from "mongoose";

const rideSchema = new mongoose.Schema(
  {
    creator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    date: {
      type: String,
      required: true,
    },
    destination: {
      type: String,
      required: true,
      enum: ['airport', 'campus'],
      trim: true,
    },
    departureTime: {
      type: Date,
      required: true,
    },
    participants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    status: {
      type: String,
      enum: ["open", "full", "expired"],
      default: "open",
    },
    isLocked: {
      type: Boolean,
      default: false,
    },
    lockedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

rideSchema.pre("save", function (next) {
  if (this.participants.length > 4) {
    return next(new Error("Maximum 4 participants allowed per ride"));
  }
  next(); // ← was missing! caused pre-save hook to hang forever
});

// Compound indexes for the most common query patterns
rideSchema.index({ destination: 1, status: 1, departureTime: 1 });
rideSchema.index({ creator: 1, status: 1 });
rideSchema.index({ participants: 1, status: 1 });
// Index for suggestions aggregate ($match on destination+status+isLocked+departureTime)
rideSchema.index({ destination: 1, status: 1, isLocked: 1, departureTime: 1 });

export default mongoose.models.Ride || mongoose.model('Ride', rideSchema);
