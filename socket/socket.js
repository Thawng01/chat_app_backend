const { Message } = require("../model/message");
const { Conversation } = require("../model/conversation");
const cloudinary = require("cloudinary");
const upload = require("../middleware/multer");

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
        // socket.on("sendMessage", async (input) => {
        //     const user = users.find((u) => u.userId === input.receiver);
        //     const message = await createMessage(input);
        //     io.to(user.socketId).emit("getMessage", message);
        // });
        socket.on("disconnect", () => {
            console.log("user disconnected");
            removeUser(socket.id);
            io.emit("getUsers", users);
        });
    });

    return users;
    // const createMessage = async (input) => {
    //     const { sender, receiver, message } = input;
    //     const conversation = await createConv(sender, receiver);
    //     return await createMessageOrImage(
    //         message,
    //         sender,
    //         receiver,
    //         conversation._id
    //     );
    // };
    // async function createConv(sender, receiver) {
    //     let conversation = await Conversation.findOne().or([
    //         { sender: sender, receiver: receiver },
    //         { sender: receiver, receiver: sender },
    //     ]);
    //     if (!conversation) {
    //         conversation = new Conversation({
    //             sender,
    //             receiver,
    //         });
    //         await conversation.save();
    //     }
    //     return conversation;
    // }
    //     async function createMessageOrImage(message, sender, receiver, conv_id) {
    //         const m = new Message({
    //             message,
    //             sender,
    //             receiver,
    //             conversation_id: conv_id,
    //         });
    //         await m.save();
    //         return m;
    //     }
};
