import { Router } from "express";
import authRoutes from "./authRoutes.js";
import detectionRoutes from "./detectionRoutes.js";
import analysisRoutes from "./analysisRoutes.js";
import alertRoutes from "./alertRoutes.js";
import authorityRoutes from "./authorityRoutes.js";
import ruleRoutes from "./ruleRoutes.js";
import dashboardRoutes from "./dashboardRoutes.js";
import droneRoutes from "./droneRoutes.js";
import wardRoutes from "./wardRoutes.js";
import reportRoutes from "./reportRoutes.js";

const router = Router();

router.use("/auth", authRoutes);
router.use("/detections", detectionRoutes);
router.use("/analysis", analysisRoutes);
router.use("/alerts", alertRoutes);
router.use("/authorities", authorityRoutes);
router.use("/rules", ruleRoutes);
router.use("/dashboard", dashboardRoutes);
router.use("/drones", droneRoutes);
router.use("/wards", wardRoutes);
router.use("/reports", reportRoutes);

// Health route
router.get("/health", (req, res) => {
  res.json({
    status: "ok",
    service: "DumpSentry Core Backend",
    timestamp: new Date().toISOString(),
  });
});

export default router;
