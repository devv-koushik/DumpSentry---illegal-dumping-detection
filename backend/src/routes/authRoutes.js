import { Router } from "express";
import { login, getMe } from "../controllers/authController.js";
import { requireAdmin } from "../middleware/auth.js";

const router = Router();

router.post("/login", login);
router.get("/me", requireAdmin, getMe);

export default router;
