const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Please provide a valid email"],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: 6,
      select: false,
    },
    role: {
      type: String,
      enum: ["applicant", "recruiter"],
      required: true,
    },

    // --- Applicant-only profile fields ---
    photo: { type: String, default: "" },
    bio: { type: String, default: "", maxlength: 1000 },
    experience: { type: String, default: "" }, // e.g. "3 years"
    education: [
      {
        degree: String,
        institution: String,
        year: String,
      },
    ],
    skills: [{ type: String, trim: true }],
    resumeUrl: { type: String, default: "" },

    // --- Recruiter-only profile fields ---
    companyName: { type: String, default: "" },
    companyLogo: { type: String, default: "" },
    website: { type: String, default: "" },
    aboutCompany: { type: String, default: "", maxlength: 2000 },
  },
  { timestamps: true }
);

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.toSafeObject = function () {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

module.exports = mongoose.model("User", userSchema);
