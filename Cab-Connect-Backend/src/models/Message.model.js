import mongoose from "mongoose";

const MessageSchema = new mongoose.Schema({
    ride:{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Ride",
        required: true
    },
    sender:{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null,
    },
    text:{
        type: String,
        required: true,
        trim: true,
    },
    type: {
        type: String,
        enum: ["user", "system"],
        default: "user",
    }
}, {   timestamps: true })

export default mongoose.models.Message || mongoose.model('Message', MessageSchema);
