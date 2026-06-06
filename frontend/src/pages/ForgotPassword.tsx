import { useState } from "react";
import { Link } from "react-router-dom";
import { AuthLayout } from "../components/AuthLayout";
import { api, apiError } from "../lib/api";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [link, setLink] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const { data } = await api.post("/auth/forgot-password", { email });
      setMsg(data.message);
      if (data.devResetLink) setLink(data.devResetLink);
    } catch (err) {
      setError(apiError(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthLayout
      title="Reset your password"
      subtitle="We'll email you a link to set a new one."
      footer={
        <Link to="/login" className="font-medium text-accent-blue hover:underline">
          Back to sign in
        </Link>
      }
    >
      {msg ? (
        <div className="space-y-3">
          <div className="rounded-lg border border-success/30 bg-success/10 px-3.5 py-2.5 text-sm text-success">
            {msg}
          </div>
          {link && (
            <a href={link} className="block text-sm font-medium text-accent-blue underline">
              Open dev reset link →
            </a>
          )}
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-4">
          {error && (
            <div className="rounded-lg border border-danger/30 bg-danger/10 px-3.5 py-2.5 text-sm text-danger">
              {error}
            </div>
          )}
          <div>
            <label className="label" htmlFor="email">Email</label>
            <input id="email" type="email" className="input" value={email}
              onChange={(e) => setEmail(e.target.value)} required placeholder="you@example.com" />
          </div>
          <button type="submit" disabled={busy} className="btn-primary w-full">
            {busy ? "Sending…" : "Send reset link"}
          </button>
        </form>
      )}
    </AuthLayout>
  );
}
