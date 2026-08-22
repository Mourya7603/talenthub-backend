const asyncHandler = require("express-async-handler");
const User = require("../models/User");
const ApiError = require("../utils/ApiError");
const ApiResponse = require("../utils/ApiResponse");
const generateToken = require("../utils/generateToken");

// @desc    Register a new applicant
// @route   POST /api/auth/register/applicant
// @access  Public
const registerApplicant = asyncHandler(async (req, res) => {
  const { name, email, password, skills, experience, bio, resumeUrl } = req.body;

  const existing = await User.findOne({ email });
  if (existing) throw new ApiError(409, "An account with this email already exists");

  const user = await User.create({
    name,
    email,
    password,
    role: "applicant",
    skills: skills || [],
    experience: experience || "",
    bio: bio || "",
    resumeUrl: resumeUrl || "",
  });

  const token = generateToken(user._id, user.role);
  res.status(201).json(new ApiResponse(201, { user: user.toSafeObject(), token }, "Applicant registered"));
});

// @desc    Register a new recruiter
// @route   POST /api/auth/register/recruiter
// @access  Public
const registerRecruiter = asyncHandler(async (req, res) => {
  const { name, email, password, companyName, website, aboutCompany } = req.body;

  const existing = await User.findOne({ email });
  if (existing) throw new ApiError(409, "An account with this email already exists");

  const user = await User.create({
    name,
    email,
    password,
    role: "recruiter",
    companyName: companyName || "",
    website: website || "",
    aboutCompany: aboutCompany || "",
  });

  const token = generateToken(user._id, user.role);
  res.status(201).json(new ApiResponse(201, { user: user.toSafeObject(), token }, "Recruiter registered"));
});

// @desc    Login (common for both roles)
// @route   POST /api/auth/login
// @access  Public
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email }).select("+password");
  if (!user || !(await user.comparePassword(password))) {
    throw new ApiError(401, "Invalid email or password");
  }

  const token = generateToken(user._id, user.role);
  res.status(200).json(new ApiResponse(200, { user: user.toSafeObject(), token }, "Login successful"));
});

// @desc    Get currently authenticated user (for persistent login)
// @route   GET /api/auth/me
// @access  Private
const getMe = asyncHandler(async (req, res) => {
  res.status(200).json(new ApiResponse(200, { user: req.user.toSafeObject() }));
});

module.exports = { registerApplicant, registerRecruiter, login, getMe };
