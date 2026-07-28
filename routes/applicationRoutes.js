const express = require("express");
const { body } = require("express-validator");
const validate = require("../middleware/validate");
const { protect, authorize } = require("../middleware/auth");
const {
  applyToJob,
  withdrawApplication,
  getMyApplications,
  getJobApplicants,
  updateApplicationStatus,
} = require("../controllers/applicationController");

const router = express.Router();

router.get("/mine", protect, authorize("applicant"), getMyApplications);
router.post("/:jobId", protect, authorize("applicant"), applyToJob);
router.patch("/:jobId/withdraw", protect, authorize("applicant"), withdrawApplication);

router.get("/job/:jobId", protect, authorize("recruiter"), getJobApplicants);
router.patch(
  "/:id/status",
  protect,
  authorize("recruiter"),
  [body("status").isIn(["shortlisted", "rejected"]).withMessage("Status must be shortlisted or rejected")],
  validate,
  updateApplicationStatus
);

module.exports = router;
