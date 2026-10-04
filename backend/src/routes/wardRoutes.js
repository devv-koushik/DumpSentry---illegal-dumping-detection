import { Router } from "express";
import { getWards, updateWard } from "../controllers/wardController.js";
import { requireAdmin } from "../middleware/auth.js";

const router = Router();

router.get("/", getWards);
router.put("/:id", requireAdmin, updateWard);

export default router;
