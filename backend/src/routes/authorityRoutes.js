import { Router } from "express";
import {
  getAuthorities,
  createAuthority,
  updateAuthority,
  deleteAuthority,
} from "../controllers/authorityController.js";
import { requireAdmin } from "../middleware/auth.js";

const router = Router();

router.get("/", getAuthorities);
router.post("/", requireAdmin, createAuthority);
router.put("/:id", requireAdmin, updateAuthority);
router.delete("/:id", requireAdmin, deleteAuthority);

export default router;
