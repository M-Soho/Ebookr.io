import { Router } from "express";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { prisma } from "../db.js";
import { requireAuth, type AuthedRequest } from "../middleware/auth.js";
import { planFor } from "../services/plans.js";

export const contactsRouter = Router();
contactsRouter.use(requireAuth);

const STATUSES = ["lead", "prospect", "client", "inactive"] as const;

// tags are stored as a JSON string in SQLite; (de)serialize at the edge.
function parseTags(raw: string): string[] {
  try {
    const v = JSON.parse(raw);
    return Array.isArray(v) ? v.filter((t) => typeof t === "string") : [];
  } catch {
    return [];
  }
}

function shape(c: {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  status: string;
  tags: string;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}) {
  return { ...c, tags: parseTags(c.tags) };
}

const upsertSchema = z.object({
  firstName: z.string().min(1, "First name is required").max(120),
  lastName: z.string().max(120).optional().default(""),
  email: z.string().email().optional().or(z.literal("")).transform((v) => v || null),
  phone: z.string().max(40).optional().or(z.literal("")).transform((v) => v || null),
  company: z.string().max(160).optional().or(z.literal("")).transform((v) => v || null),
  status: z.enum(STATUSES).optional().default("lead"),
  tags: z.array(z.string().max(40)).max(25).optional().default([]),
  notes: z.string().max(5000).optional().or(z.literal("")).transform((v) => v || null),
});

// ---------------------------------------------------------------------------
// List (with search + status filter)
// ---------------------------------------------------------------------------
contactsRouter.get("/", async (req: AuthedRequest, res, next) => {
  try {
    const q = String(req.query.q ?? "").trim();
    const status = String(req.query.status ?? "").trim();

    const where: Prisma.ContactWhereInput = { userId: req.userId };
    if (status && (STATUSES as readonly string[]).includes(status)) where.status = status;
    if (q) {
      where.OR = [
        { firstName: { contains: q } },
        { lastName: { contains: q } },
        { email: { contains: q } },
        { company: { contains: q } },
      ];
    }

    const contacts = await prisma.contact.findMany({
      where,
      orderBy: { updatedAt: "desc" },
    });
    res.json({ contacts: contacts.map(shape) });
  } catch (err) {
    next(err);
  }
});

// ---------------------------------------------------------------------------
// Create (plan-gated on contact count)
// ---------------------------------------------------------------------------
contactsRouter.post("/", async (req: AuthedRequest, res, next) => {
  try {
    const data = upsertSchema.parse(req.body);

    const user = await prisma.user.findUnique({ where: { id: req.userId } });
    const limit = planFor(user?.plan).contacts;
    if (limit !== Infinity) {
      const count = await prisma.contact.count({ where: { userId: req.userId } });
      if (count >= limit) {
        return res.status(402).json({
          error: `You've reached the ${limit}-contact limit on the Free plan. Upgrade to Pro for unlimited contacts.`,
          code: "plan_limit",
        });
      }
    }

    const contact = await prisma.contact.create({
      data: {
        userId: req.userId!,
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phone: data.phone,
        company: data.company,
        status: data.status,
        tags: JSON.stringify(data.tags),
        notes: data.notes,
      },
    });
    res.status(201).json({ contact: shape(contact) });
  } catch (err) {
    next(err);
  }
});

// ---------------------------------------------------------------------------
// Read one (with reminders + interaction timeline)
// ---------------------------------------------------------------------------
contactsRouter.get("/:id", async (req: AuthedRequest, res, next) => {
  try {
    const contact = await prisma.contact.findFirst({
      where: { id: req.params.id, userId: req.userId },
      include: {
        reminders: { orderBy: { dueAt: "asc" } },
        interactions: { orderBy: { occurredAt: "desc" } },
      },
    });
    if (!contact) return res.status(404).json({ error: "Contact not found" });
    res.json({ contact: { ...shape(contact), reminders: contact.reminders, interactions: contact.interactions } });
  } catch (err) {
    next(err);
  }
});

// ---------------------------------------------------------------------------
// Update
// ---------------------------------------------------------------------------
contactsRouter.put("/:id", async (req: AuthedRequest, res, next) => {
  try {
    const data = upsertSchema.parse(req.body);
    const existing = await prisma.contact.findFirst({
      where: { id: req.params.id, userId: req.userId },
    });
    if (!existing) return res.status(404).json({ error: "Contact not found" });

    const contact = await prisma.contact.update({
      where: { id: existing.id },
      data: {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phone: data.phone,
        company: data.company,
        status: data.status,
        tags: JSON.stringify(data.tags),
        notes: data.notes,
      },
    });
    res.json({ contact: shape(contact) });
  } catch (err) {
    next(err);
  }
});

// ---------------------------------------------------------------------------
// Delete
// ---------------------------------------------------------------------------
contactsRouter.delete("/:id", async (req: AuthedRequest, res, next) => {
  try {
    const existing = await prisma.contact.findFirst({
      where: { id: req.params.id, userId: req.userId },
    });
    if (!existing) return res.status(404).json({ error: "Contact not found" });
    await prisma.contact.delete({ where: { id: existing.id } });
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

// ---------------------------------------------------------------------------
// Log an interaction against a contact
// ---------------------------------------------------------------------------
const interactionSchema = z.object({
  type: z.enum(["call", "email", "meeting", "note"]),
  summary: z.string().min(1, "Summary is required").max(2000),
  occurredAt: z.coerce.date().optional(),
});

contactsRouter.post("/:id/interactions", async (req: AuthedRequest, res, next) => {
  try {
    const contact = await prisma.contact.findFirst({
      where: { id: req.params.id, userId: req.userId },
    });
    if (!contact) return res.status(404).json({ error: "Contact not found" });

    const data = interactionSchema.parse(req.body);
    const interaction = await prisma.interaction.create({
      data: {
        userId: req.userId!,
        contactId: contact.id,
        type: data.type,
        summary: data.summary,
        occurredAt: data.occurredAt ?? new Date(),
      },
    });
    res.status(201).json({ interaction });
  } catch (err) {
    next(err);
  }
});
