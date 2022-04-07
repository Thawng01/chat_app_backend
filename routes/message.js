const express = require("express");
const { Message } = require("../model/message");
const { Conversation } = require("../model/conversation");
const router = express.Router();
const auth = require("../middleware/auth");
const upload = require("../middleware/multer");
const cloudinary = require("cloudinary");

module.exports = function (io) {
    let users = [];
    const addUser = (userId, socketId) => {
        if (!users.some((user) => user.userId === userId)) {
            users.push({ userId, socketId });
        }
    };
    const removeUser = (socketId) => {
        users = users.filter((u) => u.socketId !== socketId);
    };
    io.on("connect", (socket) => {
        console.log("conected", socket.id);
        socket.on("addUser", (userId) => {
            addUser(userId, socket.id);
        });
        socket.on("disconnect", () => {
            console.log("user disconnected");
            removeUser(socket.id);
            io.emit("getUsers", users);
        });
    });

    // sending normal text
    router.post("/", auth, async (req, res) => {
        const { sender, receiver, message } = req.body;
        const conv = await createConv(sender, receiver);

        const user = users.find((u) => u.userId === receiver);
        const m = await createMessageOrImage(
            message,
            sender,
            receiver,
            conv._id
        );

        io.to(user.socketId).emit("getMessage", m);

        res.status(201).send();
    });

    // sending image
    router.post("/image", auth, upload.single("image"), async (req, res) => {
        const { sender, receiver } = req.body;

        const conversation = await createConv(sender, receiver);
        cloudinary.v2.uploader.upload(req.file.path, async (err, result) => {
            if (err !== undefined) {
                res.status(400).send("Something went wrong.");
                return;
            }

            const image = result.secure_url;
            const m = await createMessageOrImage(
                image,
                sender,
                receiver,
                conversation._id
            );

            const user = users.find((u) => u.userId === receiver);
            io.to(user.socketId).emit("getMessage", m);

            res.status(201).send();
        });
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
        })
            .populate("receiver", "avatar")
            .populate("sender", "avatar")
            .sort("-sentAt");

        const sortedMessage = message?.sort(function (a, b) {
            return a.sentAt - b.sentAt;
        });

        res.status(200).send(sortedMessage);
    });

    router.put("/:id", auth, async (req, res) => {
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

    async function createConv(sender, receiver) {
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
        return conversation;
    }

    async function createMessageOrImage(message, sender, receiver, conv_id) {
        const m = new Message({
            message,
            sender,
            receiver,
            conversation_id: conv_id,
        });

        await m.save();
        return m;
    }
    return router;
};
