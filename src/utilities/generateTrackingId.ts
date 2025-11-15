import crypto from "crypto";

export default function generateTrackingId(): string {
  const rand = crypto.randomBytes(3).toString("hex").toUpperCase();
  const tail = Date.now().toString().slice(-4);
  return `PD-${rand}-${tail}`;
}
