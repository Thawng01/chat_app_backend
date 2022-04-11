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

mongoose.connect("mongodb://localhost/chat", () =>
    console.log("connected to mongodb")
);

const port = process.env.PORT || 9000;
httpServer.listen(port, () => console.log(`Listening to port: ${port}`));
