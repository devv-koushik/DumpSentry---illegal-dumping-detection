import multer from "multer";
import path from "path";
import { randomUUID } from "crypto";
import env from "../config/env.js";

const ALLOWED_MIMES = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/tiff": ".tiff"
};

const storage = multer.diskStorage({
  destination(_req, _file, cb) {
    cb(null, path.resolve("uploads"));
  },
  filename(_req, file, cb) {
    const ext = ALLOWED_MIMES[file.mimetype] || ".bin";
    cb(null, `${randomUUID()}${ext}`);
  },
});

function fileFilter(_req, file, cb) {
  if (ALLOWED_MIMES[file.mimetype]) {
    cb(null, true);
  } else {
    cb(new Error(`Unsupported file type: ${file.mimetype}. Allowed: ${Object.keys(ALLOWED_MIMES).join(", ")}`));
  }
}

/**
 * Multer instance configured for single drone-image uploads.
 * Use as: `upload.single("image")`
 */
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: env.maxFileSizeMB * 1024 * 1024,
  },
});

export default upload;
