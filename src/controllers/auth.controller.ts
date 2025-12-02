// src/controllers/auth.controller.ts
import type { Request, Response } from "express";
import * as authService from "../services/auth.service";

/**
 * Register handler
 * Expects body: { name, email, password, role? }
 * Returns: { token, user }
 */
export async function registerHandler(req: Request, res: Response) {
  try {
    const { name, email, password, role } = req.body ?? {};

    if (!name || !email || !password) {
      return res.status(400).json({
        status: "fail",
        message: "name, email and password are required",
      });
    }

    const result = await authService.registerUser({
      name,
      email,
      password,
      role,
    });

    // registerUser returns { token, user }
    return res.status(201).json({ status: "success", data: result });
  } catch (err: any) {
    console.error("registerHandler error:", err);
    const message = err?.message ?? "Could not register user";
    return res.status(400).json({ status: "fail", message });
  }
}

/**
 * Login handler
 * Expects body: { email, password } where `email` may be actual email or shortId
 * Returns: { token, user }
 */
export async function loginHandler(req: Request, res: Response) {
  try {
    const { email, password } = req.body ?? {};

    if (!email || !password) {
      return res.status(400).json({
        status: "fail",
        message: "email (or shortId) and password are required",
      });
    }

    const result = await authService.loginUser({ email, password });
    // loginUser returns { token, user }
    return res.status(200).json({ status: "success", data: result });
  } catch (err: any) {
    console.error("loginHandler error:", err);
    // Return 401 on invalid credentials to be conventional
    const msg = err?.message ?? "Authentication failed";
    const statusCode = msg === "Invalid credentials" ? 401 : 400;
    return res.status(statusCode).json({ status: "fail", message: msg });
  }
}

/**
 * Get current authenticated user
 * Assumes authenticate middleware put the user id onto req.user.id
 */
export async function meHandler(req: Request, res: Response) {
  try {
    const userFromReq = (req as any).user;
    const userId = userFromReq?.id ?? userFromReq?._id ?? null;

    if (!userId) {
      return res
        .status(401)
        .json({ status: "fail", message: "Not authenticated" });
    }

    const user = await authService.getMe(String(userId));
    return res.status(200).json({ status: "success", data: user });
  } catch (err: any) {
    console.error("meHandler error:", err);
    const message = err?.message ?? "Could not fetch user";
    return res.status(400).json({ status: "fail", message });
  }
}

/**
 * Optional: simple refresh token handler if you add refresh token support later.
 * For now it returns 501 (not implemented) so callers won't rely on missing functions.
 */
export async function refreshTokenHandler(_req: Request, res: Response) {
  return res
    .status(501)
    .json({ status: "fail", message: "Refresh token not implemented" });
}
