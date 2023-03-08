const multer = require("multer");
const mime = require('mime');

module.exports = multer({
  fileFilter: (req, file, cb, err) => {
    const type = mime.getExtension(file.mimetype);
    const conditions = ["png", "jpg", "jpeg"];
    if (conditions.includes(`${type}`)) {
      cb(null, true);
    } else{
      console.log(err)
      cb(null, false);
    }
  },
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, "public/uploads/");
    },
    filename: (req, file, cb) => {
      cb(null, Date.now().toString() + "-" + file.originalname);
    },
  }),
  limits: { fileSize: 1048576 }
});
