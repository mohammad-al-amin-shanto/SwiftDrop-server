import { Router } from "express";
import {
  listUsersHandler,
  updateUserBlockStatus,
  updateUserHandler,
} from "../controllers/users.controller";
import { authenticate } from "../middleware/auth.middleware";
import { allowRoles } from "../middleware/role.middleware";

const router = Router();

router.get("/", authenticate, allowRoles("admin"), listUsersHandler);

router.patch(
  "/:id/block",
  authenticate,
  allowRoles("admin"),
  updateUserBlockStatus
);

router.patch("/:id", authenticate, allowRoles("admin"), updateUserHandler);

export default router;
