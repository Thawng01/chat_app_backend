const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema({
    message: String,
    image: String,
    sentAt: { type: Date, default: Date.now },
    sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "user",
    },

    receiver: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "user",
    },

    conversation_id: { type: mongoose.Schema.Types.ObjectId },

    read: { type: Boolean, default: false },
});

const Message = mongoose.model("message", messageSchema);

module.exports.Message = Message;
