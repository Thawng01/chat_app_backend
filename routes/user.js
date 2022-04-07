const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const _ = require("lodash");
const cloudinary = require("cloudinary");

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

    router.get("/:id", auth, async (req, res) => {
        const user = await User.findOne({ _id: req.params.id }).select(
            "-password"
        );
        res.status(200).send(user);
    });

    // search user by name
    router.get("/search/:name", async (req, res) => {
        const user = await User.find({ username: req.params.name }).select(
            "username avatar"
        );
        res.status(200).send(user);
    });

    // block a user
    router.put("/block/:id", auth, async (req, res) => {
        const { id } = req.params;
        const user = await User.findById(req.user.id).select("-password");

        if (user.blocks?.includes(id)) {
            const index = user.blocks.findIndex((u) => u === id);
            user.blocks.splice(index, 1);
        } else {
            user.blocks.push(id);
        }
        console.log(user);
        await user.save();
        res.status(200).send();
    });

    // update user info
    router.put("/:id", auth, async (req, res) => {
        const { username, email, phone, website, address } = req.body;
        const user = await User.findById(req.params.id);

        user.username = username;
        user.email = email;
        user.phone = phone;
        user.website = website;
        user.address = address;

        await user.save();
    });

    router.put("/profile/:id", auth, upload.single("avatar"), (req, res) => {
        cloudinary.v2.uploader.upload(req.file.path, async (err, result) => {
            if (err !== undefined) {
                res.status(400).send("Something went wrong.");
                return;
            }
            const user = await User.findByIdAndUpdate(req.params.id);

            user.avatar = result.secure_url;
            await user.save();
        });
    });
    return router;
};
