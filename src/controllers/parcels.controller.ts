// src/controllers/parcels.controller.ts
import type { Request, Response } from "express";
import * as parcelService from "../services/parcel.service";
import * as userService from "../services/user.service";
import { Types } from "mongoose";
import {
  parsePagination,
  buildPaginationResult,
} from "../utilities/pagination";

export async function createParcelHandler(req: Request, res: Response) {
  try {
    const user = (req as any).user;
    if (!user?.id) {
      return res
        .status(401)
        .json({ status: "fail", message: "Not authenticated" });
    }

    let { receiverId, origin, destination, weight, price, note } = req.body;
    if (!receiverId || !origin || !destination) {
      return res
        .status(400)
        .json({ status: "fail", message: "Missing required parcel fields" });
    }

    // If receiverId is not a valid ObjectId, treat it as a shortId and resolve to _id
    if (!Types.ObjectId.isValid(String(receiverId))) {
      const found = await userService.findByShortId(String(receiverId));
      if (!found) {
        return res
          .status(404)
          .json({ status: "fail", message: "Receiver not found" });
      }
      receiverId = String(found._id);
    }

    // Normalize senderId to string
    const senderId = String(user.id);

    const dto = {
      senderId,
      receiverId: String(receiverId),
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
    return res.status(400).json({
      status: "fail",
      message: err?.message || "Could not create parcel",
    });
  }
}

// the rest of this file (getParcelByTrackingHandler, listParcelsHandler, etc.)
// can remain unchanged — only createParcelHandler required the shortId resolution.
