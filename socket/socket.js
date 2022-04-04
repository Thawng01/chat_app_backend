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
        console.log("conected");
        socket.on("addUser", (userId) => {
            addUser(userId, socket.id);
            io.emit("getUsers", users);
        });

        socket.on("sendMessage", ({ sender, receiver, message }) => {
            const user = users.find((u) => u.userId === receiver);
            io.to(user.socketId).emit("getMessage", {
                sender,
                receiver,
                message,
            });
        });

        socket.on("disconnect", () => {
            console.log("user disconnected");
            removeUser(socket.id);
            io.emit("getUsers", users);
        });
    });
};
