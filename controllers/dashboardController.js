const asyncHandler = require("express-async-handler");
const Job = require("../models/Job");
const Application = require("../models/Application");
const ApiResponse = require("../utils/ApiResponse");

// @desc    Recruiter dashboard summary
// @route   GET /api/dashboard/recruiter
// @access  Private (recruiter)
const getRecruiterDashboard = asyncHandler(async (req, res) => {
  const recruiterId = req.user._id;

  const [activeJobs, archivedJobs, totalApplications, totalShortlisted, recentApplications] = await Promise.all([
    Job.countDocuments({ recruiter: recruiterId, status: "active" }),
    Job.countDocuments({ recruiter: recruiterId, status: "archived" }),
    Application.countDocuments({ recruiter: recruiterId }),
    Application.countDocuments({ recruiter: recruiterId, status: "shortlisted" }),
    Application.find({ recruiter: recruiterId })
      .populate("applicant", "name email skills")
      .populate("job", "title")
      .sort({ createdAt: -1 })
      .limit(5),
  ]);

  res.status(200).json(
    new ApiResponse(200, {
      summary: {
        activeJobs,
        archivedJobs,
        totalApplications,
        totalShortlisted,
      },
      recentApplications,
    })
  );
});

module.exports = { getRecruiterDashboard };
