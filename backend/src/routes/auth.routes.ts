import { Router } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "../db.js";
import { config } from "../config.js";
import { signToken } from "../utils/jwt.js";
import { generateToken, hashToken } from "../utils/tokens.js";
import { sendMail } from "../services/mailer.js";
import { requireAuth, type AuthedRequest } from "../middleware/auth.js";
import { authLimiter, sensitiveLimiter } from "../middleware/rateLimit.js";

export const authRouter = Router();

function publicUser(u: {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  plan: string;
}) {
  return { id: u.id, name: u.name, email: u.email, emailVerified: u.emailVerified, plan: u.plan };
}

// Create a single-use token of `type`, persist its hash, return the raw token.
async function issueToken(userId: string, type: "email_verify" | "password_reset", ttlMin: number) {
  const raw = generateToken();
  await prisma.authToken.create({
    data: {
      userId,
      type,
      tokenHash: hashToken(raw),
      expiresAt: new Date(Date.now() + ttlMin * 60 * 1000),
    },
  });
  return raw;
}

async function sendVerificationEmail(user: { id: string; email: string; name: string }) {
  const raw = await issueToken(user.id, "email_verify", config.tokens.emailVerifyTtlMin);
  const link = `${config.clientOrigin}/verify-email?token=${raw}`;
  await sendMail({
    to: user.email,
    subject: "Verify your Ebookr email",
    text: `Hi ${user.name},\n\nConfirm your email to finish setting up your account:\n${link}\n\nThis link expires in 24 hours. If you didn't sign up, ignore this email.`,
  });
  return link;
}

// ---------------------------------------------------------------------------
// Register
// ---------------------------------------------------------------------------
const registerSchema = z.object({
  name: z.string().min(1, "Name is required").max(120),
  email: z.string().email("Valid email is required"),
  password: z.string().min(8, "Password must be at least 8 characters").max(200),
});

authRouter.post("/register", authLimiter, async (req, res, next) => {
  try {
    const { name, email, password } = registerSchema.parse(req.body);
    const normEmail = email.trim().toLowerCase();
    const existing = await prisma.user.findUnique({ where: { email: normEmail } });
    if (existing) {
      return res.status(409).json({ error: "Email already in use" });
    }
    const passwordHash = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: { name: name.trim(), email: normEmail, passwordHash },
    });

    let devVerifyLink: string | undefined;
    try {
      const link = await sendVerificationEmail(user);
      if (!config.isProd) devVerifyLink = link;
    } catch {
      /* don't fail signup if email sending hiccups */
    }

    const token = signToken({ sub: user.id, email: user.email });
    res.status(201).json({ token, user: publicUser(user), devVerifyLink });
  } catch (err) {
    next(err);
  }
});

// ---------------------------------------------------------------------------
// Login
// ---------------------------------------------------------------------------
const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

authRouter.post("/login", authLimiter, async (req, res, next) => {
  try {
    const { email, password } = loginSchema.parse(req.body);
    const user = await prisma.user.findUnique({ where: { email: email.trim().toLowerCase() } });
    if (!user || !user.passwordHash) {
      return res.status(401).json({ error: "Invalid email or password" });
    }
    if (!(await bcrypt.compare(password, user.passwordHash))) {
      return res.status(401).json({ error: "Invalid email or password" });
    }
    const token = signToken({ sub: user.id, email: user.email });
    res.json({ token, user: publicUser(user) });
  } catch (err) {
    next(err);
  }
});

// ---------------------------------------------------------------------------
// Current user
// ---------------------------------------------------------------------------
authRouter.get("/me", requireAuth, async (req: AuthedRequest, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: {
        id: true,
        name: true,
        email: true,
        emailVerified: true,
        plan: true,
        createdAt: true,
      },
    });
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json({ user });
  } catch (err) {
    next(err);
  }
});

// ---------------------------------------------------------------------------
// Email verification
// ---------------------------------------------------------------------------
const tokenBody = z.object({ token: z.string().min(10) });

authRouter.post("/verify-email", async (req, res, next) => {
  try {
    const { token } = tokenBody.parse(req.body);
    const record = await prisma.authToken.findUnique({ where: { tokenHash: hashToken(token) } });
    if (!record || record.type !== "email_verify" || record.usedAt || record.expiresAt < new Date()) {
      return res.status(400).json({ error: "This verification link is invalid or has expired." });
    }
    await prisma.$transaction([
      prisma.user.update({ where: { id: record.userId }, data: { emailVerified: true } }),
      prisma.authToken.update({ where: { id: record.id }, data: { usedAt: new Date() } }),
    ]);
    res.json({ message: "Email verified." });
  } catch (err) {
    next(err);
  }
});

authRouter.post(
  "/resend-verification",
  sensitiveLimiter,
  requireAuth,
  async (req: AuthedRequest, res, next) => {
    try {
      const user = await prisma.user.findUnique({ where: { id: req.userId } });
      if (!user) return res.status(404).json({ error: "User not found" });
      if (user.emailVerified) return res.json({ message: "Email already verified." });
      const link = await sendVerificationEmail(user);
      res.json({ message: "Verification email sent.", devVerifyLink: config.isProd ? undefined : link });
    } catch (err) {
      next(err);
    }
  }
);

// ---------------------------------------------------------------------------
// Password reset
// ---------------------------------------------------------------------------
authRouter.post("/forgot-password", sensitiveLimiter, async (req, res, next) => {
  try {
    const { email } = z.object({ email: z.string().email() }).parse(req.body);
    const user = await prisma.user.findUnique({ where: { email: email.trim().toLowerCase() } });

    let devResetLink: string | undefined;
    if (user && user.passwordHash) {
      const raw = await issueToken(user.id, "password_reset", config.tokens.passwordResetTtlMin);
      const link = `${config.clientOrigin}/reset-password?token=${raw}`;
      await sendMail({
        to: user.email,
        subject: "Reset your Ebookr password",
        text: `Hi ${user.name},\n\nReset your password using the link below:\n${link}\n\nThis link expires in 1 hour. If you didn't request this, you can ignore it.`,
      });
      if (!config.isProd) devResetLink = link;
    }
    // Always return success — never reveal whether an email is registered.
    res.json({ message: "If that email is registered, a reset link is on its way.", devResetLink });
  } catch (err) {
    next(err);
  }
});

const resetSchema = z.object({
  token: z.string().min(10),
  password: z.string().min(8, "Password must be at least 8 characters").max(200),
});

authRouter.post("/reset-password", async (req, res, next) => {
  try {
    const { token, password } = resetSchema.parse(req.body);
    const record = await prisma.authToken.findUnique({ where: { tokenHash: hashToken(token) } });
    if (!record || record.type !== "password_reset" || record.usedAt || record.expiresAt < new Date()) {
      return res.status(400).json({ error: "This reset link is invalid or has expired." });
    }
    const passwordHash = await bcrypt.hash(password, 12);
    await prisma.$transaction([
      // Setting a password also confirms email ownership.
      prisma.user.update({
        where: { id: record.userId },
        data: { passwordHash, emailVerified: true },
      }),
      prisma.authToken.update({ where: { id: record.id }, data: { usedAt: new Date() } }),
      // Invalidate any other outstanding reset tokens for this user.
      prisma.authToken.updateMany({
        where: { userId: record.userId, type: "password_reset", usedAt: null },
        data: { usedAt: new Date() },
      }),
    ]);
    res.json({ message: "Password updated. You can now sign in." });
  } catch (err) {
    next(err);
  }
});
