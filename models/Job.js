const mongoose = require("mongoose");

const jobSchema = new mongoose.Schema(
  {
    recruiter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    title: { type: String, required: [true, "Job title is required"], trim: true },
    company: { type: String, required: [true, "Company name is required"], trim: true },
    description: { type: String, required: [true, "Job description is required"] },
    skills: [{ type: String, trim: true }],

    salary: {
      type: Number,
      required: [true, "Salary is required"],
      validate: {
        validator: (v) => v > 0,
        message: "Salary must be greater than 0",
      },
    },
    experience: {
      type: String, // e.g. "0-1", "1-3", "3-5", "5+"
      required: [true, "Experience range is required"],
    },
    location: { type: String, required: [true, "Location is required"], trim: true },
    employmentType: {
      type: String,
      enum: ["Full-time", "Part-time", "Contract", "Internship"],
      required: true,
    },
    workMode: {
      type: String,
      enum: ["Remote", "On-site", "Hybrid"],
      required: true,
    },
    applicationDeadline: {
      type: Date,
      required: [true, "Application deadline is required"],
      validate: {
        validator: function (v) {
          return v > new Date();
        },
        message: "Application deadline cannot be in the past",
      },
    },
    status: {
      type: String,
      enum: ["active", "archived"],
      default: "active",
    },
  },
  { timestamps: true }
);

jobSchema.index({ title: "text", company: "text", skills: "text" });
jobSchema.index({ location: 1, employmentType: 1, workMode: 1, status: 1 });
jobSchema.index({ salary: 1 });
jobSchema.index({ createdAt: -1 });

module.exports = mongoose.model("Job", jobSchema);
