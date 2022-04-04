const { createServer } = require("http");
const { Server } = require("socket.io");
const express = require("express");
const app = express();
const httpServer = createServer(app);
const mongoose = require("mongoose");
const cors = require("cors");
const user = require("./routes/user");
const auth = require("./routes/auth");
const conversation = require("./routes/conversation");
const message = require("./routes/message");

const io = new Server(httpServer, {
    cors: {
        origin: "http://localhost:3000",
    },
});

require("./socket/socket")(io);
app.use(express.json());
app.use(cors());
app.use("/api/user", user);
app.use("/api/auth", auth);
app.use("/api/conversation", conversation);
app.use("/api/message", message);

mongoose.connect("mongodb://localhost/chat", () =>
    console.log("connected to mongodb")
);

const port = process.env.PORT || 9000;
httpServer.listen(port, () => console.log(`Listening to port: ${port}`));
