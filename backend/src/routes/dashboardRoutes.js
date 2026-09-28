import { Router } from "express";
import { getOverviewStats, getAnalytics } from "../controllers/dashboardController.js";

const router = Router();

router.get("/overview", getOverviewStats);
router.get("/analytics", getAnalytics);

export default router;
