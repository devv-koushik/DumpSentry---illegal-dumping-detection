import { Router } from "express";
import upload from "../middleware/upload.js";
import {
  analyzeImage,
  getEnvironmentalContext,
} from "../controllers/analysisController.js";
import { requireAdmin } from "../middleware/auth.js";
import { analysisLimiter } from "../middleware/rateLimit.js";
import { verifyMagicBytes } from "../middleware/magicBytes.js";

const router = Router();

// Image analysis with YOLO and geospatial context detection (requires authentication)
router.post("/analyze", analysisLimiter, requireAdmin, upload.single("image"), verifyMagicBytes, analyzeImage);

// Standalone environmental context detection endpoint (independent of YOLO)
router.get("/context", getEnvironmentalContext);
router.post("/context", getEnvironmentalContext);

export default router;
