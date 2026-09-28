import { Router } from "express";
import {
  getRules,
  createRule,
  updateRule,
  deleteRule,
} from "../controllers/ruleController.js";
import { requireAdmin } from "../middleware/auth.js";

const router = Router();

router.get("/", getRules);
router.post("/", requireAdmin, createRule);
router.put("/:id", requireAdmin, updateRule);
router.delete("/:id", requireAdmin, deleteRule);

export default router;
