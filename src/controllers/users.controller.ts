import { Request, Response } from "express";
import User from "../models/User.model";
import {
  parsePagination,
  buildPaginationResult,
} from "../utilities/pagination";

/**
 * GET /users
 * Admin: list users with pagination & search
 */
export async function listUsersHandler(req: Request, res: Response) {
  try {
    const { page, limit } = parsePagination(req.query);
    const q: any = {};
    if (req.query.q) {
      const search = new RegExp(String(req.query.q), "i");
      q.$or = [{ name: search }, { email: search }, { phone: search }];
    }
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      User.find(q)
        .select("-password -refreshTokenHash")
        .skip(skip)
        .limit(limit)
        .sort("-createdAt"),
      User.countDocuments(q),
    ]);
    return res.json(buildPaginationResult(items, total, page, limit));
  } catch (err) {
    console.error(err);
    return res.status(500).json({ status: "error", message: "Server error" });
  }
}

/**
 * PUT /users/:id/block
 */
export async function blockUserHandler(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const user = await User.findByIdAndUpdate(
      id,
      { isBlocked: true },
      { new: true }
    ).select("-password -refreshTokenHash");
    if (!user)
      return res
        .status(404)
        .json({ status: "fail", message: "User not found" });
    return res.json({ status: "success", data: user });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ status: "error", message: "Server error" });
  }
}

/**
 * PUT /users/:id/unblock
 */
export async function unblockUserHandler(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const user = await User.findByIdAndUpdate(
      id,
      { isBlocked: false },
      { new: true }
    ).select("-password -refreshTokenHash");
    if (!user)
      return res
        .status(404)
        .json({ status: "fail", message: "User not found" });
    return res.json({ status: "success", data: user });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ status: "error", message: "Server error" });
  }
}
