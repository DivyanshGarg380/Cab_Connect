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
        required: true
    },
    text:{
        type: String,
        required: true,
        trim: true
    },
}, {   timestamps: true })

export default mongoose.models.Message || mongoose.model('Message', MessageSchema);
