import multer from "multer";
import path from "path";
import { randomUUID } from "crypto";
import env from "../config/env.js";

const ALLOWED_MIMES = ["image/jpeg", "image/png", "image/webp", "image/tiff"];

const storage = multer.diskStorage({
  destination(_req, _file, cb) {
    cb(null, path.resolve("uploads"));
  },
  filename(_req, file, cb) {
    const ext = path.extname(file.originalname) || ".jpg";
    cb(null, `${randomUUID()}${ext}`);
  },
});

function fileFilter(_req, file, cb) {
  if (ALLOWED_MIMES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Unsupported file type: ${file.mimetype}. Allowed: ${ALLOWED_MIMES.join(", ")}`));
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
