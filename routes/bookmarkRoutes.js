const express = require("express");
const { protect, authorize } = require("../middleware/auth");
const { getBookmarks, addBookmark, removeBookmark } = require("../controllers/bookmarkController");

const router = express.Router();

router.use(protect, authorize("applicant"));

router.get("/", getBookmarks);
router.post("/:jobId", addBookmark);
router.delete("/:jobId", removeBookmark);

module.exports = router;
