import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { api, apiError } from "../lib/api";
import { useAuth } from "../store/auth";
import { fullName, relativeDay, formatDateTime, typeIcon } from "../lib/format";

interface MiniContact { id: string; firstName: string; lastName: string }
interface Reminder { id: string; title: string; type: string; dueAt: string; contact: MiniContact | null }
interface Interaction { id: string; type: string; summary: string; occurredAt: string; contact: MiniContact | null }
interface DashboardData {
  stats: { totalContacts: number; clients: number; overdueCount: number; upcomingCount: number };
  pipeline: Record<string, number>;
  overdue: Reminder[];
  upcoming: Reminder[];
  recent: Interaction[];
  plan: { label: string };
  usage: { contacts: number; contactLimit: number | null };
}

const PIPE = [
  { key: "lead", label: "Leads", color: "#f59e0b" },
  { key: "prospect", label: "Prospects", color: "#3b82f6" },
  { key: "client", label: "Clients", color: "#10b981" },
  { key: "inactive", label: "Inactive", color: "#64748b" },
];

export default function Dashboard() {
  const { user } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .get("/dashboard")
      .then((res) => setData(res.data))
      .catch((err) => setError(apiError(err)));
  }, []);

  if (error) return <div className="card text-danger">{error}</div>;
  if (!data) return <div className="text-ink-muted">Loading…</div>;

  const pieData = PIPE.map((p) => ({ name: p.label, value: data.pipeline[p.key] ?? 0, color: p.color }))
    .filter((d) => d.value > 0);
  const firstName = user?.name?.split(" ")[0] ?? "there";

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Welcome back, {firstName}</h1>
          <p className="text-sm text-ink-muted">Here's what needs your attention today.</p>
        </div>
        <Link to="/contacts" className="btn-primary">+ Add contact</Link>
      </div>

      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Total contacts" value={data.stats.totalContacts} hint={data.usage.contactLimit ? `of ${data.usage.contactLimit} on Free` : "unlimited"} />
        <Stat label="Clients" value={data.stats.clients} hint="won business" tone="success" />
        <Stat label="Overdue" value={data.stats.overdueCount} hint="follow-ups" tone={data.stats.overdueCount ? "danger" : "muted"} />
        <Stat label="Due this week" value={data.stats.upcomingCount} hint="upcoming" tone="blue" />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Pipeline */}
        <div className="card lg:col-span-1">
          <h2 className="font-semibold">Pipeline</h2>
          {pieData.length === 0 ? (
            <p className="mt-6 text-sm text-ink-muted">No contacts yet.</p>
          ) : (
            <>
              <div className="h-44">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={pieData} dataKey="value" nameKey="name" innerRadius={45} outerRadius={70} paddingAngle={2}>
                      {pieData.map((d) => <Cell key={d.name} fill={d.color} stroke="none" />)}
                    </Pie>
                    <Tooltip contentStyle={{ background: "#151823", border: "1px solid #242838", borderRadius: 8, color: "#f1f5f9" }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <ul className="mt-2 space-y-1.5">
                {PIPE.map((p) => (
                  <li key={p.key} className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2 text-ink-secondary">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ background: p.color }} />
                      {p.label}
                    </span>
                    <span className="font-medium">{data.pipeline[p.key] ?? 0}</span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>

        {/* Overdue + upcoming */}
        <div className="card lg:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Follow-ups</h2>
            <Link to="/reminders" className="text-sm text-accent-blue hover:underline">View all</Link>
          </div>

          <ReminderGroup title="Overdue" tone="danger" items={data.overdue} empty="Nothing overdue 🎉" />
          <ReminderGroup title="Upcoming" tone="blue" items={data.upcoming} empty="No upcoming reminders." />
        </div>
      </div>

      {/* Recent activity */}
      <div className="card">
        <h2 className="font-semibold">Recent activity</h2>
        {data.recent.length === 0 ? (
          <p className="mt-3 text-sm text-ink-muted">No interactions logged yet.</p>
        ) : (
          <ul className="mt-3 divide-y divide-line">
            {data.recent.map((i) => (
              <li key={i.id} className="flex items-start gap-3 py-2.5">
                <span className="text-lg leading-none">{typeIcon[i.type] ?? "•"}</span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm">
                    {i.contact && (
                      <span className="font-medium">{fullName(i.contact)} · </span>
                    )}
                    <span className="text-ink-secondary">{i.summary}</span>
                  </p>
                  <p className="text-xs text-ink-muted">{formatDateTime(i.occurredAt)}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value, hint, tone = "default" }: {
  label: string; value: number; hint?: string;
  tone?: "default" | "success" | "danger" | "blue" | "muted";
}) {
  const color = {
    default: "text-ink-primary", success: "text-success", danger: "text-danger",
    blue: "text-accent-blue", muted: "text-ink-primary",
  }[tone];
  return (
    <div className="card">
      <p className="text-sm text-ink-muted">{label}</p>
      <p className={`mt-1 text-3xl font-bold ${color}`}>{value}</p>
      {hint && <p className="mt-0.5 text-xs text-ink-muted">{hint}</p>}
    </div>
  );
}

function ReminderGroup({ title, tone, items, empty }: {
  title: string; tone: "danger" | "blue"; items: Reminder[]; empty: string;
}) {
  return (
    <div className="mt-4">
      <p className={`text-xs font-semibold uppercase tracking-wide ${tone === "danger" ? "text-danger" : "text-accent-blue"}`}>
        {title} <span className="text-ink-muted">({items.length})</span>
      </p>
      {items.length === 0 ? (
        <p className="mt-1 text-sm text-ink-muted">{empty}</p>
      ) : (
        <ul className="mt-1.5 space-y-1.5">
          {items.map((r) => (
            <li key={r.id} className="flex items-center justify-between gap-3 rounded-lg bg-bg-elevated px-3 py-2 text-sm">
              <span className="flex min-w-0 items-center gap-2">
                <span>{typeIcon[r.type] ?? "•"}</span>
                <span className="truncate">{r.title}</span>
                {r.contact && <span className="truncate text-ink-muted">· {fullName(r.contact)}</span>}
              </span>
              <span className={`shrink-0 text-xs ${tone === "danger" ? "text-danger" : "text-ink-muted"}`}>
                {relativeDay(r.dueAt)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
