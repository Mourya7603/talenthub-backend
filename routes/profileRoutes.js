const express = require("express");
const { protect } = require("../middleware/auth");
const { updateProfile, getRecruiterProfile } = require("../controllers/profileController");

const router = express.Router();

router.put("/", protect, updateProfile);
router.get("/recruiter/:id", getRecruiterProfile);

module.exports = router;
