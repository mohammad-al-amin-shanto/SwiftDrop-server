import { Request, Response } from "express";
import * as parcelService from "../services/parcel.service";
import {
  parsePagination,
  buildPaginationResult,
} from "../utilities/pagination";

export async function createParcelHandler(req: Request, res: Response) {
  try {
    const user = (req as any).user;
    const { receiverId, origin, destination, weight, price, note } = req.body;
    // sender is req.user.id (role sender)
    const dto = {
      senderId: user.id,
      receiverId,
      origin,
      destination,
      weight,
      price,
      note,
    };
    const parcel = await parcelService.createParcel(dto);
    return res.status(201).json({ status: "success", data: parcel });
  } catch (err: any) {
    console.error(err);
    return res
      .status(400)
      .json({
        status: "fail",
        message: err.message || "Could not create parcel",
      });
  }
}

export async function getParcelByTrackingHandler(req: Request, res: Response) {
  try {
    const { trackingId } = req.params;
    const parcel = await parcelService.getParcelByTrackingId(trackingId);
    if (!parcel)
      return res
        .status(404)
        .json({ status: "fail", message: "Parcel not found" });
    return res.json({ status: "success", data: parcel });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ status: "error", message: "Server error" });
  }
}

export async function listParcelsHandler(req: Request, res: Response) {
  try {
    const { page, limit, sort } = parsePagination(req.query);
    // build role-restricted filters
    const user = (req as any).user;
    const filters: any = { ...req.query };
    // If not admin, restrict to own parcels
    if (user && user.role === "sender") filters.senderId = user.id;
    if (user && user.role === "receiver") filters.receiverId = user.id;
    const { items, total } = await parcelService.listParcels({
      filters,
      page,
      limit,
      sort,
    });
    return res.json(buildPaginationResult(items, total, page, limit));
  } catch (err) {
    console.error(err);
    return res.status(500).json({ status: "error", message: "Server error" });
  }
}

export async function updateStatusHandler(req: Request, res: Response) {
  try {
    const user = (req as any).user;
    const { id } = req.params; // parcel id
    const { status, note } = req.body;
    if (!status)
      return res
        .status(400)
        .json({ status: "fail", message: "Missing status" });
    const updated = await parcelService.updateParcelStatus(
      id,
      status,
      user?.id,
      note
    );
    if (!updated)
      return res
        .status(404)
        .json({ status: "fail", message: "Parcel not found" });
    return res.json({ status: "success", data: updated });
  } catch (err: any) {
    console.error(err);
    return res
      .status(400)
      .json({
        status: "fail",
        message: err.message || "Could not update status",
      });
  }
}

export async function cancelParcelHandler(req: Request, res: Response) {
  try {
    const user = (req as any).user;
    const { id } = req.params;
    const cancelled = await parcelService.cancelParcel(id, user?.id);
    if (!cancelled)
      return res
        .status(404)
        .json({ status: "fail", message: "Parcel not found" });
    return res.json({ status: "success", data: cancelled });
  } catch (err: any) {
    console.error(err);
    return res
      .status(400)
      .json({
        status: "fail",
        message: err.message || "Could not cancel parcel",
      });
  }
}
