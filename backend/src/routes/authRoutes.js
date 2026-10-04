import { Router } from "express";
import { login, getMe } from "../controllers/authController.js";
import { requireAdmin } from "../middleware/auth.js";
import { authLimiter } from "../middleware/rateLimit.js";

const router = Router();

router.post("/login", authLimiter, login);
router.get("/me", requireAdmin, getMe);

export default router;
