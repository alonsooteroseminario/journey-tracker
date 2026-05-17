import { randomBytes } from "node:crypto";

/** Generates a ~128-bit URL-safe token suitable for use as a capability URL. */
export function generateShareToken(): string {
  return randomBytes(16).toString("base64url");
}
