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
    },
    {
        timestamps: true,       
    }
);

/*
    Max 4 participants per ride
*/

rideSchema.pre("save", function (next) {
    if (this.participants.length > 4) {
        throw new Error(new Error("Maximum 4 participants allowed per ride"));
    }
    
});

export default mongoose.models.Ride ||
  mongoose.model('Ride', rideSchema);
