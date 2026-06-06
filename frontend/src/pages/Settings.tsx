import { useEffect, useState } from "react";
import { api } from "../lib/api";
import { useAuth } from "../store/auth";

interface Usage { contacts: number; contactLimit: number | null }

const TIERS = [
  { id: "free", label: "Free", price: 0, features: ["100 contacts", "1 active drip campaign", "Reminders & timeline"] },
  { id: "pro", label: "Pro", price: 49, features: ["Unlimited contacts", "AI email generation", "10 drip campaigns", "3 webhooks"] },
  { id: "team", label: "Team", price: 99, features: ["Everything in Pro", "Up to 10 team members", "API access & audit log", "Unlimited drip campaigns"] },
];

export default function Settings() {
  const { user } = useAuth();
  const [usage, setUsage] = useState<Usage | null>(null);

  useEffect(() => {
    api.get("/dashboard").then((res) => setUsage(res.data.usage)).catch(() => {});
  }, []);

  const currentPlan = user?.plan ?? "free";
  const pct = usage && usage.contactLimit ? Math.min(100, Math.round((usage.contacts / usage.contactLimit) * 100)) : null;

  const upgrade = () => {
    // Stripe is gated off until keys are configured (see backend config.stripe).
    alert("Billing isn't wired up yet — add your Stripe keys to enable checkout.");
  };

  return (
    <div className="max-w-3xl space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-sm text-ink-muted">Manage your account and plan.</p>
      </div>

      {/* Profile */}
      <div className="card">
        <h2 className="font-semibold">Profile</h2>
        <dl className="mt-4 space-y-3 text-sm">
          <div className="flex justify-between"><dt className="text-ink-muted">Name</dt><dd>{user?.name}</dd></div>
          <div className="flex justify-between"><dt className="text-ink-muted">Email</dt><dd>{user?.email}</dd></div>
          <div className="flex justify-between">
            <dt className="text-ink-muted">Verified</dt>
            <dd>{user?.emailVerified ? <span className="text-success">Yes</span> : <span className="text-warning">Pending</span>}</dd>
          </div>
        </dl>
      </div>

      {/* Usage */}
      <div className="card">
        <h2 className="font-semibold">Usage</h2>
        <div className="mt-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-ink-muted">Contacts</span>
            <span className="font-medium">
              {usage?.contacts ?? "—"}{usage?.contactLimit ? ` / ${usage.contactLimit}` : " · unlimited"}
            </span>
          </div>
          {pct !== null && (
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-bg-elevated">
              <div className={`h-full ${pct > 85 ? "bg-danger" : "bg-accent-blue"}`} style={{ width: `${pct}%` }} />
            </div>
          )}
        </div>
      </div>

      {/* Plans */}
      <div>
        <h2 className="mb-3 font-semibold">Plans</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          {TIERS.map((t) => {
            const isCurrent = t.id === currentPlan;
            return (
              <div key={t.id} className={`card flex flex-col ${isCurrent ? "ring-2 ring-accent-blue" : ""}`}>
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">{t.label}</h3>
                  {isCurrent && <span className="badge bg-accent-blueSoft text-accent-blue">Current</span>}
                </div>
                <p className="mt-1 text-2xl font-bold">
                  ${t.price}<span className="text-sm font-normal text-ink-muted">/mo</span>
                </p>
                <ul className="mt-3 flex-1 space-y-1.5 text-sm text-ink-secondary">
                  {t.features.map((f) => (
                    <li key={f} className="flex items-start gap-2">
                      <span className="text-success">✓</span>{f}
                    </li>
                  ))}
                </ul>
                <button
                  className={`mt-4 ${isCurrent ? "btn-secondary" : "btn-primary"}`}
                  disabled={isCurrent}
                  onClick={upgrade}
                >
                  {isCurrent ? "Current plan" : `Upgrade to ${t.label}`}
                </button>
              </div>
            );
          })}
        </div>
        <p className="mt-3 text-xs text-ink-muted">
          Billing runs through Stripe and is disabled until API keys are configured.
        </p>
      </div>
    </div>
  );
}
