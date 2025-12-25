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

// Canonical statuses: keep in sync with controllers
export type ParcelStatus =
  | "pending"
  | "collected"
  | "dispatched"
  | "in_transit"
  | "delivered"
  | "cancelled";

export async function createParcel(dto: CreateParcelDTO) {
  const maxAttempts = 6;

  // convert string IDs to ObjectIds once
  const senderObjectId = new Types.ObjectId(dto.senderId);
  const receiverObjectId = new Types.ObjectId(dto.receiverId);

  const initialStatus: ParcelStatus = "pending";

  const statusLog: any = {
    status: initialStatus,
    timestamp: new Date(),
    note: dto.note ?? "Parcel created",
    updatedBy: senderObjectId,
  };

  let lastError: unknown = null;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const candidate = generateTrackingId(); // e.g. SD-YYYYMMDD-XXXXXX

    try {
      const created = await Parcel.create({
        trackingId: candidate,
        senderId: senderObjectId,
        receiverId: receiverObjectId,
        origin: dto.origin,
        destination: dto.destination,
        weight: dto.weight,
        price: dto.price,
        status: initialStatus,
        statusLogs: [statusLog],
      } as Partial<IParcel>);

      return created;
    } catch (err: any) {
      lastError = err;

      // Duplicate key on trackingId → retry with a new id
      const isDupKey =
        err &&
        (err.code === 11000 ||
          err.code === 11001 ||
          (typeof err.message === "string" &&
            /duplicate.*key|E11000/i.test(err.message)));

      if (isDupKey) {
        continue;
      }

      // Other errors → rethrow
      throw err;
    }
  }

  const friendly = new Error(
    "Failed to generate a unique tracking id after multiple attempts. Please try again."
  );
  (friendly as any).cause = lastError;
  throw friendly;
}

export async function getParcelByTrackingId(trackingId: string) {
  return Parcel.findOne({ trackingId })
    .populate("senderId", "name email phone address shortId")
    .populate("receiverId", "name email phone address shortId")
    .exec();
}

export async function getParcelById(id: string) {
  if (!Types.ObjectId.isValid(id)) return null;
  return Parcel.findById(id)
    .populate("senderId", "name email phone address shortId")
    .populate("receiverId", "name email phone address shortId")
    .exec();
}

/**
 * Build a Mongo query from filters coming from the frontend.
 * Supports:
 * - status
 * - senderId / receiverId
 * - trackingId
 * - search (or q) across origin/destination/trackingId
 * - fromDate / toDate
 * - dateRange: "7d" | "30d" | "90d" | "all"
 */
export async function buildParcelsQuery(filters: any) {
  const q: any = {};

  if (filters.status) q.status = filters.status;
  if (filters.senderId) q.senderId = filters.senderId;
  if (filters.receiverId) q.receiverId = filters.receiverId;
  if (filters.trackingId) q.trackingId = filters.trackingId;

  // search alias (frontend sends `search`)
  const search = filters.search ?? filters.q;
  if (search) {
    const regex = new RegExp(String(search), "i");
    q.$or = [{ origin: regex }, { destination: regex }, { trackingId: regex }];
  }

  // date range via explicit from/to
  if (filters.fromDate || filters.toDate) {
    q.createdAt = {};
    if (filters.fromDate) q.createdAt.$gte = new Date(filters.fromDate);
    if (filters.toDate) q.createdAt.$lte = new Date(filters.toDate);
  }

  // date range via "7d" | "30d" | "90d" | "all"
  const dateRange = filters.dateRange;
  if (dateRange && dateRange !== "all") {
    let days = 0;
    if (dateRange === "7d") days = 7;
    else if (dateRange === "30d") days = 30;
    else if (dateRange === "90d") days = 90;

    if (days > 0) {
      const now = new Date();
      const from = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate() - days
      );

      q.createdAt = q.createdAt || {};
      q.createdAt.$gte = from;
    }
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
      .populate("senderId", "name email phone address shortId")
      .populate("receiverId", "name email phone address shortId")
      .exec(),
    Parcel.countDocuments(q).exec(),
  ]);

  // front-end expects { data, total }
  return { data: items, total };
}

export async function updateParcelStatus(
  parcelId: string,
  status: ParcelStatus,
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

  // Disallow cancel once it is effectively already moving/finished
  const nonCancelableStatuses: ParcelStatus[] = [
    "dispatched",
    "in_transit",
    "delivered",
  ];

  if (nonCancelableStatuses.includes((p as any).status)) {
    throw new Error("Cannot cancel parcel after dispatch");
  }

  (p as any).status = "cancelled";

  const log: any = {
    status: "cancelled",
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

/* ================= RECEIVER DASHBOARD STATS ================= */

export async function getReceiverDashboardStats(receiverId: string) {
  const receiverObjectId = new Types.ObjectId(receiverId);

  // Fetch all receiver parcels (lean for performance)
  const parcels = await Parcel.find({ receiverId: receiverObjectId })
    .select("status statusLogs updatedAt")
    .lean();

  let totalExpected = parcels.length;
  let inTransit = 0;
  let delivered = 0;
  let awaitingConfirmation = 0;

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  let arrivingToday = 0;

  for (const p of parcels) {
    const status = p.status;

    if (
      status === "collected" ||
      status === "dispatched" ||
      status === "in_transit"
    ) {
      inTransit++;
    }

    if (status === "delivered") {
      delivered++;

      // Check who delivered it
      const lastLog = p.statusLogs?.[p.statusLogs.length - 1];

      // If last update was NOT by receiver → awaiting confirmation
      if (!lastLog?.updatedBy || String(lastLog.updatedBy) !== receiverId) {
        awaitingConfirmation++;
      }
    }

    // "Arriving today" heuristic (delivered today)
    if (p.updatedAt && new Date(p.updatedAt) >= todayStart) {
      arrivingToday++;
    }
  }

  return {
    totalExpected,
    inTransit,
    delivered,
    awaitingConfirmation,
    arrivingToday,
  };
}
