const mongoose = require("mongoose");

const applicationSchema = new mongoose.Schema(
  {
    job: { type: mongoose.Schema.Types.ObjectId, ref: "Job", required: true },
    applicant: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    recruiter: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    status: {
      type: String,
      enum: ["applied", "shortlisted", "rejected", "withdrawn"],
      default: "applied",
    },
    resumeUrl: { type: String, required: true },
    coverNote: { type: String, default: "", maxlength: 1500 },
  },
  { timestamps: true }
);

// Prevent duplicate applications by the same applicant to the same job
applicationSchema.index({ job: 1, applicant: 1 }, { unique: true });
applicationSchema.index({ recruiter: 1, status: 1 });
applicationSchema.index({ applicant: 1, status: 1 });

module.exports = mongoose.model("Application", applicationSchema);
