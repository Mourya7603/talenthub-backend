const express = require("express");
const rateLimit = require("express-rate-limit");
const { protect, authorize } = require("../middleware/auth");
const { generateInterviewPrep, askHiringAssistant } = require("../controllers/aiController");

const router = express.Router();

// AI calls are more expensive than normal CRUD routes; throttle per-user
const aiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many AI requests. Please wait a moment and try again." },
});

router.post(
  "/interview-prep/:jobId",
  protect,
  authorize("applicant"),
  aiLimiter,
  generateInterviewPrep
);

router.post(
  "/hiring-assistant/:jobId",
  protect,
  authorize("recruiter"),
  aiLimiter,
  askHiringAssistant
);

module.exports = router;
