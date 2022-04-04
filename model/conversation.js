const mongoose = require("mongoose");

const conversationSchema = new mongoose.Schema({
    sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "user",
    },

    receiver: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "user",
    },
});

const Conversation = mongoose.model("conversation", conversationSchema);

module.exports.Conversation = Conversation;
