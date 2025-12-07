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

    phone: { type: String, default: null },
    address: { type: String, default: null },
  },
  {
    timestamps: true,
    collection: "users",
    toJSON: {
      transform(_doc, ret) {
        if (ret) {
          delete (ret as any).password;
          delete (ret as any).refreshTokenHash;
        }
        return ret;
      },
    },
    toObject: {
      transform(_doc, ret) {
        if (ret) {
          delete (ret as any).password;
          delete (ret as any).refreshTokenHash;
        }
        return ret;
      },
    },
  }
);

export default model<IUser>("User", UserSchema);
