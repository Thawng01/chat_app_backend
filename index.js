require("express-async-errors");
require("dotenv").config();
const { createServer } = require("http");
const express = require("express");
const app = express();
const httpServer = createServer(app);
const { Server } = require("socket.io");
const mongoose = require("mongoose");
const cors = require("cors");
const helmet = require("helmet");
const compression = require("compression");
const user = require("./routes/user");
const auth = require("./routes/auth");
const conversation = require("./routes/conversation");
const message = require("./routes/message");
const error = require("./middleware/error");

const io = new Server(httpServer, {
    cors: {
        origin: "http://localhost:3000",
    },
});

app.use(express.json());
app.use(cors());
app.use(helmet());
app.use(compression());
app.use("/api/user", user(io));
app.use("/api/auth", auth);
app.use("/api/conversation", conversation);
app.use("/api/message", message(io));
app.use(error);

const url =
    "mongodb://thawng:QwN1VRr3Vbxdjym1@chat-shard-00-00.4kmf6.mongodb.net:27017,chat-shard-00-01.4kmf6.mongodb.net:27017,chat-shard-00-02.4kmf6.mongodb.net:27017/chats?ssl=true&replicaSet=atlas-o3c7wl-shard-0&authSource=admin&retryWrites=true&w=majority";

mongoose
    .connect(url, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log("Connected to mongodb"))
    .catch((err) => console.log(err));

const port = process.env.PORT || 9000;
httpServer.listen(port, () => console.log(`Listening to port: ${port}`));
