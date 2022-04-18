const Joi = require("joi");
Joi.objectId = require("joi-objectid")(Joi);
const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema({
    message: String,
    sentAt: { type: Date, default: Date.now },
    sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "users",
    },

    receiver: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "users",
    },

    conversation_id: { type: mongoose.Schema.Types.ObjectId },

    read: { type: Boolean, default: false },
});

const Message = mongoose.model("messages", messageSchema);

const validate = (input) => {
    const schema = Joi.object({
        sender: Joi.objectId().required(),
        receiver: Joi.objectId().required(),
    });

    return schema.validate(input);
};

module.exports.Message = Message;
module.exports.validate = validate;
