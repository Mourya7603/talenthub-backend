require("dotenv").config();
const path = require("path");
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");

const connectDB = require("./config/db");
const { notFound, errorHandler } = require("./middleware/errorHandler");

const authRoutes = require("./routes/authRoutes");
const jobRoutes = require("./routes/jobRoutes");
const applicationRoutes = require("./routes/applicationRoutes");
const bookmarkRoutes = require("./routes/bookmarkRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const profileRoutes = require("./routes/profileRoutes");
const aiRoutes = require("./routes/aiRoutes");
const uploadRoutes = require("./routes/uploadRoutes");

const app = express();

// --- Core middleware ---
// crossOriginResourcePolicy defaults to "same-origin", which would silently
// block the frontend (a different origin — e.g. a Vercel domain) from
// loading uploaded photos/resumes served from this API's /uploads path.
app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
app.use(
  cors({
    origin: process.env.CLIENT_URL || "*",
    credentials: true,
  })
);
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));
if (process.env.NODE_ENV !== "test") {
  app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));
}

// General rate limit across the API
app.use(
  "/api",
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 300,
    standardHeaders: true,
    legacyHeaders: false,
  })
);

// Serve uploaded resumes/photos. See middleware/upload.js for the note on
// this being local-disk storage — fine for dev, but ephemeral on most
// serverless hosts in production.
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// --- Health check ---
app.get("/api/health", (req, res) => {
  res.status(200).json({ success: true, message: "TalentHub API is running" });
});

// --- Routes ---
app.use("/api/auth", authRoutes);
app.use("/api/jobs", jobRoutes);
app.use("/api/applications", applicationRoutes);
app.use("/api/bookmarks", bookmarkRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/upload", uploadRoutes);

// --- Error handling (must be last) ---
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

// Bind the port immediately, independent of the database connection.
// Previously this awaited connectDB() first — if Mongo was slow to connect,
// misconfigured, or Atlas's IP allowlist didn't include Render's egress IP,
// app.listen() never ran at all, so Render's deploy port-scan saw nothing
// listening on 0.0.0.0 and failed the deploy outright ("No open ports
// detected"), even though the failure was really "Mongo is slow/unreachable",
// not "the server crashed." Now /api/health responds right away regardless,
// and the DB connects in the background — every DB-backed route will still
// correctly fail with a clear error until it connects, but the process
// itself comes up immediately and stays up.
app.listen(PORT, () => {
  console.log(`TalentHub API listening on port ${PORT} [${process.env.NODE_ENV || "development"}]`);
});

connectDB();

module.exports = app;
