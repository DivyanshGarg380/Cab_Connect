import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    message: {
        type: String,
        required: true,
    },
    read: {
        type: Boolean,
        default: false,
    },
}, { timestamps: true });

export default mongoose.models.notificationSchema || 
    mongoose.model('Notification', notificationSchema);