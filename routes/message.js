const express = require("express");
const { Message } = require("../model/message");
const { Conversation } = require("../model/conversation");
const router = express.Router();
const auth = require("../middleware/auth");

router.post("/", async (req, res) => {
    const { message, sender, receiver } = req.body;

    let conversation = await Conversation.findOne().or([
        { sender: sender, receiver: receiver },
        { sender: receiver, receiver: sender },
    ]);

    if (!conversation) {
        conversation = new Conversation({
            sender,
            receiver,
        });
        await conversation.save();
    }

    const m = new Message({
        message,
        image: "",
        sender,
        receiver,
        conversation_id: conversation._id,
    });

    await m.save();
});

router.get("/:id", async (req, res) => {
    // fetch message by conversation id
    const { id } = req.params;

    const message = await Message.findOne({ conversation_id: id })
        .select("-_id -image")
        .sort("-sentAt");
    res.status(200).send(message);
});

router.get("/all/:id/:me", async (req, res) => {
    // fetch message by conversation id
    const { id, me } = req.params;

    const conversation = await Conversation.findOne()
        .or([
            { sender: me, receiver: id },
            { sender: id, receiver: me },
        ])
        .select("-sender -receiver");

    if (!conversation) return res.status(200).send([]);

    const message = await Message.find({
        conversation_id: conversation?._id,
    });

    res.status(200).send(message);
});

router.put("/:id", async (req, res) => {
    const { id } = req.params;
    const { userId } = req.body;

    let message = await Message.findOne()
        .or([
            { sender: id, receiver: userId },
            { sender: userId, receiver: id },
        ])
        .sort("-sentAt");

    if (id != message?.sender && message?.read === false) {
        message = await Message.findByIdAndUpdate(message._id);
        message.read = true;
        await message.save();
    }

    res.send();
});

module.exports = router;
