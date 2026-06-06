// Plan catalog + gating helpers. Mirrors the pricing table in
// Ebookr_REQUIREMENTS.md §3. Limits use Infinity for "unlimited".
// Enforced server-side; a hit returns HTTP 402 with an upgrade message.

export type PlanId = "free" | "pro" | "team";

export interface PlanLimits {
  label: string;
  priceMonthly: number; // USD
  contacts: number;
  teamMembers: number;
  activeDripCampaigns: number;
  aiEmail: boolean;
  apiAccess: boolean;
}

export const PLANS: Record<PlanId, PlanLimits> = {
  free: {
    label: "Free",
    priceMonthly: 0,
    contacts: 100,
    teamMembers: 1,
    activeDripCampaigns: 1,
    aiEmail: false,
    apiAccess: false,
  },
  pro: {
    label: "Pro",
    priceMonthly: 49,
    contacts: Infinity,
    teamMembers: 1,
    activeDripCampaigns: 10,
    aiEmail: true,
    apiAccess: false,
  },
  team: {
    label: "Team",
    priceMonthly: 99,
    contacts: Infinity,
    teamMembers: 10,
    activeDripCampaigns: Infinity,
    aiEmail: true,
    apiAccess: true,
  },
};

export function planFor(plan: string | null | undefined): PlanLimits {
  return PLANS[(plan as PlanId) ?? "free"] ?? PLANS.free;
}

// JSON-safe view of a plan (Infinity → null) for sending to the client.
export function planView(id: PlanId) {
  const p = PLANS[id];
  const clean = (n: number) => (n === Infinity ? null : n);
  return {
    id,
    label: p.label,
    priceMonthly: p.priceMonthly,
    contacts: clean(p.contacts),
    teamMembers: clean(p.teamMembers),
    activeDripCampaigns: clean(p.activeDripCampaigns),
    aiEmail: p.aiEmail,
    apiAccess: p.apiAccess,
  };
}
