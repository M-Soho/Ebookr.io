import rateLimit from "express-rate-limit";

// Throttle sensitive auth endpoints to blunt brute-force / abuse.
// Tune per-route; keyed by IP. In production behind a proxy, ensure
// `app.set("trust proxy", 1)` so the client IP is read correctly.

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 20, // login/register attempts per IP per window
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many attempts. Please try again later." },
});

export const sensitiveLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // forgot-password / resend-verification per IP per hour
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests. Please try again later." },
});
