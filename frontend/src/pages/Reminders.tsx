import { useEffect, useState, useCallback } from "react";
import { api, apiError } from "../lib/api";
import {
  REMINDER_TYPES,
  fullName,
  relativeDay,
  formatDateTime,
  typeIcon,
  toLocalInput,
} from "../lib/format";

interface MiniContact { id: string; firstName: string; lastName: string }
interface Reminder {
  id: string; title: string; type: string; dueAt: string;
  completedAt: string | null; notes: string | null; contact: MiniContact | null;
}

export default function Reminders() {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [contacts, setContacts] = useState<MiniContact[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const [r, c] = await Promise.all([api.get("/reminders"), api.get("/contacts")]);
      setReminders(r.data.reminders);
      setContacts(c.data.contacts);
      setError(null);
    } catch (err) {
      setError(apiError(err));
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => { load(); }, [load]);

  const toggle = async (r: Reminder) => {
    await api.patch(`/reminders/${r.id}/complete`, { completed: !r.completedAt });
    load();
  };
  const remove = async (r: Reminder) => {
    await api.delete(`/reminders/${r.id}`);
    load();
  };

  const now = Date.now();
  const open = reminders.filter((r) => !r.completedAt);
  const overdue = open.filter((r) => new Date(r.dueAt).getTime() < now);
  const upcoming = open.filter((r) => new Date(r.dueAt).getTime() >= now);
  const completed = reminders.filter((r) => r.completedAt);

  return (
    <div className="space-y-5 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Reminders</h1>
        <p className="text-sm text-ink-muted">Your follow-ups, overdue first.</p>
      </div>

      <QuickAdd contacts={contacts} onAdded={load} />

      {error && <div className="card text-danger">{error}</div>}
      {loading ? (
        <div className="text-ink-muted">Loading…</div>
      ) : (
        <div className="space-y-5">
          <Group title="Overdue" tone="danger" items={overdue} onToggle={toggle} onRemove={remove} empty="Nothing overdue 🎉" />
          <Group title="Upcoming" tone="blue" items={upcoming} onToggle={toggle} onRemove={remove} empty="No upcoming reminders." />
          {completed.length > 0 && (
            <Group title="Completed" tone="muted" items={completed} onToggle={toggle} onRemove={remove} empty="" />
          )}
        </div>
      )}
    </div>
  );
}

function QuickAdd({ contacts, onAdded }: { contacts: MiniContact[]; onAdded: () => void }) {
  const defaultDue = () => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    d.setHours(9, 0, 0, 0);
    return toLocalInput(d);
  };
  const [title, setTitle] = useState("");
  const [type, setType] = useState("task");
  const [dueAt, setDueAt] = useState(defaultDue);
  const [contactId, setContactId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setBusy(true);
    setError(null);
    try {
      await api.post("/reminders", {
        title: title.trim(),
        type,
        dueAt: new Date(dueAt).toISOString(),
        contactId: contactId || "",
      });
      setTitle("");
      setContactId("");
      onAdded();
    } catch (err) {
      setError(apiError(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="card space-y-3">
      {error && <div className="text-sm text-danger">{error}</div>}
      <div className="flex flex-col gap-3 sm:flex-row">
        <input className="input flex-1" placeholder="Add a follow-up…" value={title} onChange={(e) => setTitle(e.target.value)} required />
        <button className="btn-primary sm:w-32" disabled={busy}>{busy ? "Adding…" : "Add reminder"}</button>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <select className="input capitalize" value={type} onChange={(e) => setType(e.target.value)}>
          {REMINDER_TYPES.map((t) => <option key={t} value={t} className="capitalize">{t}</option>)}
        </select>
        <input type="datetime-local" className="input" value={dueAt} onChange={(e) => setDueAt(e.target.value)} required />
        <select className="input" value={contactId} onChange={(e) => setContactId(e.target.value)}>
          <option value="">No contact</option>
          {contacts.map((c) => <option key={c.id} value={c.id}>{fullName(c)}</option>)}
        </select>
      </div>
    </form>
  );
}

function Group({ title, tone, items, onToggle, onRemove, empty }: {
  title: string; tone: "danger" | "blue" | "muted"; items: Reminder[];
  onToggle: (r: Reminder) => void; onRemove: (r: Reminder) => void; empty: string;
}) {
  const toneColor = tone === "danger" ? "text-danger" : tone === "blue" ? "text-accent-blue" : "text-ink-muted";
  return (
    <div>
      <h2 className={`text-xs font-semibold uppercase tracking-wide ${toneColor}`}>
        {title} <span className="text-ink-muted">({items.length})</span>
      </h2>
      {items.length === 0 ? (
        empty && <p className="mt-2 text-sm text-ink-muted">{empty}</p>
      ) : (
        <ul className="mt-2 space-y-2">
          {items.map((r) => {
            const done = Boolean(r.completedAt);
            return (
              <li key={r.id} className="flex items-center gap-3 rounded-xl border border-line bg-bg-card px-4 py-3">
                <button
                  onClick={() => onToggle(r)}
                  className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-colors ${
                    done ? "border-success bg-success text-white" : "border-ink-muted hover:border-accent-blue"
                  }`}
                  aria-label={done ? "Reopen" : "Complete"}
                >
                  {done && "✓"}
                </button>
                <span className="text-base">{typeIcon[r.type]}</span>
                <div className="min-w-0 flex-1">
                  <p className={`truncate text-sm ${done ? "text-ink-muted line-through" : "font-medium"}`}>{r.title}</p>
                  <p className="text-xs text-ink-muted">
                    {formatDateTime(r.dueAt)}
                    {r.contact && <> · {fullName(r.contact)}</>}
                  </p>
                </div>
                {!done && (
                  <span className={`shrink-0 text-xs ${tone === "danger" ? "text-danger" : "text-ink-muted"}`}>
                    {relativeDay(r.dueAt)}
                  </span>
                )}
                <button onClick={() => onRemove(r)} className="shrink-0 text-ink-muted hover:text-danger" aria-label="Delete">✕</button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
