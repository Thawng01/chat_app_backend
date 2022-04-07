const multer = require("multer");
const cloudinary = require("cloudinary");

const storage = multer.diskStorage({
    filename: (req, file, cb) => {
        cb(null, new Date().getTime() + "_" + file.originalname);
    },
});

const imageType = function (req, file, cb) {
    if (!file.originalname.match(/\.(jpg|jpeg|png)$/i)) {
        return cb(new Error("Only image are accepted"), false);
    }

    cb(null, true);
};

cloudinary.config({
    cloud_name: process.env.CLOUD_NAME,
    api_key: process.env.CLOUD_API_KEY,
    api_secret: process.env.CLOUD_API_SECRET,
});

const upload = multer({ storage: storage, fileFilter: imageType });

module.exports = upload;
