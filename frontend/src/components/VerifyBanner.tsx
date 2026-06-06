import { useState } from "react";
import { api, apiError } from "../lib/api";
import { useAuth } from "../store/auth";

// Nudges unverified users to confirm their email. In dev the API returns a
// devVerifyLink we surface directly (no real inbox needed).
export function VerifyBanner() {
  const { user } = useAuth();
  const [msg, setMsg] = useState<string | null>(null);
  const [link, setLink] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (!user || user.emailVerified) return null;

  const resend = async () => {
    setBusy(true);
    setMsg(null);
    try {
      const { data } = await api.post("/auth/resend-verification");
      setMsg(data.message ?? "Verification email sent.");
      if (data.devVerifyLink) setLink(data.devVerifyLink);
    } catch (err) {
      setMsg(apiError(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-warning/30 bg-warning/10 px-4 py-3 text-sm">
      <span className="text-warning">
        Please verify your email to secure your account.
      </span>
      <div className="flex items-center gap-3">
        {link && (
          <a href={link} className="font-medium text-accent-blue underline">
            Open dev verify link
          </a>
        )}
        {msg && !link && <span className="text-ink-muted">{msg}</span>}
        <button onClick={resend} disabled={busy} className="btn-secondary px-3 py-1.5 text-xs">
          {busy ? "Sending…" : "Resend"}
        </button>
      </div>
    </div>
  );
}
