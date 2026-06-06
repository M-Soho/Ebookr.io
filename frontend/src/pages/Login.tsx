import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthLayout } from "../components/AuthLayout";
import { api, apiError } from "../lib/api";
import { useAuth } from "../store/auth";

export default function Login() {
  const navigate = useNavigate();
  const setSession = useAuth((s) => s.setSession);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const { data } = await api.post("/auth/login", { email, password });
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
      title="Welcome back"
      subtitle="Sign in to your Ebookr workspace."
      footer={
        <>
          New to Ebookr?{" "}
          <Link to="/register" className="font-medium text-accent-blue hover:underline">
            Create an account
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
          <label className="label" htmlFor="email">Email</label>
          <input id="email" type="email" autoComplete="email" className="input" value={email}
            onChange={(e) => setEmail(e.target.value)} required placeholder="you@example.com" />
        </div>
        <div>
          <div className="flex items-center justify-between">
            <label className="label" htmlFor="password">Password</label>
            <Link to="/forgot-password" className="text-xs text-accent-blue hover:underline">
              Forgot?
            </Link>
          </div>
          <div className="relative">
            <input id="password" type={show ? "text" : "password"} autoComplete="current-password"
              className="input pr-16" value={password} onChange={(e) => setPassword(e.target.value)}
              required placeholder="••••••••" />
            <button type="button" onClick={() => setShow((s) => !s)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-ink-muted hover:text-ink-primary">
              {show ? "Hide" : "Show"}
            </button>
          </div>
        </div>
        <button type="submit" disabled={busy} className="btn-primary w-full">
          {busy ? "Signing in…" : "Sign in"}
        </button>
      </form>
      <p className="mt-4 rounded-lg bg-bg-elevated px-3 py-2 text-center text-xs text-ink-muted">
        Demo: <span className="font-medium text-ink-secondary">demo@ebookr.io</span> /{" "}
        <span className="font-medium text-ink-secondary">demo1234</span>
      </p>
    </AuthLayout>
  );
}
