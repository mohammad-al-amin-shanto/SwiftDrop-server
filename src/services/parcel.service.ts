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

export async function createParcel(dto: CreateParcelDTO) {
  const trackingId = generateTrackingId();
  const statusLog = {
    status: "Created",
    timestamp: new Date(),
    note: dto.note || "Parcel created",
  };
  const parcel = await Parcel.create({
    trackingId,
    senderId: dto.senderId,
    receiverId: dto.receiverId,
    origin: dto.origin,
    destination: dto.destination,
    weight: dto.weight,
    price: dto.price,
    status: "Created",
    statusLogs: [statusLog],
  } as Partial<IParcel>);
  return parcel;
}

export async function getParcelByTrackingId(trackingId: string) {
  return Parcel.findOne({ trackingId })
    .populate("senderId", "name email")
    .populate("receiverId", "name email");
}

export async function getParcelById(id: string) {
  if (!Types.ObjectId.isValid(id)) return null;
  return Parcel.findById(id)
    .populate("senderId", "name email")
    .populate("receiverId", "name email");
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
      .populate("receiverId", "name email"),
    Parcel.countDocuments(q),
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
  p.status = status;
  p.statusLogs.push({
    status,
    timestamp: new Date(),
    updatedBy: updatedBy ? new Types.ObjectId(updatedBy) : undefined,
    note,
  });
  await p.save();
  return p;
}

export async function cancelParcel(parcelId: string, userId?: string) {
  const p = await getParcelById(parcelId);
  if (!p) return null;
  if (["Dispatched", "InTransit", "Delivered"].includes(p.status)) {
    throw new Error("Cannot cancel parcel after dispatch");
  }
  p.status = "Cancelled";
  p.statusLogs.push({
    status: "Cancelled",
    timestamp: new Date(),
    updatedBy: userId ? new Types.ObjectId(userId) : undefined,
    note: "Cancelled by user",
  });
  await p.save();
  return p;
}
