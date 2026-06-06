import crypto from "crypto";

// Single-use tokens (email verification, password reset). We send the raw token
// in the link and store only its SHA-256 hash, so a DB leak can't be replayed.

export function generateToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

export function hashToken(raw: string): string {
  return crypto.createHash("sha256").update(raw).digest("hex");
}
