const express = require("express");
const { protect, authorize } = require("../middleware/auth");
const { getRecruiterDashboard } = require("../controllers/dashboardController");

const router = express.Router();

router.get("/recruiter", protect, authorize("recruiter"), getRecruiterDashboard);

module.exports = router;
