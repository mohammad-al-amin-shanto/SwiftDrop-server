// src/utilities/generateShortId.ts
/**
 * Generates an alphanumeric short id of given length.
 * Uses Node crypto for high-quality randomness; falls back to Math.random if needed.
 */
import crypto from "crypto";

const CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

export default function generateShortId(length = 8): string {
  if (length <= 0) return "";

  try {
    const bytes = crypto.randomBytes(length); // Buffer
    let out = "";

    for (let i = 0; i < length; i++) {
      // use readUInt8 to satisfy TS that we always get a number
      const b = bytes.readUInt8(i);
      out += CHARS[b % CHARS.length];
    }

    return out;
  } catch {
    // fallback (very unlikely in Node environment)
    return Array.from({ length })
      .map(() => CHARS[Math.floor(Math.random() * CHARS.length)])
      .join("");
  }
}
