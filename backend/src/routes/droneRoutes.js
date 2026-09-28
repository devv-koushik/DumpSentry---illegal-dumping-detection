import { Router } from "express";
import { getDrones, updateTelemetry } from "../controllers/droneController.js";

const router = Router();

router.get("/", getDrones);
router.post("/telemetry", updateTelemetry);

export default router;
