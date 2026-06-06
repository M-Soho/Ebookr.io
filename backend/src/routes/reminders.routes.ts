import { Router } from "express";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { prisma } from "../db.js";
import { requireAuth, type AuthedRequest } from "../middleware/auth.js";

export const remindersRouter = Router();
remindersRouter.use(requireAuth);

const TYPES = ["call", "email", "meeting", "task"] as const;

const upsertSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  dueAt: z.coerce.date(),
  type: z.enum(TYPES).optional().default("task"),
  contactId: z.string().optional().or(z.literal("")).transform((v) => v || null),
  notes: z.string().max(2000).optional().or(z.literal("")).transform((v) => v || null),
});

// Ensure a contactId, if provided, belongs to the caller.
async function assertOwnedContact(userId: string, contactId: string | null) {
  if (!contactId) return true;
  const c = await prisma.contact.findFirst({ where: { id: contactId, userId } });
  return Boolean(c);
}

// ---------------------------------------------------------------------------
// List — optional filter: ?filter=overdue|upcoming|completed, ?from&?to (range)
// ---------------------------------------------------------------------------
remindersRouter.get("/", async (req: AuthedRequest, res, next) => {
  try {
    const filter = String(req.query.filter ?? "");
    const where: Prisma.ReminderWhereInput = { userId: req.userId };
    const now = new Date();

    if (filter === "overdue") {
      where.completedAt = null;
      where.dueAt = { lt: now };
    } else if (filter === "upcoming") {
      where.completedAt = null;
      where.dueAt = { gte: now };
    } else if (filter === "completed") {
      where.completedAt = { not: null };
    }

    const from = req.query.from ? new Date(String(req.query.from)) : null;
    const to = req.query.to ? new Date(String(req.query.to)) : null;
    if (from || to) {
      where.dueAt = { ...(from ? { gte: from } : {}), ...(to ? { lte: to } : {}) };
    }

    const reminders = await prisma.reminder.findMany({
      where,
      orderBy: { dueAt: "asc" },
      include: { contact: { select: { id: true, firstName: true, lastName: true } } },
    });
    res.json({ reminders });
  } catch (err) {
    next(err);
  }
});

// ---------------------------------------------------------------------------
// Create
// ---------------------------------------------------------------------------
remindersRouter.post("/", async (req: AuthedRequest, res, next) => {
  try {
    const data = upsertSchema.parse(req.body);
    if (!(await assertOwnedContact(req.userId!, data.contactId))) {
      return res.status(400).json({ error: "Linked contact not found" });
    }
    const reminder = await prisma.reminder.create({
      data: {
        userId: req.userId!,
        title: data.title,
        dueAt: data.dueAt,
        type: data.type,
        contactId: data.contactId,
        notes: data.notes,
      },
    });
    res.status(201).json({ reminder });
  } catch (err) {
    next(err);
  }
});

// ---------------------------------------------------------------------------
// Update
// ---------------------------------------------------------------------------
remindersRouter.put("/:id", async (req: AuthedRequest, res, next) => {
  try {
    const data = upsertSchema.parse(req.body);
    const existing = await prisma.reminder.findFirst({
      where: { id: req.params.id, userId: req.userId },
    });
    if (!existing) return res.status(404).json({ error: "Reminder not found" });
    if (!(await assertOwnedContact(req.userId!, data.contactId))) {
      return res.status(400).json({ error: "Linked contact not found" });
    }
    const reminder = await prisma.reminder.update({
      where: { id: existing.id },
      data: {
        title: data.title,
        dueAt: data.dueAt,
        type: data.type,
        contactId: data.contactId,
        notes: data.notes,
      },
    });
    res.json({ reminder });
  } catch (err) {
    next(err);
  }
});

// ---------------------------------------------------------------------------
// Toggle complete / reopen
// ---------------------------------------------------------------------------
remindersRouter.patch("/:id/complete", async (req: AuthedRequest, res, next) => {
  try {
    const existing = await prisma.reminder.findFirst({
      where: { id: req.params.id, userId: req.userId },
    });
    if (!existing) return res.status(404).json({ error: "Reminder not found" });
    const completed = req.body?.completed ?? !existing.completedAt;
    const reminder = await prisma.reminder.update({
      where: { id: existing.id },
      data: { completedAt: completed ? new Date() : null },
    });
    res.json({ reminder });
  } catch (err) {
    next(err);
  }
});

// ---------------------------------------------------------------------------
// Delete
// ---------------------------------------------------------------------------
remindersRouter.delete("/:id", async (req: AuthedRequest, res, next) => {
  try {
    const existing = await prisma.reminder.findFirst({
      where: { id: req.params.id, userId: req.userId },
    });
    if (!existing) return res.status(404).json({ error: "Reminder not found" });
    await prisma.reminder.delete({ where: { id: existing.id } });
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});
