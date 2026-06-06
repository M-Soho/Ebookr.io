import type { NextFunction, Request, Response } from "express";
import { verifyToken } from "../utils/jwt.js";

export interface AuthedRequest extends Request {
  userId?: string;
}

export function requireAuth(
  req: AuthedRequest,
  res: Response,
  next: NextFunction
) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Not authenticated" });
  }
  try {
    const payload = verifyToken(header.slice("Bearer ".length));
    req.userId = payload.sub;
    next();
  } catch {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}
