const express = require("express");
const { Conversation } = require("../model/conversation");
const { Message } = require("../model/message");
const router = express.Router();
const auth = require("../middleware/auth");

router.get("/:id", async (req, res) => {
    const { id } = req.params;

    try {
        const conversation = await Conversation.find().or([
            { sender: id },
            { receiver: id },
        ]);

        res.status(200).send(conversation);
    } catch (error) {
        console.log(error);
    }
});

router.delete("/:id", async (req, res) => {
    const { id } = req.params;
    await Message.deleteMany({ conversation_id: id });

    await Conversation.findByIdAndRemove(id);
    res.status(200).send();
});

module.exports = router;
