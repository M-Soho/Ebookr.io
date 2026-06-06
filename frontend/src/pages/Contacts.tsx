import { useEffect, useState, useCallback } from "react";
import { api, apiError } from "../lib/api";
import {
  CONTACT_STATUSES,
  fullName,
  initials,
  statusBadge,
  formatDateTime,
  typeIcon,
} from "../lib/format";

interface Contact {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  status: string;
  tags: string[];
  notes: string | null;
  updatedAt: string;
}
interface Interaction { id: string; type: string; summary: string; occurredAt: string }
interface Reminder { id: string; title: string; type: string; dueAt: string; completedAt: string | null }
type ContactDetail = Contact & { interactions: Interaction[]; reminders: Reminder[] };

const empty = {
  firstName: "", lastName: "", email: "", phone: "", company: "",
  status: "lead", tags: "", notes: "",
};

export default function Contacts() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<Contact | null | "new">(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (q.trim()) params.q = q.trim();
      if (status) params.status = status;
      const { data } = await api.get("/contacts", { params });
      setContacts(data.contacts);
      setError(null);
    } catch (err) {
      setError(apiError(err));
    } finally {
      setLoading(false);
    }
  }, [q, status]);

  useEffect(() => {
    const t = setTimeout(load, 200); // debounce search
    return () => clearTimeout(t);
  }, [load]);

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Contacts</h1>
          <p className="text-sm text-ink-muted">{contacts.length} shown</p>
        </div>
        <button className="btn-primary" onClick={() => setEditing("new")}>+ Add contact</button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <input
          className="input max-w-xs"
          placeholder="Search name, email, company…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <div className="flex flex-wrap gap-1.5">
          <FilterChip active={status === ""} onClick={() => setStatus("")}>All</FilterChip>
          {CONTACT_STATUSES.map((s) => (
            <FilterChip key={s} active={status === s} onClick={() => setStatus(s)}>
              <span className="capitalize">{s}</span>
            </FilterChip>
          ))}
        </div>
      </div>

      {error && <div className="card text-danger">{error}</div>}

      {/* List */}
      {loading ? (
        <div className="text-ink-muted">Loading…</div>
      ) : contacts.length === 0 ? (
        <div className="card text-center text-ink-muted">
          No contacts found. <button className="text-accent-blue hover:underline" onClick={() => setEditing("new")}>Add your first one →</button>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-line">
          <table className="w-full text-sm">
            <thead className="bg-bg-card text-left text-xs uppercase tracking-wide text-ink-muted">
              <tr>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="hidden px-4 py-3 font-medium sm:table-cell">Company</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="hidden px-4 py-3 font-medium md:table-cell">Tags</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {contacts.map((c) => (
                <tr
                  key={c.id}
                  onClick={() => setSelectedId(c.id)}
                  className="cursor-pointer bg-bg-card/40 transition-colors hover:bg-bg-elevated"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent-blueSoft text-xs font-semibold text-accent-blue">
                        {initials(fullName(c))}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate font-medium">{fullName(c)}</p>
                        {c.email && <p className="truncate text-xs text-ink-muted">{c.email}</p>}
                      </div>
                    </div>
                  </td>
                  <td className="hidden px-4 py-3 text-ink-secondary sm:table-cell">{c.company ?? "—"}</td>
                  <td className="px-4 py-3">
                    <span className={`badge capitalize ${statusBadge[c.status]}`}>{c.status}</span>
                  </td>
                  <td className="hidden px-4 py-3 md:table-cell">
                    <div className="flex flex-wrap gap-1">
                      {c.tags.slice(0, 3).map((t) => (
                        <span key={t} className="badge bg-bg-elevated text-ink-muted">{t}</span>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {editing && (
        <ContactModal
          contact={editing === "new" ? null : editing}
          onClose={() => setEditing(null)}
          onSaved={() => { setEditing(null); load(); }}
        />
      )}

      {selectedId && (
        <ContactDrawer
          id={selectedId}
          onClose={() => setSelectedId(null)}
          onEdit={(c) => { setSelectedId(null); setEditing(c); }}
          onChanged={load}
        />
      )}
    </div>
  );
}

function FilterChip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
        active ? "bg-accent-blue text-white" : "bg-bg-card text-ink-muted hover:text-ink-primary"
      }`}
    >
      {children}
    </button>
  );
}

/* --------------------------- Create / edit modal --------------------------- */
function ContactModal({ contact, onClose, onSaved }: {
  contact: Contact | null; onClose: () => void; onSaved: () => void;
}) {
  const [form, setForm] = useState(
    contact
      ? {
          firstName: contact.firstName, lastName: contact.lastName,
          email: contact.email ?? "", phone: contact.phone ?? "",
          company: contact.company ?? "", status: contact.status,
          tags: contact.tags.join(", "), notes: contact.notes ?? "",
        }
      : empty
  );
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const set = (k: keyof typeof empty, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const payload = {
      ...form,
      tags: form.tags.split(",").map((t) => t.trim()).filter(Boolean),
    };
    try {
      if (contact) await api.put(`/contacts/${contact.id}`, payload);
      else await api.post("/contacts", payload);
      onSaved();
    } catch (err) {
      setError(apiError(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Overlay onClose={onClose}>
      <div className="w-full max-w-lg rounded-2xl border border-line bg-bg-card p-6 shadow-lift" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-lg font-semibold">{contact ? "Edit contact" : "New contact"}</h2>
        <form onSubmit={submit} className="mt-4 space-y-3">
          {error && <div className="rounded-lg border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">{error}</div>}
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">First name</label><input className="input" value={form.firstName} onChange={(e) => set("firstName", e.target.value)} required /></div>
            <div><label className="label">Last name</label><input className="input" value={form.lastName} onChange={(e) => set("lastName", e.target.value)} /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">Email</label><input type="email" className="input" value={form.email} onChange={(e) => set("email", e.target.value)} /></div>
            <div><label className="label">Phone</label><input className="input" value={form.phone} onChange={(e) => set("phone", e.target.value)} /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">Company</label><input className="input" value={form.company} onChange={(e) => set("company", e.target.value)} /></div>
            <div>
              <label className="label">Status</label>
              <select className="input capitalize" value={form.status} onChange={(e) => set("status", e.target.value)}>
                {CONTACT_STATUSES.map((s) => <option key={s} value={s} className="capitalize">{s}</option>)}
              </select>
            </div>
          </div>
          <div><label className="label">Tags <span className="text-ink-muted">(comma-separated)</span></label><input className="input" value={form.tags} onChange={(e) => set("tags", e.target.value)} placeholder="design, retainer" /></div>
          <div><label className="label">Notes</label><textarea className="input min-h-[80px]" value={form.notes} onChange={(e) => set("notes", e.target.value)} /></div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" className="btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={busy}>{busy ? "Saving…" : "Save contact"}</button>
          </div>
        </form>
      </div>
    </Overlay>
  );
}

/* ------------------------------ Detail drawer ------------------------------ */
function ContactDrawer({ id, onClose, onEdit, onChanged }: {
  id: string; onClose: () => void; onEdit: (c: Contact) => void; onChanged: () => void;
}) {
  const [c, setC] = useState<ContactDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [logType, setLogType] = useState("note");
  const [logSummary, setLogSummary] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    api.get(`/contacts/${id}`).then((res) => setC(res.data.contact)).catch((e) => setError(apiError(e)));
  }, [id]);
  useEffect(load, [load]);

  const logInteraction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!logSummary.trim()) return;
    setBusy(true);
    try {
      await api.post(`/contacts/${id}/interactions`, { type: logType, summary: logSummary.trim() });
      setLogSummary("");
      load();
      onChanged();
    } catch (err) {
      setError(apiError(err));
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    if (!confirm("Delete this contact? This also removes its interactions.")) return;
    await api.delete(`/contacts/${id}`);
    onChanged();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60" />
      <aside className="relative h-full w-full max-w-md overflow-y-auto border-l border-line bg-bg-primary p-6 shadow-lift animate-fade-in" onClick={(e) => e.stopPropagation()}>
        {error && <div className="mb-3 text-sm text-danger">{error}</div>}
        {!c ? (
          <p className="text-ink-muted">Loading…</p>
        ) : (
          <>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-accent-blueSoft text-base font-semibold text-accent-blue">
                  {initials(fullName(c))}
                </span>
                <div>
                  <h2 className="text-lg font-bold">{fullName(c)}</h2>
                  <span className={`badge capitalize ${statusBadge[c.status]}`}>{c.status}</span>
                </div>
              </div>
              <button onClick={onClose} className="text-ink-muted hover:text-ink-primary" aria-label="Close">✕</button>
            </div>

            <dl className="mt-5 space-y-2 text-sm">
              {c.company && <Row label="Company" value={c.company} />}
              {c.email && <Row label="Email" value={c.email} />}
              {c.phone && <Row label="Phone" value={c.phone} />}
              {c.tags.length > 0 && (
                <div className="flex gap-2">
                  <dt className="w-20 shrink-0 text-ink-muted">Tags</dt>
                  <dd className="flex flex-wrap gap-1">
                    {c.tags.map((t) => <span key={t} className="badge bg-bg-elevated text-ink-muted">{t}</span>)}
                  </dd>
                </div>
              )}
            </dl>

            {c.notes && (
              <div className="mt-4 rounded-lg bg-bg-card p-3 text-sm text-ink-secondary">{c.notes}</div>
            )}

            <div className="mt-4 flex gap-2">
              <button className="btn-secondary flex-1" onClick={() => onEdit(c)}>Edit</button>
              <button className="btn-danger" onClick={remove}>Delete</button>
            </div>

            {/* Open reminders */}
            {c.reminders.filter((r) => !r.completedAt).length > 0 && (
              <div className="mt-6">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-ink-muted">Open reminders</h3>
                <ul className="mt-2 space-y-1.5">
                  {c.reminders.filter((r) => !r.completedAt).map((r) => (
                    <li key={r.id} className="flex items-center gap-2 rounded-lg bg-bg-card px-3 py-2 text-sm">
                      <span>{typeIcon[r.type]}</span>
                      <span className="flex-1 truncate">{r.title}</span>
                      <span className="text-xs text-ink-muted">{new Date(r.dueAt).toLocaleDateString()}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Interaction timeline + quick log */}
            <div className="mt-6">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-ink-muted">Activity</h3>
              <form onSubmit={logInteraction} className="mt-2 flex gap-2">
                <select className="input w-28 capitalize" value={logType} onChange={(e) => setLogType(e.target.value)}>
                  {["note", "call", "email", "meeting"].map((t) => <option key={t} value={t} className="capitalize">{t}</option>)}
                </select>
                <input className="input flex-1" placeholder="Log an interaction…" value={logSummary} onChange={(e) => setLogSummary(e.target.value)} />
                <button className="btn-primary px-3" disabled={busy}>Add</button>
              </form>

              {c.interactions.length === 0 ? (
                <p className="mt-3 text-sm text-ink-muted">No activity yet.</p>
              ) : (
                <ul className="mt-3 space-y-3">
                  {c.interactions.map((i) => (
                    <li key={i.id} className="flex gap-3">
                      <span className="mt-0.5 text-base leading-none">{typeIcon[i.type]}</span>
                      <div className="min-w-0">
                        <p className="text-sm text-ink-secondary">{i.summary}</p>
                        <p className="text-xs text-ink-muted">{formatDateTime(i.occurredAt)}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </>
        )}
      </aside>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-2">
      <dt className="w-20 shrink-0 text-ink-muted">{label}</dt>
      <dd className="min-w-0 break-words text-ink-secondary">{value}</dd>
    </div>
  );
}

function Overlay({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60" />
      <div className="relative">{children}</div>
    </div>
  );
}
