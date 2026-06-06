import { Router } from "express";
import { prisma } from "../db.js";
import { requireAuth, type AuthedRequest } from "../middleware/auth.js";
import { planFor, planView, type PlanId } from "../services/plans.js";

export const dashboardRouter = Router();
dashboardRouter.use(requireAuth);

dashboardRouter.get("/", async (req: AuthedRequest, res, next) => {
  try {
    const userId = req.userId!;
    const now = new Date();
    const in7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const [user, totalContacts, byStatus, overdue, upcoming, recent] = await Promise.all([
      prisma.user.findUnique({ where: { id: userId } }),
      prisma.contact.count({ where: { userId } }),
      prisma.contact.groupBy({
        by: ["status"],
        where: { userId },
        _count: { _all: true },
      }),
      prisma.reminder.findMany({
        where: { userId, completedAt: null, dueAt: { lt: now } },
        orderBy: { dueAt: "asc" },
        take: 8,
        include: { contact: { select: { id: true, firstName: true, lastName: true } } },
      }),
      prisma.reminder.findMany({
        where: { userId, completedAt: null, dueAt: { gte: now, lte: in7Days } },
        orderBy: { dueAt: "asc" },
        take: 8,
        include: { contact: { select: { id: true, firstName: true, lastName: true } } },
      }),
      prisma.interaction.findMany({
        where: { userId },
        orderBy: { occurredAt: "desc" },
        take: 8,
        include: { contact: { select: { id: true, firstName: true, lastName: true } } },
      }),
    ]);

    const pipeline = { lead: 0, prospect: 0, client: 0, inactive: 0 } as Record<string, number>;
    for (const row of byStatus) pipeline[row.status] = row._count._all;

    const planId = (user?.plan ?? "free") as PlanId;
    const limits = planFor(planId);

    res.json({
      stats: {
        totalContacts,
        clients: pipeline.client,
        overdueCount: overdue.length,
        upcomingCount: upcoming.length,
      },
      pipeline,
      overdue,
      upcoming,
      recent,
      plan: planView(planId),
      usage: {
        contacts: totalContacts,
        contactLimit: limits.contacts === Infinity ? null : limits.contacts,
      },
    });
  } catch (err) {
    next(err);
  }
});
