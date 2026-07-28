const { validationResult } = require("express-validator");
const ApiError = require("../utils/ApiError");

// Runs after express-validator chains; throws ApiError(400) with details if invalid
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const messages = errors.array().map((e) => `${e.path}: ${e.msg}`);
    throw new ApiError(400, "Validation failed", messages);
  }
  next();
};

module.exports = validate;
