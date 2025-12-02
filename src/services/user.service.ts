// src/services/user.service.ts
import User, { IUser } from "../models/User.model";
import { Types } from "mongoose";
import generateShortId from "../utilities/generateShortId";

export interface CreateUserDTO {
  name: string;
  email: string;
  password: string; // already hashed by caller
  role?: "sender" | "receiver" | "admin" | string;
  phone?: string | null;
  address?: string | null;
}

/**
 * Create a user and attempt to assign a unique shortId.
 * Tries a few times to avoid collisions.
 */
export async function createUser(dto: CreateUserDTO): Promise<IUser> {
  let shortId: string | undefined;

  // try several candidates to avoid a collision
  for (let i = 0; i < 6; i++) {
    const candidate = generateShortId(8);
    const exists = await User.findOne({ shortId: candidate }).lean().exec();
    if (!exists) {
      shortId = candidate;
      break;
    }
  }

  const user = await User.create({
    name: dto.name,
    email: dto.email.toLowerCase(),
    password: dto.password,
    role: dto.role ?? "sender",
    shortId,
    phone: dto.phone ?? null,
    address: dto.address ?? null,
  });

  return user;
}

export async function findByEmail(email: string): Promise<IUser | null> {
  if (!email) return null;
  return User.findOne({ email: email.toLowerCase() }).exec();
}

export async function findByShortId(shortId: string): Promise<IUser | null> {
  if (!shortId) return null;
  return User.findOne({ shortId }).exec();
}

export async function findById(id: string): Promise<IUser | null> {
  if (!Types.ObjectId.isValid(id)) return null;
  return User.findById(id).exec();
}
