const asyncHandler = require("express-async-handler");
const ApiError = require("../utils/ApiError");
const ApiResponse = require("../utils/ApiResponse");
const { USE_CLOUDINARY } = require("../middleware/upload");

// @desc    Upload a resume (PDF/DOC/DOCX) or photo (image), returns its URL
// @route   POST /api/upload/resume | POST /api/upload/photo
// @access  Private
const handleUpload = asyncHandler(async (req, res) => {
  if (!req.file) throw new ApiError(400, "No file was uploaded");

  if (USE_CLOUDINARY) {
    const cloudinary = require("cloudinary").v2;
    const folder = req.uploadType === "photo" ? "talenthub/photos" : "talenthub/resumes";

    const result = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder,
          resource_type: req.uploadType === "photo" ? "image" : "raw",
          public_id: `${req.user._id}-${Date.now()}`,
        },
        (err, uploaded) => (err ? reject(err) : resolve(uploaded))
      );
      stream.end(req.file.buffer);
    });

    return res.status(200).json(new ApiResponse(200, { url: result.secure_url }, "File uploaded"));
  }

  // Local disk fallback (dev only — see middleware/upload.js)
  const sub = req.uploadType === "photo" ? "photos" : "resumes";
  const url = `/uploads/${sub}/${req.file.filename}`;
  res.status(200).json(new ApiResponse(200, { url }, "File uploaded"));
});

module.exports = { handleUpload };
