import mongoose from "mongoose";

const reportSchema = new mongoose.Schema({
    reporter: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    reportedUser: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    ride: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Ride",
        required: true,
    },
    rideDate: {
        type: String,
        required: true,
    },
    destination: {
        type: String,
        required: true,
        enum: ["airport", "campus"],
    },
    description: {
        type: String,
        required: true,
        maxLength: 30,
        trim: true,
    },
    status: {
        type: String,
        enum: ["pending", "reviewed", "action_taken", "dismissed"],
        default: "pending",
    },
    adminNote: {
        type: String,
        default: "",
    },
}, {timestamps: true});

reportSchema.index({ reporter: 1, ride: 1, reportedUser: 1 }, {unique: true});

export default mongoose.models.Report || mongoose.model("Report", reportSchema);