import crypto from "crypto";

/**
 * Generates a stable, unique, human-friendly tracking ID.
 * - crypto.randomBytes ensures strong randomness
 * - Date prefix helps avoid collisions & aids debugging
 */
export default function generateTrackingId(length = 6): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

  // --- DATE PREFIX ---
  const now = new Date();
  const year = now.getUTCFullYear();
  const month = String(now.getUTCMonth() + 1).padStart(2, "0");
  const day = String(now.getUTCDate()).padStart(2, "0");
  const datePart = `${year}${month}${day}`;

  // --- RANDOM SECTION ---
  let randomStr = "";
  try {
    const bytes = crypto.randomBytes(length);
    for (let i = 0; i < length; i++) {
      // coerce to number safely in case of undefined (satisfies TS)
      const b = (bytes[i] ?? 0) as number;
      randomStr += chars[b % chars.length];
    }
  } catch {
    // Fallback (should never run on Node)
    for (let i = 0; i < length; i++) {
      randomStr += chars[Math.floor(Math.random() * chars.length)];
    }
  }

  return `SD-${datePart}-${randomStr}`;
}
