import { Router, Request, Response, NextFunction } from "express";
import * as authController from "../controllers/auth.controller";
import { authenticate } from "../middleware/auth.middleware";

const router = Router();

// helper: pick the first available export name
function pickHandler(...candidates: Array<string>) {
  for (const name of candidates) {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore - dynamic lookup
    if (typeof authController[name] === "function") {
      // @ts-ignore
      return authController[name];
    }
  }
  // fallback handler
  return (req: Request, res: Response) =>
    res.status(501).json({ status: "error", message: "Not implemented" });
}

// Register
const registerHandler = pickHandler(
  "registerHandler",
  "register",
  "registerUser",
  "createUser"
);
router.post("/register", registerHandler as unknown as any);

// Login (accepts email or shortId in `email` field)
const loginHandler = pickHandler(
  "loginHandler",
  "login",
  "loginUser",
  "authenticateUser"
);
router.post("/login", loginHandler as unknown as any);

// Refresh token (optional)
const refreshHandler = pickHandler(
  "refreshTokenHandler",
  "refreshToken",
  "refresh",
  "refreshHandler"
);
router.post("/refresh", refreshHandler as unknown as any);

// Logout (optional)
const logoutHandler = pickHandler("logoutHandler", "logout");
router.post("/logout", authenticate, logoutHandler as unknown as any);

// Me (protected) - returns current user
const meHandler = pickHandler("meHandler", "me", "getMe");
router.get("/me", authenticate, meHandler as unknown as any);

export default router;
