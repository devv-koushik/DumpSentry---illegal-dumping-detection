import env from "../config/env.js";

/**
 * Global Express error handler.
 * Must be registered LAST with app.use(errorHandler).
 */
export default function errorHandler(err, _req, res, _next) {
  // Multer file-size / file-type errors
  if (err.code === "LIMIT_FILE_SIZE") {
    return res.status(413).json({
      error: `File too large. Maximum allowed size is ${env.maxFileSizeMB} MB.`,
    });
  }

  if (err.message && err.message.startsWith("Unsupported file type")) {
    return res.status(400).json({ error: err.message });
  }

  // Mongoose CastError (e.g. invalid ObjectId)
  if (err.name === "CastError") {
    return res.status(400).json({ error: `Invalid ${err.path}: ${err.value}` });
  }

  // Mongoose validation errors
  if (err.name === "ValidationError") {
    const details = Object.values(err.errors).map((e) => ({
      field: e.path,
      message: e.message,
    }));
    return res.status(400).json({ error: "Validation failed", details });
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern || {})[0] || "field";
    return res.status(409).json({ error: `Duplicate value for '${field}'` });
  }

  // Default
  console.error("[ERROR]", err);
  res.status(err.status || 500).json({
    error: env.isDev ? err.message : "Internal server error",
  });
}
