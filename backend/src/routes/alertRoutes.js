import { Router } from "express";
import {
  getAlerts,
  getAlertById,
  sendAlert,
  retryAlert,
} from "../controllers/alertController.js";
import { requireAdmin } from "../middleware/auth.js";

const router = Router();

// Public / operator view of alerts
router.get("/", getAlerts);
router.get("/:id", getAlertById);

// Dispatch alert notification
router.post("/:detectionId/send", requireAdmin, sendAlert);

// Retry alert notification
router.post("/:detectionId/retry", requireAdmin, retryAlert);

export default router;
