const express = require("express");
const rateLimit = require("express-rate-limit");
const { protect, authorize } = require("../middleware/auth");
const { generateInterviewPrep, askHiringAssistant, generateCoverLetter } = require("../controllers/aiController");

const router = express.Router();

// AI calls are more expensive than normal CRUD routes, so each feature gets
// its own independent limiter (previously all three routes shared a single
// limiter instance, which meant its counter was combined across all three
// features rather than 10 requests each — testing two AI features back to
// back could exhaust the shared bucket much faster than "10/minute" implies).
// Keyed by the authenticated user's id rather than IP, since these routes
// always run after `protect` and IP-based keying is the wrong granularity
// for a logged-in app (and breaks down for multiple users behind one NAT/proxy).
const makeAiLimiter = (label) =>
  rateLimit({
    windowMs: 60 * 1000,
    max: 15,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => req.user?._id?.toString() || req.ip,
    message: {
      success: false,
      message: `You've made too many ${label} requests in the last minute. Please wait a moment and try again. (This is TalentHub's own rate limit, separate from any limit on the underlying AI provider.)`,
    },
  });

router.post(
  "/interview-prep/:jobId",
  protect,
  authorize("applicant"),
  makeAiLimiter("interview prep"),
  generateInterviewPrep
);

router.post(
  "/hiring-assistant/:jobId",
  protect,
  authorize("recruiter"),
  makeAiLimiter("hiring assistant"),
  askHiringAssistant
);

// BONUS FEATURE: AI-Generated Cover Letter
router.post(
  "/cover-letter/:jobId",
  protect,
  authorize("applicant"),
  makeAiLimiter("cover letter"),
  generateCoverLetter
);

module.exports = router;
