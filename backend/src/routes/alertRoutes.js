import { Router } from "express";
import { getAlerts, sendAlert } from "../controllers/alertController.js";
import { requireAdmin } from "../middleware/auth.js";

const router = Router();

// Public / operator view of alerts
router.get("/", getAlerts);

// Dispatch alert notification (Admin only)
router.post("/:detectionId/send", requireAdmin, sendAlert);

export default router;
