const express = require("express");
const { protect } = require("../middleware/auth");
const upload = require("../middleware/upload");
const { uploadImages } = require("../controllers/uploadController");

const router = express.Router();

router.post("/images", protect, upload.array("images", 10), uploadImages);

module.exports = router;