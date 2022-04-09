const express = require("express");
const { Message, validate } = require("../model/message");
const { Conversation } = require("../model/conversation");
const router = express.Router();
const auth = require("../middleware/auth");
const upload = require("../middleware/multer");
const cloudinary = require("cloudinary");

module.exports = function (io) {
    // store user id and socked id in array
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
        socket.on("addUser", (userId) => {
            addUser(userId, socket.id);
        });
        socket.on("disconnect", () => {
            removeUser(socket.id);
            io.emit("getUsers", users);
        });
    });

    // sending normal text
    router.post("/", auth, async (req, res) => {
        const { sender, receiver, message } = req.body;

        const { error } = validate({ sender, receiver });
        if (error) return res.status(400).send(error.details[0].message);

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

        const { error } = validate(req.body);
        if (error) return res.status(400).send(error.details[0].message);

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

    // fetch the lastest message by conversation id
    router.get("/:id/:me", async (req, res) => {
        const { id, me } = req.params;
        const message = await Message.findOne({ conversation_id: id })
            .select("-_id -image")
            .populate("sender", "avatar username")
            .populate("receiver", "avatar username")
            .sort("-sentAt");

        let selectUser =
            me == message?.sender._id ? message?.receiver : message?.sender;

        const newMessage = {
            message: message?.message,
            conversation_id: message?.conversation_id,
            sentAt: message?.sentAt,
            read: message?.read,
            user: selectUser,
            sender: message?.sender._id,
            receiver: message?.receiver._id,
        };

        res.status(200).send(newMessage);
    });

    // fetch all messages by conversation id
    router.get("/all/:receiver/:sender", async (req, res) => {
        const { receiver, sender } = req.params;

        const { error } = validate(req.params);
        if (error) return res.status(400).send(error.details[0].message);

        const conversation = await Conversation.findOne()
            .or([
                { sender: sender, receiver: receiver },
                { sender: receiver, receiver: sender },
            ])
            .select("-sender -receiver");

        if (!conversation) return res.status(200).send([]);

        const message = await Message.find({
            conversation_id: conversation?._id,
        })
            .populate("receiver", "avatar")
            .populate("sender", "avatar");

        const sortedMessage = message?.sort(function (a, b) {
            return a.sentAt - b.sentAt;
        });

        res.status(200).send(sortedMessage);
    });

    // update read property
    router.put("/", auth, async (req, res) => {
        const { sender, receiver } = req.body;

        const { error } = validate(req.body);
        if (error) return res.status(400).send(error.details[0].message);

        let message = await Message.findOne()
            .or([
                { sender: sender, receiver: receiver },
                { sender: receiver, receiver: sender },
            ])
            .sort("-sentAt");

        if (sender != message?.sender && message?.read === false) {
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
