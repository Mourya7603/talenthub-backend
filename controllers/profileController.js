const asyncHandler = require("express-async-handler");
const User = require("../models/User");
const ApiResponse = require("../utils/ApiResponse");

const APPLICANT_FIELDS = ["name", "photo", "bio", "experience", "education", "skills", "resumeUrl"];
const RECRUITER_FIELDS = ["name", "companyName", "companyLogo", "website", "aboutCompany"];

// @desc    Update logged-in user's profile (fields differ by role)
// @route   PUT /api/profile
// @access  Private
const updateProfile = asyncHandler(async (req, res) => {
  const allowedFields = req.user.role === "applicant" ? APPLICANT_FIELDS : RECRUITER_FIELDS;

  allowedFields.forEach((field) => {
    if (req.body[field] !== undefined) {
      req.user[field] = req.body[field];
    }
  });

  await req.user.save();
  res.status(200).json(new ApiResponse(200, { user: req.user.toSafeObject() }, "Profile updated"));
});

// @desc    Get a public recruiter profile (used on job details page)
// @route   GET /api/profile/recruiter/:id
// @access  Public
const getRecruiterProfile = asyncHandler(async (req, res) => {
  const recruiter = await User.findOne({ _id: req.params.id, role: "recruiter" }).select(
    "name companyName companyLogo website aboutCompany"
  );
  res.status(200).json(new ApiResponse(200, { recruiter }));
});

module.exports = { updateProfile, getRecruiterProfile };
