import { Router } from "express";
import {
  getDetections,
  getMapDetections,
  getDetectionById,
  updateDetectionStatus,
  verifyDetection,
  deleteDetection,
} from "../controllers/detectionController.js";
import { optionalAuth, requireAdmin } from "../middleware/auth.js";

const router = Router();

// Public read endpoints
router.get("/", getDetections);
router.get("/map", getMapDetections);
router.get("/:id", getDetectionById);

// Status update and verification (Admin only)
router.patch("/:id/status", requireAdmin, updateDetectionStatus);
router.post("/:id/verify", requireAdmin, verifyDetection);
router.delete("/:id", requireAdmin, deleteDetection);

export default router;
