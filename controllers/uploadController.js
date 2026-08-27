const asyncHandler = require("express-async-handler");
const path = require("path");
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
    // Cloudinary's "raw" resource_type (used for non-image files like PDFs)
    // serves the delivery URL using the public_id verbatim — without a file
    // extension baked into it, the resulting URL has none, and PDF/DOC
    // viewers can't tell what kind of file they're being handed, which is
    // exactly what produced "something is wrong with this object" when
    // opening an uploaded resume. Images don't have this problem since
    // Cloudinary appends the detected format automatically for resource_type
    // "image", so this only needs to apply to the raw (resume) path.
    const ext = path.extname(req.file.originalname);
    const publicId = req.uploadType === "photo" ? `${req.user._id}-${Date.now()}` : `${req.user._id}-${Date.now()}${ext}`;

    const result = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder,
          resource_type: req.uploadType === "photo" ? "image" : "raw",
          public_id: publicId,
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
