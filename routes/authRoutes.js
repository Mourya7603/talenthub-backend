const express = require("express");
const { body } = require("express-validator");
const validate = require("../middleware/validate");
const { protect } = require("../middleware/auth");
const {
  registerApplicant,
  registerRecruiter,
  login,
  getMe,
} = require("../controllers/authController");

const router = express.Router();

const passwordRule = body("password").isLength({ min: 6 }).withMessage("Password must be at least 6 characters");
const emailRule = body("email").isEmail().withMessage("A valid email is required");
const nameRule = body("name").trim().notEmpty().withMessage("Name is required");

router.post(
  "/register/applicant",
  [nameRule, emailRule, passwordRule],
  validate,
  registerApplicant
);

router.post(
  "/register/recruiter",
  [nameRule, emailRule, passwordRule, body("companyName").trim().notEmpty().withMessage("Company name is required")],
  validate,
  registerRecruiter
);

router.post("/login", [emailRule, body("password").notEmpty().withMessage("Password is required")], validate, login);

router.get("/me", protect, getMe);

module.exports = router;
