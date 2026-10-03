import { Router } from "express";
import upload from "../middleware/upload.js";
import {
  analyzeImage,
  getEnvironmentalContext,
} from "../controllers/analysisController.js";
import { optionalAuth } from "../middleware/auth.js";

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

// Image analysis with YOLO and geospatial context detection (allows optional authentication)
router.post("/analyze", optionalAuth, flexibleUpload, analyzeImage);

// Standalone environmental context detection endpoint (independent of YOLO)
router.get("/context", getEnvironmentalContext);
router.post("/context", getEnvironmentalContext);

export default router;
