import { Router } from "express";
import { getDrones, updateTelemetry } from "../controllers/droneController.js";
import { requireAdmin } from "../middleware/auth.js";

const router = Router();

router.get("/", getDrones);
router.post("/telemetry", requireAdmin, updateTelemetry);

export default router;
