// src/services/parcel.service.ts
import Parcel, { IParcel } from "../models/Parcel.model";
import { Types } from "mongoose";
import generateTrackingId from "../utilities/generateTrackingId";

export interface CreateParcelDTO {
  senderId: string;
  receiverId: string;
  origin: string;
  destination: string;
  weight?: number;
  price?: number;
  note?: string;
}

/**
 * Create a parcel with a unique trackingId.
 * - We attempt to create the document directly with a generated trackingId.
 * - If a duplicate key error (race) occurs, we retry with a new id.
 * - This is more robust than "find then create" because it avoids TOCTOU races.
 */
export async function createParcel(dto: CreateParcelDTO) {
  const maxAttempts = 6;

  // convert string IDs to ObjectIds once (validate if necessary)
  const senderObjectId = new Types.ObjectId(dto.senderId);
  const receiverObjectId = new Types.ObjectId(dto.receiverId);

  const statusLog: any = {
    status: "Created",
    timestamp: new Date(),
    note: dto.note ?? "Parcel created",
    updatedBy: senderObjectId,
  };

  // Try to create with unique trackingId, retry on duplicate-key error
  let lastError: unknown = null;
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    // generate a candidate. generateTrackingId() returns e.g. SD-YYYYMMDD-XXXXXX
    const candidate = generateTrackingId(); // default length = 6 rand chars

    try {
      const created = await Parcel.create({
        trackingId: candidate,
        senderId: senderObjectId,
        receiverId: receiverObjectId,
        origin: dto.origin,
        destination: dto.destination,
        weight: dto.weight,
        price: dto.price,
        status: "Created",
        statusLogs: [statusLog],
      } as Partial<IParcel>);

      // success
      return created;
    } catch (err: any) {
      lastError = err;

      // If the error is a duplicate key on trackingId, retry with a new candidate
      // Mongo duplicate key code may be E11000 and message contains index name
      const isDupKey =
        err &&
        (err.code === 11000 ||
          err.code === 11001 ||
          (typeof err.message === "string" &&
            /duplicate.*key|E11000/i.test(err.message)));

      if (isDupKey) {
        // collision: try again with a new id
        continue;
      }

      // For other errors, rethrow immediately
      throw err;
    }
  }

  // If we reach here we failed to create after retries — surface a friendly message
  const friendly = new Error(
    "Failed to generate a unique tracking id after multiple attempts. Please try again."
  );
  // attach last error for debugging
  (friendly as any).cause = lastError;
  throw friendly;
}

export async function getParcelByTrackingId(trackingId: string) {
  return Parcel.findOne({ trackingId })
    .populate("senderId", "name email")
    .populate("receiverId", "name email")
    .exec();
}

export async function getParcelById(id: string) {
  if (!Types.ObjectId.isValid(id)) return null;
  return Parcel.findById(id)
    .populate("senderId", "name email")
    .populate("receiverId", "name email")
    .exec();
}

export async function buildParcelsQuery(filters: any) {
  const q: any = {};
  if (filters.status) q.status = filters.status;
  if (filters.senderId) q.senderId = filters.senderId;
  if (filters.receiverId) q.receiverId = filters.receiverId;
  if (filters.trackingId) q.trackingId = filters.trackingId;
  if (filters.q) {
    const regex = new RegExp(filters.q, "i");
    q.$or = [{ origin: regex }, { destination: regex }, { trackingId: regex }];
  }
  if (filters.fromDate || filters.toDate) {
    q.createdAt = {};
    if (filters.fromDate) q.createdAt.$gte = new Date(filters.fromDate);
    if (filters.toDate) q.createdAt.$lte = new Date(filters.toDate);
  }
  return q;
}

export async function listParcels({
  filters = {},
  page = 1,
  limit = 10,
  sort = "-createdAt",
}: any) {
  const q = await buildParcelsQuery(filters);
  const skip = (page - 1) * limit;
  const [items, total] = await Promise.all([
    Parcel.find(q)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .populate("senderId", "name email")
      .populate("receiverId", "name email")
      .exec(),
    Parcel.countDocuments(q).exec(),
  ]);
  return { items, total };
}

export async function updateParcelStatus(
  parcelId: string,
  status: string,
  updatedBy?: string,
  note?: string
) {
  const p = await getParcelById(parcelId);
  if (!p) return null;

  (p as any).status = status;

  const log: any = {
    status,
    timestamp: new Date(),
    note,
  };
  if (updatedBy) {
    log.updatedBy = new Types.ObjectId(updatedBy);
  }

  (p as any).statusLogs.push(log as unknown as any);

  await (p as any).save();
  return p;
}

export async function cancelParcel(parcelId: string, userId?: string) {
  const p = await getParcelById(parcelId);
  if (!p) return null;
  if (["Dispatched", "InTransit", "Delivered"].includes((p as any).status)) {
    throw new Error("Cannot cancel parcel after dispatch");
  }
  (p as any).status = "Cancelled";

  const log: any = {
    status: "Cancelled",
    timestamp: new Date(),
    note: "Cancelled by user",
  };
  if (userId) {
    log.updatedBy = new Types.ObjectId(userId);
  }

  (p as any).statusLogs.push(log as unknown as any);
  await (p as any).save();
  return p;
}
