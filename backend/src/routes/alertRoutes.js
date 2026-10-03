import { Router } from "express";
import {
  getAlerts,
  getAlertById,
  sendAlert,
  retryAlert,
} from "../controllers/alertController.js";
import { optionalAuth } from "../middleware/auth.js";

const router = Router();

// Public / operator view of alerts
router.get("/", getAlerts);
router.get("/:id", getAlertById);

// Dispatch alert notification
router.post("/:detectionId/send", optionalAuth, sendAlert);

// Retry alert notification
router.post("/:detectionId/retry", optionalAuth, retryAlert);

export default router;
