import { Router } from "express";
import {
  getReports,
  createReport,
  updateReportStatus,
  deleteReport,
} from "../controllers/reportController.js";
import { requireAdmin } from "../middleware/auth.js";
import { reportLimiter } from "../middleware/rateLimit.js";
import upload from "../middleware/upload.js";
import { verifyMagicBytes } from "../middleware/magicBytes.js";

const router = Router();

// Public can submit reports and view them (globalLimiter is already applied on /api in app.js)
router.get("/", getReports);
router.post("/", reportLimiter, upload.single("image"), verifyMagicBytes, createReport);

// Only admins can update status or delete
router.patch("/:id/status", requireAdmin, updateReportStatus);
router.delete("/:id", requireAdmin, deleteReport);

export default router;
