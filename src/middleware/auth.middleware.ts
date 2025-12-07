// src/middleware/auth.middleware.ts
import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import User from "../models/User.model";
import type { IUser } from "../models/User.model";
import { Types } from "mongoose";

const JWT_SECRET = process.env.JWT_SECRET ?? "change_me";

export interface AuthedUser {
  id: string;
  role: string;
  email?: string;
}

/*
 * Authenticate middleware:
 * - verifies Bearer token
 * - fetches user
 * - rejects blocked users
 */
export async function authenticate(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const authHeader = (req.headers.authorization || "").split(" ");
    const token =
      authHeader.length === 2 && authHeader[0] === "Bearer"
        ? authHeader[1]
        : null;

    if (!token) {
      return res
        .status(401)
        .json({ status: "fail", message: "No token provided" });
    }

    let payload: unknown;
    try {
      payload = jwt.verify(token, JWT_SECRET);
    } catch {
      return res
        .status(401)
        .json({ status: "fail", message: "Invalid or expired token" });
    }

    const payloadObj = payload as { id?: string };
    if (!payloadObj.id) {
      return res
        .status(401)
        .json({ status: "fail", message: "Invalid token payload" });
    }

    const user = (await User.findById(payloadObj.id).select(
      "+isBlocked +role +email"
    )) as IUser | null;

    if (!user) {
      return res
        .status(401)
        .json({ status: "fail", message: "User not found" });
    }

    if (user.isBlocked) {
      return res
        .status(403)
        .json({ status: "fail", message: "User is blocked" });
    }

    const objectId = user._id as unknown as Types.ObjectId;

    (req as any).user = {
      id: objectId.toString(),
      role: user.role,
      email: user.email,
    } as AuthedUser;

    next();
  } catch (err) {
    console.error("auth.middleware error", err);
    return res.status(500).json({ status: "error", message: "Server error" });
  }
}
