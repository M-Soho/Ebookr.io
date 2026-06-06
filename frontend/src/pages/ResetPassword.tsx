import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { AuthLayout } from "../components/AuthLayout";
import { api, apiError } from "../lib/api";

export default function ResetPassword() {
  const [params] = useSearchParams();
  const token = params.get("token") ?? "";
  const [password, setPassword] = useState("");
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await api.post("/auth/reset-password", { token, password });
      setDone(true);
    } catch (err) {
      setError(apiError(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthLayout title="Set a new password" subtitle="Choose a strong password you'll remember.">
      {!token ? (
        <div className="rounded-lg border border-danger/30 bg-danger/10 px-3.5 py-2.5 text-sm text-danger">
          Missing reset token. Request a new link from the{" "}
          <Link to="/forgot-password" className="underline">forgot password</Link> page.
        </div>
      ) : done ? (
        <div className="space-y-4">
          <div className="rounded-lg border border-success/30 bg-success/10 px-3.5 py-2.5 text-sm text-success">
            Password updated. You can now sign in.
          </div>
          <Link to="/login" className="btn-primary w-full">Go to sign in</Link>
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-4">
          {error && (
            <div className="rounded-lg border border-danger/30 bg-danger/10 px-3.5 py-2.5 text-sm text-danger">
              {error}
            </div>
          )}
          <div>
            <label className="label" htmlFor="password">New password</label>
            <input id="password" type="password" className="input" value={password}
              onChange={(e) => setPassword(e.target.value)} required minLength={8}
              placeholder="At least 8 characters" />
          </div>
          <button type="submit" disabled={busy} className="btn-primary w-full">
            {busy ? "Updating…" : "Update password"}
          </button>
        </form>
      )}
    </AuthLayout>
  );
}
