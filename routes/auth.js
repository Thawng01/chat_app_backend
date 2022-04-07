const express = require("express");
const router = express.Router();
const Joi = require("joi");
const bcrypt = require("bcrypt");
const _ = require("lodash");
const { User } = require("../model/user");
const auth = require("../middleware/auth");

router.post("/", async (req, res) => {
    const { error } = validate(req.body);
    if (error) return res.status(400).send(error.details[0].message);

    let user = await User.findOne({ email: req.body.email });
    if (!user) return res.status(400).send("No user with the given email");

    const validPassword = await bcrypt.compare(
        req.body.password,
        user.password
    );
    if (!validPassword) return res.status(400).send("Invalid password");

    const token = user.generateAuthToken();
    res.status(200).send(token);
});

function validate(input) {
    const schema = Joi.object({
        email: Joi.string().required().label("Email"),
        password: Joi.string().required().label("Password"),
    });

    return schema.validate(input);
}

router.get("/me/:id", auth, async (req, res) => {
    const me = await User.findById(req.params.id).select(
        "username avatar blocks joinedAt"
    );
    res.status(200).send(me);
});

module.exports = router;
