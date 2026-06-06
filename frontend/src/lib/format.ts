// Shared display helpers for CRM entities.

export const CONTACT_STATUSES = ["lead", "prospect", "client", "inactive"] as const;
export type ContactStatus = (typeof CONTACT_STATUSES)[number];

export const REMINDER_TYPES = ["call", "email", "meeting", "task"] as const;
export type ReminderType = (typeof REMINDER_TYPES)[number];

export const statusBadge: Record<string, string> = {
  lead: "bg-warning/15 text-warning",
  prospect: "bg-accent-blueSoft text-accent-blue",
  client: "bg-success/15 text-success",
  inactive: "bg-ink-muted/15 text-ink-muted",
};

export const typeIcon: Record<string, string> = {
  call: "📞",
  email: "✉️",
  meeting: "🤝",
  task: "✅",
  note: "📝",
};

export function initials(name?: string) {
  return (name ?? "U")
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function fullName(c: { firstName: string; lastName?: string }) {
  return `${c.firstName}${c.lastName ? " " + c.lastName : ""}`.trim();
}

export function formatDate(d: string | Date) {
  return new Date(d).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function formatDateTime(d: string | Date) {
  return new Date(d).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

// "in 3 days", "2 days ago", "today"
export function relativeDay(d: string | Date) {
  const target = new Date(d);
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const t = new Date(target);
  t.setHours(0, 0, 0, 0);
  const days = Math.round((t.getTime() - start.getTime()) / (24 * 60 * 60 * 1000));
  if (days === 0) return "today";
  if (days === 1) return "tomorrow";
  if (days === -1) return "yesterday";
  if (days < 0) return `${Math.abs(days)} days ago`;
  return `in ${days} days`;
}

// datetime-local input value (YYYY-MM-DDTHH:mm) from a Date.
export function toLocalInput(d: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
