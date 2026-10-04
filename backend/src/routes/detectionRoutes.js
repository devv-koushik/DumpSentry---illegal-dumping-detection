import { Router } from "express";
import {
  getDetections,
  getMapDetections,
  getDetectionById,
  updateDetectionStatus,
  verifyDetection,
  deleteDetection,
} from "../controllers/detectionController.js";
import { requireAdmin } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { z } from "zod";

const getDetectionsSchema = z.object({
  status: z.string().optional(),
  context: z.string().optional(),
  search: z.string().optional(),
  page: z.union([z.string(), z.number()]).optional(),
  limit: z.union([z.string(), z.number()]).optional(),
});

const router = Router();

// Public read endpoints
router.get("/", validate(getDetectionsSchema, "query"), getDetections);
router.get("/map", getMapDetections);
router.get("/:id", getDetectionById);

// Status update and verification (requires authentication)
router.patch("/:id/status", requireAdmin, updateDetectionStatus);
router.post("/:id/verify", requireAdmin, verifyDetection);

// Delete endpoint strictly protected
router.delete("/:id", requireAdmin, deleteDetection);

export default router;
