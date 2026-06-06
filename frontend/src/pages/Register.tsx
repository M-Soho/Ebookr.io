import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthLayout } from "../components/AuthLayout";
import { api, apiError } from "../lib/api";
import { useAuth } from "../store/auth";

function strength(pw: string): { score: number; label: string } {
  let s = 0;
  if (pw.length >= 8) s++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) s++;
  if (/\d/.test(pw)) s++;
  if (/[^A-Za-z0-9]/.test(pw)) s++;
  return { score: s, label: ["Too short", "Weak", "Fair", "Good", "Strong"][s] };
}

export default function Register() {
  const navigate = useNavigate();
  const setSession = useAuth((s) => s.setSession);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const pw = strength(password);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const { data } = await api.post("/auth/register", { name, email, password });
      setSession(data.token, data.user);
      navigate("/dashboard");
    } catch (err) {
      setError(apiError(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthLayout
      title="Create your account"
      subtitle="Start managing contacts and follow-ups in minutes."
      footer={
        <>
          Already have an account?{" "}
          <Link to="/login" className="font-medium text-accent-blue hover:underline">
            Sign in
          </Link>
        </>
      }
    >
      <form onSubmit={submit} className="space-y-4">
        {error && (
          <div className="rounded-lg border border-danger/30 bg-danger/10 px-3.5 py-2.5 text-sm text-danger">
            {error}
          </div>
        )}
        <div>
          <label className="label" htmlFor="name">Full name</label>
          <input id="name" className="input" value={name} onChange={(e) => setName(e.target.value)}
            required placeholder="Jane Doe" />
        </div>
        <div>
          <label className="label" htmlFor="email">Email</label>
          <input id="email" type="email" autoComplete="email" className="input" value={email}
            onChange={(e) => setEmail(e.target.value)} required placeholder="you@example.com" />
        </div>
        <div>
          <label className="label" htmlFor="password">Password</label>
          <div className="relative">
            <input id="password" type={show ? "text" : "password"} autoComplete="new-password"
              className="input pr-16" value={password} onChange={(e) => setPassword(e.target.value)}
              required minLength={8} placeholder="At least 8 characters" />
            <button type="button" onClick={() => setShow((s) => !s)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-ink-muted hover:text-ink-primary">
              {show ? "Hide" : "Show"}
            </button>
          </div>
          {password && (
            <div className="mt-2 flex items-center gap-2">
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-bg-elevated">
                <div
                  className={`h-full transition-all ${
                    pw.score <= 1 ? "bg-danger" : pw.score <= 2 ? "bg-warning" : pw.score === 3 ? "bg-accent-blue" : "bg-success"
                  }`}
                  style={{ width: `${(pw.score / 4) * 100}%` }}
                />
              </div>
              <span className="text-xs text-ink-muted">{pw.label}</span>
            </div>
          )}
        </div>
        <button type="submit" disabled={busy} className="btn-primary w-full">
          {busy ? "Creating account…" : "Create account"}
        </button>
      </form>
    </AuthLayout>
  );
}
