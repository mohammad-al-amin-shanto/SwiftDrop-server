import { Router } from "express";
import {
  listUsersHandler,
  blockUserHandler,
  unblockUserHandler,
} from "../controllers/users.controller";
// import { requireAuth } from "../middleware/auth.middleware";
// import { requireRole } from "../middleware/role.middleware";

const router = Router();

router.get(
  "/",
  // requireAuth,
  // requireRole("admin"),
  listUsersHandler
);

router.put(
  "/:id/block",
  // requireAuth,
  // requireRole("admin"),
  blockUserHandler
);

/**
 * PUT /users/:id/unblock
 */
router.put(
  "/:id/unblock",
  // requireAuth,
  // requireRole("admin"),
  unblockUserHandler
);

export default router;
