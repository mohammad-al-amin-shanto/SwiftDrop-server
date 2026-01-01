import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware";
import { allowRoles } from "../middleware/role.middleware";
import {
  getDashboardSummary,
  getReceiverDashboardSummary,
  getAdminDashboardSummary,
} from "../controllers/dashboard.controller";

const router = Router();

/**
 * Admin dashboard (production)
 */
router.get(
  "/admin",
  authenticate,
  allowRoles("admin"),
  getAdminDashboardSummary
);

/**
 * Legacy / summary (optional – keep if already used)
 */
router.get("/summary", authenticate, allowRoles("admin"), getDashboardSummary);

/**
 * Receiver dashboard
 */
router.get(
  "/receiver",
  authenticate,
  allowRoles("receiver"),
  getReceiverDashboardSummary
);

export default router;
