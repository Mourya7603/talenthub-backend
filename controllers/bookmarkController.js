const asyncHandler = require("express-async-handler");
const Bookmark = require("../models/Bookmark");
const Job = require("../models/Job");
const ApiError = require("../utils/ApiError");
const ApiResponse = require("../utils/ApiResponse");

// @desc    Get all bookmarked jobs for the logged-in applicant
// @route   GET /api/bookmarks
// @access  Private (applicant)
const getBookmarks = asyncHandler(async (req, res) => {
  const bookmarks = await Bookmark.find({ applicant: req.user._id })
    .populate({
      path: "job",
      select: "title company salary location employmentType workMode status createdAt",
    })
    .sort({ createdAt: -1 });

  res.status(200).json(new ApiResponse(200, { bookmarks }));
});

// @desc    Bookmark a job
// @route   POST /api/bookmarks/:jobId
// @access  Private (applicant)
const addBookmark = asyncHandler(async (req, res) => {
  const job = await Job.findById(req.params.jobId);
  if (!job) throw new ApiError(404, "Job not found");

  const existing = await Bookmark.findOne({ applicant: req.user._id, job: job._id });
  if (existing) throw new ApiError(409, "Job already bookmarked");

  const bookmark = await Bookmark.create({ applicant: req.user._id, job: job._id });
  res.status(201).json(new ApiResponse(201, { bookmark }, "Job bookmarked"));
});

// @desc    Remove a bookmark
// @route   DELETE /api/bookmarks/:jobId
// @access  Private (applicant)
const removeBookmark = asyncHandler(async (req, res) => {
  const bookmark = await Bookmark.findOneAndDelete({ applicant: req.user._id, job: req.params.jobId });
  if (!bookmark) throw new ApiError(404, "Bookmark not found");

  res.status(200).json(new ApiResponse(200, { jobId: req.params.jobId }, "Bookmark removed"));
});

module.exports = { getBookmarks, addBookmark, removeBookmark };
