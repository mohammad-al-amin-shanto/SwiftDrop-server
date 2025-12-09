// src/routes/users.routes.ts
import { Router } from "express";
import {
  listUsersHandler,
  blockUserHandler,
  unblockUserHandler,
} from "../controllers/users.controller";
// If you want to protect with auth/roles, uncomment and adjust these:
// import { requireAuth } from "../middleware/auth.middleware";
// import { requireRole } from "../middleware/role.middleware";

const router = Router();

/**
 * GET /users
 * List users with pagination & optional search
 * You can later protect it with admin-only middleware.
 */
router.get(
  "/",
  // requireAuth,
  // requireRole("admin"),
  listUsersHandler
);

/**
 * PUT /users/:id/block
 */
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
