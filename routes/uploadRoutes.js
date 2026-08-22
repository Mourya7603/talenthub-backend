const express = require("express");
const { protect } = require("../middleware/auth");
const { upload, tagUploadType } = require("../middleware/upload");
const { handleUpload } = require("../controllers/uploadController");

const router = express.Router();

router.post("/resume", protect, tagUploadType("resume"), upload.single("file"), handleUpload);
router.post("/photo", protect, tagUploadType("photo"), upload.single("file"), handleUpload);

module.exports = router;
