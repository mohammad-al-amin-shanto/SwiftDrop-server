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
 * - password: select: false so queries don't return it accidentally
 * - shortId: unique + indexed so you can login by it or lookup quickly
 * - email: unique + indexed for fast lookup
 */
const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      index: true,
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

    // optional profile contact fields
    phone: { type: String, default: null },
    address: { type: String, default: null },
  },
  {
    timestamps: true,
    collection: "users",
    toJSON: {
      // use any for transform args so TS doesn't complain about deleting keys
      transform(doc: any, ret: any) {
        // Remove sensitive/internal fields before sending to clients
        if (ret) {
          delete (ret as any).password;
          delete (ret as any).refreshTokenHash;
        }
        return ret;
      },
    },
    toObject: {
      transform(doc: any, ret: any) {
        if (ret) {
          delete (ret as any).password;
          delete (ret as any).refreshTokenHash;
        }
        return ret;
      },
    },
  }
);

/**
 * Additional indexes (email and shortId already have indexes above).
 * Keep them explicit if you want compound or additional indexes later.
 */
UserSchema.index({ email: 1 });

export default model<IUser>("User", UserSchema);
