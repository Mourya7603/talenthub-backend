const express = require("express");
const { body } = require("express-validator");
const validate = require("../middleware/validate");
const { protect, authorize, optionalAuth } = require("../middleware/auth");
const {
  getJobs,
  getFeaturedJobs,
  getRecentJobs,
  getJobById,
  createJob,
  updateJob,
  archiveJob,
  getRecruiterJobs,
} = require("../controllers/jobController");

const router = express.Router();

const jobValidation = [
  body("title").trim().notEmpty().withMessage("Job title is required"),
  body("company").trim().notEmpty().withMessage("Company name is required"),
  body("description").trim().notEmpty().withMessage("Job description is required"),
  body("salary").isFloat({ gt: 0 }).withMessage("Salary must be greater than 0"),
  body("experience").notEmpty().withMessage("Experience range is required"),
  body("location").trim().notEmpty().withMessage("Location is required"),
  body("employmentType")
    .isIn(["Full-time", "Part-time", "Contract", "Internship"])
    .withMessage("Invalid employment type"),
  body("workMode").isIn(["Remote", "On-site", "Hybrid"]).withMessage("Invalid work mode"),
  body("applicationDeadline")
    .isISO8601()
    .withMessage("A valid application deadline date is required")
    .custom((value) => new Date(value) > new Date())
    .withMessage("Application deadline cannot be in the past"),
];

// Public
router.get("/featured", getFeaturedJobs);
router.get("/recent", getRecentJobs);
router.get("/", getJobs);

// Recruiter-only (must precede /:id to avoid route collision)
router.get("/recruiter/mine", protect, authorize("recruiter"), getRecruiterJobs);
router.post("/", protect, authorize("recruiter"), jobValidation, validate, createJob);
router.put("/:id", protect, authorize("recruiter"), jobValidation, validate, updateJob);
router.patch("/:id/archive", protect, authorize("recruiter"), archiveJob);

// Public (optionalAuth lets the controller check "already applied" for logged-in applicants)
router.get("/:id", optionalAuth, getJobById);

module.exports = router;
