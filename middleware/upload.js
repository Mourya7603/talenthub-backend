const multer = require("multer");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");

// --- Storage backend selection --------------------------------------------
// Two modes, chosen automatically based on whether Cloudinary env vars are
// configured:
//
// 1. Cloudinary (production-appropriate): files are held in memory only
//    (multer.memoryStorage()) and streamed to Cloudinary by the controller.
//    Required if the backend is deployed to Vercel (or any serverless host)
//    — those have a READ-ONLY filesystem outside /tmp, so writing to local
//    disk fails outright in production (EROFS).
//
// 2. Local disk (dev convenience): used automatically when Cloudinary env
//    vars are absent, so `npm run dev` works out of the box without needing
//    a Cloudinary account. NOT suitable for the actual deployment.
const USE_CLOUDINARY = Boolean(process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET);

if (USE_CLOUDINARY) {
  const cloudinary = require("cloudinary").v2;
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
}

const UPLOAD_ROOT = path.join(__dirname, "..", "uploads");
if (!USE_CLOUDINARY) {
  // This runs at module load time (when this file is first require()'d),
  // BEFORE any request is handled — on a read-only filesystem (Vercel and
  // most other serverless hosts, outside /tmp) this throws EROFS and crashes
  // the entire function for every route, not just upload ones, since Node
  // can't finish loading the module. Wrapped so a read-only filesystem just
  // disables the local-disk fallback (uploads will fail with a clear error
  // at request time instead) rather than taking down the whole API.
  try {
    ["resumes", "photos"].forEach((sub) => {
      const dir = path.join(UPLOAD_ROOT, sub);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    });
  } catch (err) {
    console.error(
      `Could not create local upload directories (${err.message}). This is expected on a read-only ` +
        "filesystem (e.g. Vercel) — set CLOUDINARY_CLOUD_NAME/CLOUDINARY_API_KEY/CLOUDINARY_API_SECRET " +
        "to enable uploads in this environment. All other routes are unaffected."
    );
  }
}

const diskStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const sub = req.uploadType === "photo" ? "photos" : "resumes";
    cb(null, path.join(UPLOAD_ROOT, sub));
  },
  filename: (req, file, cb) => {
    const unique = crypto.randomBytes(16).toString("hex");
    cb(null, `${unique}${path.extname(file.originalname)}`);
  },
});

const RESUME_TYPES = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);
const PHOTO_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

const fileFilter = (req, file, cb) => {
  const allowed = req.uploadType === "photo" ? PHOTO_TYPES : RESUME_TYPES;
  if (!allowed.has(file.mimetype)) {
    const err = new Error(
      req.uploadType === "photo" ? "Only JPG, PNG, WEBP, or GIF images are allowed" : "Only PDF, DOC, or DOCX files are allowed"
    );
    err.statusCode = 400;
    return cb(err);
  }
  cb(null, true);
};

// Tags the upload type onto req BEFORE multer runs, since multer's own
// storage/fileFilter callbacks need to know which rules to apply and don't
// otherwise have a clean way to read the route that invoked them.
const tagUploadType = (type) => (req, res, next) => {
  req.uploadType = type;
  next();
};

const upload = multer({
  storage: USE_CLOUDINARY ? multer.memoryStorage() : diskStorage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});

module.exports = { upload, tagUploadType, UPLOAD_ROOT, USE_CLOUDINARY };
