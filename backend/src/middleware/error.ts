import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";

// Centralized error handler. Keeps responses consistent and avoids leaking stack traces.
export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  if (err instanceof ZodError) {
    return res.status(400).json({
      error: "Validation failed",
      details: err.issues.map((i) => ({ path: i.path.join("."), message: i.message })),
    });
  }
  const message = err instanceof Error ? err.message : "Internal server error";
  // eslint-disable-next-line no-console
  console.error("[error]", err);
  res.status(500).json({ error: message });
}
