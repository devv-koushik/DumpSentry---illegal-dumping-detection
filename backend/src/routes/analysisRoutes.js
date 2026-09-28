import { Router } from "express";
import upload from "../middleware/upload.js";
import { analyzeImage } from "../controllers/analysisController.js";
import { requireAdmin } from "../middleware/auth.js";

const router = Router();

// Middleware that accepts file field named either "image" or "file"
const flexibleUpload = (req, res, next) => {
  upload.any()(req, res, (err) => {
    if (err) return next(err);
    if (req.files && req.files.length > 0) {
      req.file = req.files[0];
    }
    next();
  });
};

router.post("/analyze", requireAdmin, flexibleUpload, analyzeImage);

export default router;
