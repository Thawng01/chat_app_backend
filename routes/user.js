const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const _ = require("lodash");

const { User, validateUser } = require("../model/user");

// register new user
router.post("/new", async (req, res) => {
    const { error } = validateUser(req.body);
    if (error) return res.status(400).send({ error: error.details[0].message });
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

    try {
        await user.save();

        const token = user.generateAuthToken();
        res.status(201).send(token);
    } catch (error) {
        res.status(500).send(error);
    }
});

router.get("/:id", async (req, res) => {
    try {
        const user = await User.findOne({ _id: req.params.id }).select(
            "-password"
        );

        res.status(200).send(user);
    } catch (error) {
        console.log(error.message);
    }
});

// search user by name
router.get("/search/:name", async (req, res) => {
    const user = await User.find({ username: req.params.name }).select(
        "username avatar"
    );
    res.status(200).send(user);
});

// block a user
router.put("/block/:id", async (req, res) => {
    const { id } = req.params;
    const { me } = req.body;
    const user = await User.findById(me).select("blocks");

    const { blocks } = user;
    if (blocks?.includes(id)) {
        const index = blocks.findIndex((u) => u === id);
        blocks.splice(index, 1);
    } else {
        blocks.push(id);
    }

    await user.save();
    res.status(200).send();
});

// update user info
router.put("/:id", async (req, res) => {
    const { username, email, phone, website, address } = req.body;
    const user = await User.findById(req.params.id);

    user.username = username;
    user.email = email;
    user.phone = phone;
    user.website = website;
    user.address = address;

    await user.save();
});

module.exports = router;
