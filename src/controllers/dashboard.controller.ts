import { Request, Response } from "express";
import Parcel from "../models/Parcel.model";
import { Types } from "mongoose";

/**
 * GET /dashboard/summary
 * Returns aggregated counts for dashboard cards and simple monthly shipments chart data.
 */
export async function getDashboardSummary(req: Request, res: Response) {
  try {
    // overall counts
    const counts = await Parcel.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]);

    const countsMap: Record<string, number> = {};
    counts.forEach((c: any) => (countsMap[c._id] = c.count));

    // monthly shipments last 6 months
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    const monthly = await Parcel.aggregate([
      { $match: { createdAt: { $gte: sixMonthsAgo } } },
      {
        $project: {
          month: { $dateToString: { format: "%Y-%m", date: "$createdAt" } },
        },
      },
      { $group: { _id: "$month", count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]);

    return res.json({
      status: "success",
      data: {
        totals: {
          totalParcels: await Parcel.countDocuments({}),
          delivered: countsMap["Delivered"] || 0,
          inTransit: countsMap["InTransit"] || 0,
          pending: countsMap["Created"] || 0,
          cancelled: countsMap["Cancelled"] || 0,
        },
        monthly,
      },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ status: "error", message: "Server error" });
  }
}

/* ================= RECEIVER DASHBOARD ================= */

import * as parcelService from "../services/parcel.service";

export async function getReceiverDashboardSummary(req: Request, res: Response) {
  try {
    const user = (req as any).user;

    if (!user?.id) {
      return res
        .status(401)
        .json({ status: "fail", message: "Not authenticated" });
    }

    const stats = await parcelService.getReceiverDashboardStats(
      String(user.id)
    );

    return res.json({
      status: "success",
      data: stats,
    });
  } catch (err) {
    console.error("Receiver dashboard error:", err);
    return res.status(500).json({
      status: "error",
      message: "Failed to load receiver dashboard",
    });
  }
}
