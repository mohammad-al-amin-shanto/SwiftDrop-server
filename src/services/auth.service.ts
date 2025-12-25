
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import * as userService from "./user.service";
import User, { IUser } from "../models/User.model";

const JWT_SECRET = (process.env.JWT_SECRET || "changeme") as jwt.Secret;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";
const BCRYPT_SALT_ROUNDS = Number(process.env.SALT_ROUNDS ?? 10);

export interface AuthPayload {
  id: string;
  email: string;
  role: string;
}

/**
 * Sign a JWT for a user. We cast expiresIn to `any` to satisfy the @types/jsonwebtoken
 * signatures while preserving the runtime behavior.
 */
export function signToken(
  user: IUser | { _id: any; email: string; role: string }
): string {
  if (!user) throw new Error("No user provided to signToken");

  const payload: AuthPayload = {
    id: String((user as any)._id),
    email: String((user as any).email),
    role: String((user as any).role),
  };

  // Cast expiresIn to `any` so TS stops complaining about the union with undefined.
  const options: jwt.SignOptions = {
    expiresIn: JWT_EXPIRES_IN as unknown as any,
  };

  return jwt.sign(payload, JWT_SECRET, options);
}

/**
 * Register a new user:
 * - check email uniqueness
 * - hash password
 * - create user via userService.createUser (should assign shortId)
 * - return { token, user }
 */
export async function registerUser(input: {
  name: string;
  email: string;
  password: string;
  role?: "sender" | "receiver" | "admin" | string;
}) {
  const emailLower = input.email.trim().toLowerCase();
  const existing = await userService.findByEmail(emailLower);
  if (existing) {
    throw new Error("Email already in use");
  }

  const hashed = await bcrypt.hash(input.password, BCRYPT_SALT_ROUNDS);

  const user = await userService.createUser({
    name: input.name,
    email: emailLower,
    password: hashed,
    role: input.role ?? "sender",
  });

  const token = signToken(user as IUser);
  return { token, user };
}

/**
 * Login by email OR shortId.
 * Client should send { email: value, password } where value may be an email or shortId.
 */
export async function loginUser(input: { email: string; password: string }) {
  const loginId = input.email.trim();

  // Query Mongoose directly to select the hashed password for comparison
  let userDoc = (await User.findOne({ email: loginId.toLowerCase() })
    .select("+password")
    .exec()) as (IUser & { password?: string }) | null;

  if (!userDoc) {
    userDoc = (await User.findOne({ shortId: loginId })
      .select("+password")
      .exec()) as (IUser & { password?: string }) | null;
  }

  if (!userDoc || !userDoc.password) {
    throw new Error("Invalid credentials");
  }

  const ok = await bcrypt.compare(input.password, userDoc.password);
  if (!ok) throw new Error("Invalid credentials");

  // Return clean user (without password)
  const user = await userService.findById(String((userDoc as any)._id));
  const token = signToken(user as IUser);

  return { token, user };
}

/**
 * Return the current authenticated user by id.
 */
export async function getMe(userId: string) {
  const user = await userService.findById(userId);
  if (!user) throw new Error("User not found");
  return user;
}
