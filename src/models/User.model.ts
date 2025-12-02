// src/models/User.model.ts
import { Schema, model, Document } from "mongoose";

/**
 * Role union type used across the app
 */
export type Role = "sender" | "receiver" | "admin" | "delivery";

/**
 * IUser interface (Mongoose Document) representing the user.
 * Add or remove fields here to match your frontend `User` type.
 */
export interface IUser extends Document {
  name: string;
  email: string;
  password: string; // stored hashed; not returned by default because select: false
  role: Role;
  shortId?: string; // 8-character shareable id
  isBlocked: boolean;
  refreshTokenHash?: string | null;
  phone?: string | null;
  address?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * User schema
 */
const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      index: true, // keep this
      lowercase: true,
      trim: true,
    },
    password: { type: String, required: true, select: false },
    role: {
      type: String,
      enum: ["sender", "receiver", "admin", "delivery"],
      default: "sender",
    },
    shortId: {
      type: String,
      unique: true,
      sparse: true,
      index: true,
      trim: true,
    },

    isBlocked: { type: Boolean, default: false },
    refreshTokenHash: { type: String, select: false, default: null },

    phone: { type: String, default: null },
    address: { type: String, default: null },
  },
  {
    timestamps: true,
    collection: "users",
    toJSON: {
      transform(_doc: any, ret: any) {
        // remove sensitive/internal fields before sending to clients
        if (ret) {
          // use `any` to avoid TS structural issues here
          delete (ret as any).password;
          delete (ret as any).refreshTokenHash;
        }
        return ret;
      },
    },
    toObject: {
      transform(_doc: any, ret: any) {
        if (ret) {
          delete (ret as any).password;
          delete (ret as any).refreshTokenHash;
        }
        return ret;
      },
    },
  }
);

/*
 * NOTE: do NOT call `UserSchema.index({ email: 1 })` here because `email` already
 * has `index: true`. Removing duplicate index definitions avoids the duplicate-index
 * warning on startup.
 */

export default model<IUser>("User", UserSchema);
