const mongoose = require("mongoose");
const Joi = require("joi");
const Jwt = require("jsonwebtoken");

const userSchema = new mongoose.Schema({
    username: { type: String, minlength: 4, maxlength: 25, required: true },
    email: {
        type: String,
        minlength: 4,
        maxlength: 50,
        required: true,
        unique: true,
    },
    password: { type: String, minlength: 6, maxlength: 500, required: true },
    avatar: { type: String, default: "" },
    blocks: { type: Array, default: [] },
    website: { type: String, default: "" },
    joinedAt: { type: Date, default: Date.now },
    address: { type: String, default: "" },
    phone: { type: String, default: "" },
});

userSchema.methods.generateAuthToken = function () {
    const token = Jwt.sign({ id: this._id }, "jwtSecretKey");
    return token;
};

const User = mongoose.model("users", userSchema);

function validateUser(input) {
    const schema = Joi.object({
        username: Joi.string().min(4).max(25).required().label("Username"),
        email: Joi.string().min(4).max(50).required().email().label("Email"),
        password: Joi.string().min(6).max(200).required(),
    });

    return schema.validate(input);
}

module.exports.User = User;
module.exports.validateUser = validateUser;
