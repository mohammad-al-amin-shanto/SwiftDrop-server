import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware";
import { allowRoles } from "../middleware/role.middleware";
import {
  getDashboardSummary,
  getReceiverDashboardSummary,
} from "../controllers/dashboard.controller";

const router = Router();

/**
 * Admin / Global dashboard
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
