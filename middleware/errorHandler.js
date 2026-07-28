const ApiError = require("../utils/ApiError");

// Convert known Mongoose/JS errors into ApiError before final handling
const normalizeError = (err) => {
  if (err instanceof ApiError) return err;

  // Mongoose validation error
  if (err.name === "ValidationError") {
    const errors = Object.values(err.errors).map((e) => e.message);
    return new ApiError(400, "Validation failed", errors);
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0];
    return new ApiError(409, `${field ? field + " " : ""}already exists`);
  }

  // Mongoose invalid ObjectId
  if (err.name === "CastError") {
    return new ApiError(400, `Invalid value for field '${err.path}'`);
  }

  return new ApiError(err.statusCode || 500, err.message || "Internal server error");
};

const notFound = (req, res, next) => {
  next(new ApiError(404, `Route not found: ${req.originalUrl}`));
};

const errorHandler = (err, req, res, next) => {
  const normalized = normalizeError(err);

  if (normalized.statusCode >= 500) {
    console.error(err);
  }

  res.status(normalized.statusCode).json({
    success: false,
    message: normalized.message,
    errors: normalized.errors || [],
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
};

module.exports = { notFound, errorHandler };
