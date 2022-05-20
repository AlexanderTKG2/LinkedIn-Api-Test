const multer = require("multer");
const path = require("path");
const uuidV4 = require("uuid").v4;

const storageConfig = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "temp");
  },
  filename: (req, file, cb) => {
    cb(null, `${uuidV4()}-${Date.now()}${path.extname(file.originalname)}`);
  },
});

const uploadConfig = {
  storage: storageConfig,
};

const upload = multer(uploadConfig).single("file");

module.exports = upload;
