const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const _ = require("lodash");
const cloudinary = require("cloudinary");
const mongoose = require("mongoose");

const { User, validateUser } = require("../model/user");
const upload = require("../middleware/multer");
const auth = require("../middleware/auth");

module.exports = function (io) {
    // register new user
    router.post("/new", async (req, res) => {
        const { error } = validateUser(req.body);
        if (error)
            return res.status(400).send({ error: error.details[0].message });
        const { username, email, password } = req.body;

        let user = await User.findOne({ email: email });
        if (user) return res.status(400).send("The email already in use.");
        user = new User({
            username,
            email,
            password,
        });

        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(user.password, salt);

        await user.save();
        const token = user.generateAuthToken();
        res.status(201).send(token);
    });

    //fetch a user
    router.get("/:id", async (req, res) => {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).send("Invalid ID");
        }

        const user = await User.findOne({ _id: req.params.id }).select(
            "-password"
        );
        if (!user)
            return res.status(400).send("No user found with the given ID");

        res.status(200).send(user);
    });

    // search user by name
    router.get("/search/:name", async (req, res) => {
        const user = await User.find({ username: req.params.name }).select(
            "-password"
        );
        res.status(200).send(user);
    });

    // block a user
    router.put("/block/:id", auth, async (req, res) => {
        const { id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).send("Invalid ID");
        }

        const user = await User.findById(req.user.id).select("-password");

        if (!user)
            return res.status(400).send("No user found with the given ID");

        if (user.blocks?.includes(id)) {
            const index = user.blocks.findIndex((u) => u === id);
            user.blocks.splice(index, 1);
        } else {
            user.blocks.push(id);
        }
        await user.save();
        io.emit("updateUser", user);
        res.status(200).send();
    });

    // update user info
    router.put("/:id", auth, async (req, res) => {
        const { username, email, phone, website, address } = req.body;

        //validate object id
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).send("Invalid ID");
        }

        const user = await User.findById(req.params.id);
        if (!user)
            return res.status(400).send("No user found with the given ID");

        user.username = username;
        user.email = email;
        user.phone = phone;
        user.website = website;
        user.address = address;

        const updatedUser = {
            _id: user._id,
            username: user.username,
            avatar: user.avatar,
            email: user.email,
            blocks: user.blocks,
            website: user.website,
            address: user.address,
            phone: user.phone,
            joinedAt: user.joinedAt,
        };

        await user.save();
        io.emit("updateUser", updatedUser);
        res.status(200).send();
    });

    router.put("/profile/:id", upload.single("avatar"), (req, res) => {
        // validate object id
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).send("Invalid ID");
        }

        cloudinary.v2.uploader.upload(req.file.path, async (err, result) => {
            if (err !== undefined) {
                res.status(400).send("Something went wrong.");
                return;
            }
            const user = await User.findByIdAndUpdate(req.params.id);

            user.avatar = result.secure_url;
            await user.save();
            io.emit("updateUser", user);
            res.status(200).send();
        });
    });

    return router;
};
