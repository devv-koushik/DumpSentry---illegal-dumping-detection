import { Router } from "express";
import { getAlerts, sendAlert } from "../controllers/alertController.js";
import { optionalAuth } from "../middleware/auth.js";

const router = Router();

// Public / operator view of alerts
router.get("/", getAlerts);

// Dispatch alert notification
router.post("/:detectionId/send", optionalAuth, sendAlert);

export default router;
