import { Router } from "express";
import {
  getReports,
  createReport,
  updateReportStatus,
  deleteReport,
} from "../controllers/reportController.js";
import { requireAdmin } from "../middleware/auth.js";
import { globalLimiter } from "../middleware/rateLimit.js";

const router = Router();

// Public can submit reports and view them
router.get("/", globalLimiter, getReports);
router.post("/", globalLimiter, createReport);

// Only admins can update status or delete
router.patch("/:id/status", requireAdmin, updateReportStatus);
router.delete("/:id", requireAdmin, deleteReport);

export default router;
