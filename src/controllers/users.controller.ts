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

    // ✅ NORMALIZE USERS (THIS IS THE MISSING PIECE)
    const users = items.map((u) => ({
      ...u.toObject(),
      isBlocked: typeof u.isBlocked === "boolean" ? u.isBlocked : false,
    }));

    // ✅ Send normalized shape
    return res.json({
      data: users,
      total,
      page,
      limit,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      status: "error",
      message: "Server error",
    });
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

export async function updateUserBlockStatus(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { block } = req.body;

    if (typeof block !== "boolean") {
      return res.status(400).json({
        status: "fail",
        message: "block must be boolean",
      });
    }

    const user = await User.findByIdAndUpdate(
      id,
      { isBlocked: block },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({
        status: "fail",
        message: "User not found",
      });
    }

    return res.json({
      status: "success",
      data: user,
    });
  } catch (err) {
    console.error("updateUserBlockStatus error:", err);
    return res.status(500).json({
      status: "error",
      message: "Failed to update user block status",
    });
  }
}
