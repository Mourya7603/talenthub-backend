const mongoose = require("mongoose");

const bookmarkSchema = new mongoose.Schema(
  {
    applicant: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    job: { type: mongoose.Schema.Types.ObjectId, ref: "Job", required: true },
  },
  { timestamps: true }
);

bookmarkSchema.index({ applicant: 1, job: 1 }, { unique: true });

module.exports = mongoose.model("Bookmark", bookmarkSchema);
