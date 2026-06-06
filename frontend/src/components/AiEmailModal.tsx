import { useState } from "react";
import { api, apiError } from "../lib/api";

interface Draft {
  subject: string;
  body: string;
  fallback: boolean;
}

const TONES = ["friendly", "professional", "direct", "warm"] as const;

export function AiEmailModal({
  contactId,
  contactName,
  onClose,
}: {
  contactId: string;
  contactName: string;
  onClose: () => void;
}) {
  const [intent, setIntent] = useState("");
  const [tone, setTone] = useState<(typeof TONES)[number]>("friendly");
  const [draft, setDraft] = useState<Draft | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [upgrade, setUpgrade] = useState(false);
  const [copied, setCopied] = useState<"subject" | "body" | "all" | null>(null);

  const generate = async () => {
    if (!intent.trim()) return;
    setBusy(true);
    setError(null);
    setUpgrade(false);
    try {
      const { data } = await api.post("/ai/email", { contactId, intent: intent.trim(), tone });
      setDraft(data.draft);
    } catch (err: unknown) {
      const anyErr = err as { response?: { status?: number; data?: { code?: string } } };
      if (anyErr.response?.status === 402 || anyErr.response?.data?.code === "plan_limit") {
        setUpgrade(true);
      } else {
        setError(apiError(err));
      }
    } finally {
      setBusy(false);
    }
  };

  const copy = async (what: "subject" | "body" | "all") => {
    if (!draft) return;
    const text =
      what === "subject" ? draft.subject : what === "body" ? draft.body : `Subject: ${draft.subject}\n\n${draft.body}`;
    await navigator.clipboard.writeText(text);
    setCopied(what);
    setTimeout(() => setCopied(null), 1500);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60" />
      <div
        className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-line bg-bg-card p-6 shadow-lift"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between">
          <div>
            <h2 className="flex items-center gap-2 text-lg font-semibold">
              <span>✨</span> Draft a follow-up
            </h2>
            <p className="text-sm text-ink-muted">To {contactName}</p>
          </div>
          <button onClick={onClose} className="text-ink-muted hover:text-ink-primary" aria-label="Close">✕</button>
        </div>

        {upgrade ? (
          <div className="mt-5 rounded-xl border border-accent-blue/30 bg-accent-blueSoft p-4 text-sm">
            <p className="font-medium text-accent-blue">AI email drafting is a Pro feature.</p>
            <p className="mt-1 text-ink-secondary">
              Upgrade to Pro or Team to generate personalized follow-ups with AI.
            </p>
            <a href="/settings" className="btn-primary mt-3 inline-flex">See plans</a>
          </div>
        ) : (
          <>
            <div className="mt-5 space-y-3">
              <div>
                <label className="label">What should this email accomplish?</label>
                <textarea
                  className="input min-h-[80px]"
                  placeholder="e.g. Check in after last week's call and ask if they're ready to move forward on the proposal."
                  value={intent}
                  onChange={(e) => setIntent(e.target.value)}
                />
              </div>
              <div>
                <label className="label">Tone</label>
                <select
                  className="input capitalize"
                  value={tone}
                  onChange={(e) => setTone(e.target.value as (typeof TONES)[number])}
                >
                  {TONES.map((t) => (
                    <option key={t} value={t} className="capitalize">{t}</option>
                  ))}
                </select>
              </div>
              {error && (
                <div className="rounded-lg border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">{error}</div>
              )}
              <button onClick={generate} disabled={busy || !intent.trim()} className="btn-primary w-full">
                {busy ? "Generating…" : draft ? "Regenerate" : "Generate draft"}
              </button>
            </div>

            {draft && (
              <div className="mt-5 space-y-3 border-t border-line pt-5">
                {draft.fallback && (
                  <div className="rounded-lg border border-warning/30 bg-warning/10 px-3 py-2 text-xs text-warning">
                    Demo draft (template). Set <code>ANTHROPIC_API_KEY</code> on the server to generate with Claude.
                  </div>
                )}
                <div>
                  <div className="mb-1 flex items-center justify-between">
                    <label className="label mb-0">Subject</label>
                    <button onClick={() => copy("subject")} className="text-xs text-accent-blue hover:underline">
                      {copied === "subject" ? "Copied!" : "Copy"}
                    </button>
                  </div>
                  <input
                    className="input"
                    value={draft.subject}
                    onChange={(e) => setDraft({ ...draft, subject: e.target.value })}
                  />
                </div>
                <div>
                  <div className="mb-1 flex items-center justify-between">
                    <label className="label mb-0">Body</label>
                    <button onClick={() => copy("body")} className="text-xs text-accent-blue hover:underline">
                      {copied === "body" ? "Copied!" : "Copy"}
                    </button>
                  </div>
                  <textarea
                    className="input min-h-[180px]"
                    value={draft.body}
                    onChange={(e) => setDraft({ ...draft, body: e.target.value })}
                  />
                </div>
                <button onClick={() => copy("all")} className="btn-secondary w-full">
                  {copied === "all" ? "Copied to clipboard!" : "Copy subject + body"}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
