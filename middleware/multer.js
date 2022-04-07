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
    cloud_name: "dcamukk7a",
    api_key: "573375933639265",
    api_secret: "DjD6QZ0jqVI4eJ8bJadcx66IaRc",
});

const upload = multer({ storage: storage, fileFilter: imageType });

module.exports = upload;
