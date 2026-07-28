const asyncHandler = require("express-async-handler");
const Application = require("../models/Application");
const Job = require("../models/Job");
const ApiError = require("../utils/ApiError");
const ApiResponse = require("../utils/ApiResponse");

// @desc    Apply for a job
// @route   POST /api/applications/:jobId
// @access  Private (applicant)
const applyToJob = asyncHandler(async (req, res) => {
  const job = await Job.findById(req.params.jobId);
  if (!job) throw new ApiError(404, "Job not found");
  if (job.status !== "active") throw new ApiError(400, "This job is no longer accepting applications");
  if (job.applicationDeadline < new Date()) throw new ApiError(400, "Application deadline has passed");

  const resumeUrl = req.body.resumeUrl || req.user.resumeUrl;
  if (!resumeUrl) throw new ApiError(400, "Please add a resume link to your profile before applying");

  const existing = await Application.findOne({ job: job._id, applicant: req.user._id });
  if (existing) {
    if (existing.status === "withdrawn") {
      existing.status = "applied";
      existing.resumeUrl = resumeUrl;
      existing.coverNote = req.body.coverNote || existing.coverNote;
      await existing.save();
      return res.status(200).json(new ApiResponse(200, { application: existing }, "Application re-submitted"));
    }
    throw new ApiError(409, "You have already applied to this job");
  }

  const application = await Application.create({
    job: job._id,
    applicant: req.user._id,
    recruiter: job.recruiter,
    resumeUrl,
    coverNote: req.body.coverNote || "",
  });

  res.status(201).json(new ApiResponse(201, { application }, "Application submitted"));
});

// @desc    Withdraw an application
// @route   PATCH /api/applications/:jobId/withdraw
// @access  Private (applicant, owner only)
const withdrawApplication = asyncHandler(async (req, res) => {
  const application = await Application.findOne({ job: req.params.jobId, applicant: req.user._id });
  if (!application) throw new ApiError(404, "Application not found");
  if (application.status === "withdrawn") throw new ApiError(400, "Application already withdrawn");

  application.status = "withdrawn";
  await application.save();

  res.status(200).json(new ApiResponse(200, { application }, "Application withdrawn"));
});

// @desc    Get applications for the logged-in applicant
// @route   GET /api/applications/mine
// @access  Private (applicant)
const getMyApplications = asyncHandler(async (req, res) => {
  const applications = await Application.find({ applicant: req.user._id })
    .populate("job", "title company location salary status")
    .sort({ createdAt: -1 });

  res.status(200).json(new ApiResponse(200, { applications }));
});

// @desc    Get applicants for a specific job (recruiter view)
// @route   GET /api/applications/job/:jobId
// @access  Private (recruiter, job owner only)
const getJobApplicants = asyncHandler(async (req, res) => {
  const job = await Job.findById(req.params.jobId);
  if (!job) throw new ApiError(404, "Job not found");
  if (job.recruiter.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "You can only view applicants for your own jobs");
  }

  const filter = { job: job._id };
  if (req.query.status) filter.status = req.query.status;

  const applications = await Application.find(filter)
    .populate("applicant", "name email skills experience photo resumeUrl")
    .sort({ createdAt: -1 });

  res.status(200).json(new ApiResponse(200, { applications, job: { id: job._id, title: job.title } }));
});

// @desc    Update application status (shortlist / reject)
// @route   PATCH /api/applications/:id/status
// @access  Private (recruiter, owner only)
const updateApplicationStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  if (!["shortlisted", "rejected"].includes(status)) {
    throw new ApiError(400, "Status must be 'shortlisted' or 'rejected'");
  }

  const application = await Application.findById(req.params.id);
  if (!application) throw new ApiError(404, "Application not found");
  if (application.recruiter.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "You can only manage applicants for your own jobs");
  }

  application.status = status;
  await application.save();

  res.status(200).json(new ApiResponse(200, { application }, `Applicant ${status}`));
});

module.exports = {
  applyToJob,
  withdrawApplication,
  getMyApplications,
  getJobApplicants,
  updateApplicationStatus,
};
