import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db.js";
import { requireAuth, type AuthedRequest } from "../middleware/auth.js";
import { planFor } from "../services/plans.js";
import { generateFollowupEmail } from "../services/ai.service.js";

export const aiRouter = Router();
aiRouter.use(requireAuth);

function parseTags(raw: string): string[] {
  try {
    const v = JSON.parse(raw);
    return Array.isArray(v) ? v.filter((t) => typeof t === "string") : [];
  } catch {
    return [];
  }
}

const schema = z.object({
  contactId: z.string().min(1),
  intent: z
    .string()
    .min(1, "Tell the assistant what the email should accomplish")
    .max(1000),
  tone: z.enum(["friendly", "professional", "direct", "warm"]).optional().default("friendly"),
});

// POST /api/ai/email — generate a follow-up email draft for a contact.
// Plan-gated: AI email is a Pro/Team feature (Free → 402).
aiRouter.post("/email", async (req: AuthedRequest, res, next) => {
  try {
    const { contactId, intent, tone } = schema.parse(req.body);

    const user = await prisma.user.findUnique({ where: { id: req.userId } });
    if (!planFor(user?.plan).aiEmail) {
      return res.status(402).json({
        error: "AI email generation is a Pro feature. Upgrade to Pro or Team to use it.",
        code: "plan_limit",
      });
    }

    const contact = await prisma.contact.findFirst({
      where: { id: contactId, userId: req.userId },
      include: { interactions: { orderBy: { occurredAt: "desc" }, take: 5 } },
    });
    if (!contact) return res.status(404).json({ error: "Contact not found" });

    const draft = await generateFollowupEmail({
      contact: {
        firstName: contact.firstName,
        lastName: contact.lastName,
        company: contact.company,
        status: contact.status,
        tags: parseTags(contact.tags),
        notes: contact.notes,
      },
      interactions: contact.interactions.map((i) => ({ type: i.type, summary: i.summary })),
      intent,
      tone,
      senderName: user?.name ?? "Me",
    });

    res.json({ draft });
  } catch (err) {
    next(err);
  }
});
