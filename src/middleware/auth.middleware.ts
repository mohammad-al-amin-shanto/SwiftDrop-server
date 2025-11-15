import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { Types } from "mongoose";
import User from "../models/User.model";

const JWT_SECRET = process.env.JWT_SECRET || "change_me";

export interface AuthedUser {
  id: string;
  role: string;
  email?: string;
}

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

    let payload: any;
    try {
      payload = jwt.verify(token, JWT_SECRET);
    } catch (err) {
      return res
        .status(401)
        .json({ status: "fail", message: "Invalid or expired token" });
    }

    // optional: fetch user to confirm still valid / not blocked
    const user = await User.findById(payload.id).select(
      "+isBlocked +role +email"
    );
    if (!user)
      return res
        .status(401)
        .json({ status: "fail", message: "User not found" });
    if (user.isBlocked)
      return res
        .status(403)
        .json({ status: "fail", message: "User is blocked" });

    (req as any).user = {
      id: user._id.toString(),
      role: user.role,
      email: user.email,
    } as AuthedUser;
    next();
  } catch (err) {
    console.error("auth.middleware error", err);
    return res.status(500).json({ status: "error", message: "Server error" });
  }
}
