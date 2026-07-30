const asyncHandler = require("express-async-handler");
const Job = require("../models/Job");
const Application = require("../models/Application");
const ApiError = require("../utils/ApiError");
const ApiResponse = require("../utils/ApiResponse");

// Escapes regex special characters so free-text input can't break $regex
// queries or be (ab)used as a regex — e.g. "C++", "R&D (Remote)", "St. Louis"
// would previously either throw or match unpredictably.
const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// Builds a Mongo filter object from query params
const buildFilter = (query) => {
  const filter = { status: "active" };

  if (query.search) {
    filter.$text = { $search: query.search };
  }
  if (query.location) {
    filter.location = { $regex: escapeRegex(query.location.trim()), $options: "i" };
  }
  if (query.employmentType) {
    filter.employmentType = query.employmentType;
  }
  if (query.workMode) {
    filter.workMode = query.workMode;
  }
  if (query.experience) {
    filter.experience = query.experience;
  }
  if (query.salaryMin || query.salaryMax) {
    filter.salary = {};
    if (query.salaryMin) filter.salary.$gte = Number(query.salaryMin);
    if (query.salaryMax) filter.salary.$lte = Number(query.salaryMax);
  }

  return filter;
};

const buildSort = (sort) => {
  const map = {
    "salary-desc": { salary: -1 },
    "salary-asc": { salary: 1 },
    newest: { createdAt: -1 },
    oldest: { createdAt: 1 },
  };
  return map[sort] || { createdAt: -1 };
};

// @desc    List jobs with search, filter, sort, pagination
// @route   GET /api/jobs
// @access  Public
const getJobs = asyncHandler(async (req, res) => {
  const page = Math.max(parseInt(req.query.page) || 1, 1);
  const limit = Math.min(parseInt(req.query.limit) || 10, 50);
  const skip = (page - 1) * limit;

  const filter = buildFilter(req.query);
  const sort = buildSort(req.query.sort);

  const [jobs, total] = await Promise.all([
    Job.find(filter).populate("recruiter", "name companyName companyLogo").sort(sort).skip(skip).limit(limit),
    Job.countDocuments(filter),
  ]);

  res.status(200).json(
    new ApiResponse(200, {
      jobs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  );
});

// @desc    Get featured jobs (spotlighted: highest salary active listings) for landing page
// @route   GET /api/jobs/featured
// @access  Public
const getFeaturedJobs = asyncHandler(async (req, res) => {
  const jobs = await Job.find({ status: "active" })
    .populate("recruiter", "name companyName companyLogo")
    .sort({ salary: -1 })
    .limit(6);
  res.status(200).json(new ApiResponse(200, { jobs }));
});

// @desc    Get most recently posted active jobs for landing page
// @route   GET /api/jobs/recent
// @access  Public
const getRecentJobs = asyncHandler(async (req, res) => {
  const jobs = await Job.find({ status: "active" })
    .populate("recruiter", "name companyName companyLogo")
    .sort({ createdAt: -1 })
    .limit(3);
  res.status(200).json(new ApiResponse(200, { jobs }));
});

// @desc    Get single job with similar jobs
// @route   GET /api/jobs/:id
// @access  Public
const getJobById = asyncHandler(async (req, res) => {
  const job = await Job.findById(req.params.id).populate(
    "recruiter",
    "name companyName companyLogo website aboutCompany"
  );
  if (!job) throw new ApiError(404, "Job not found");

  const similarJobs = await Job.find({
    _id: { $ne: job._id },
    status: "active",
    $or: [{ skills: { $in: job.skills } }, { title: { $regex: job.title.split(" ")[0], $options: "i" } }],
  })
    .limit(4)
    .select("title company salary location employmentType workMode createdAt");

  let applicationStatus = null;
  if (req.user && req.user.role === "applicant") {
    const existing = await Application.findOne({ job: job._id, applicant: req.user._id });
    applicationStatus = existing ? existing.status : null;
  }

  res.status(200).json(new ApiResponse(200, { job, similarJobs, applicationStatus }));
});

// @desc    Create a job
// @route   POST /api/jobs
// @access  Private (recruiter)
const createJob = asyncHandler(async (req, res) => {
  const job = await Job.create({ ...req.body, recruiter: req.user._id });
  res.status(201).json(new ApiResponse(201, { job }, "Job created"));
});

// @desc    Update a job
// @route   PUT /api/jobs/:id
// @access  Private (recruiter, owner only)
const updateJob = asyncHandler(async (req, res) => {
  const job = await Job.findById(req.params.id);
  if (!job) throw new ApiError(404, "Job not found");
  if (job.recruiter.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "You can only edit jobs you posted");
  }

  Object.assign(job, req.body);
  await job.save();

  res.status(200).json(new ApiResponse(200, { job }, "Job updated"));
});

// @desc    Archive a job (soft delete)
// @route   PATCH /api/jobs/:id/archive
// @access  Private (recruiter, owner only)
const archiveJob = asyncHandler(async (req, res) => {
  const job = await Job.findById(req.params.id);
  if (!job) throw new ApiError(404, "Job not found");
  if (job.recruiter.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "You can only archive jobs you posted");
  }

  job.status = job.status === "active" ? "archived" : "active";
  await job.save();

  res.status(200).json(new ApiResponse(200, { job }, `Job ${job.status}`));
});

// @desc    Get jobs posted by the logged-in recruiter
// @route   GET /api/jobs/recruiter/mine
// @access  Private (recruiter)
const getRecruiterJobs = asyncHandler(async (req, res) => {
  const filter = { recruiter: req.user._id };
  if (req.query.status) filter.status = req.query.status;

  const jobs = await Job.find(filter).sort({ createdAt: -1 });
  res.status(200).json(new ApiResponse(200, { jobs }));
});

module.exports = {
  getJobs,
  getFeaturedJobs,
  getRecentJobs,
  getJobById,
  createJob,
  updateJob,
  archiveJob,
  getRecruiterJobs,
};
