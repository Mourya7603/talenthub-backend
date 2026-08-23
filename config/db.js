const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB connected: ${conn.connection.host}`);
  } catch (err) {
    // Deliberately NOT process.exit(1) here — the HTTP server (see server.js)
    // is already listening independently of this connection. Killing the
    // whole process on a DB hiccup means Render sees a crash and restarts
    // the container, port-scans again, potentially hits the same transient
    // Mongo issue, and repeats — a crash-loop instead of a clear, persistent
    // error. Logging loudly and staying up means /api/health still responds,
    // and DB-backed routes fail individually with a diagnosable error rather
    // than the entire deploy silently failing with no application logs at all.
    console.error(`MongoDB connection error: ${err.message}`);
    console.error("The server is still running, but every database-backed route will fail until this is resolved.");
    console.error("Common causes: MONGO_URI missing/incorrect, MongoDB Atlas Network Access not allowing this host's IP, or a password needing URL-encoding.");
  }
};

module.exports = connectDB;
