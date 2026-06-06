import { Link, Navigate } from "react-router-dom";
import { useAuth } from "../store/auth";
import { Wordmark } from "../components/ui/Logo";

export default function Home() {
  const { token, ready } = useAuth();
  if (ready && token) return <Navigate to="/dashboard" replace />;

  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="absolute inset-0 bg-grid-fade" />
      <header className="relative mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <Wordmark />
        <div className="flex items-center gap-3">
          <Link to="/login" className="btn-ghost">Sign in</Link>
          <Link to="/register" className="btn-primary">Get started</Link>
        </div>
      </header>

      <main className="relative mx-auto max-w-3xl px-6 pt-20 text-center">
        <span className="badge bg-accent-blueSoft text-accent-blue">CRM · Follow-up automation</span>
        <h1 className="mt-5 text-5xl font-extrabold tracking-tight">
          The follow-up CRM for <span className="text-accent-blue">freelancers</span>.
        </h1>
        <p className="mx-auto mt-5 max-w-xl text-lg text-ink-secondary">
          Track every contact, never miss a follow-up, and keep a full history of
          every conversation — without the bloat of a sales suite.
        </p>
        <div className="mt-8 flex items-center justify-center gap-3">
          <Link to="/register" className="btn-primary px-6 py-3 text-base">Start free</Link>
          <Link to="/login" className="btn-secondary px-6 py-3 text-base">Live demo</Link>
        </div>

        <div className="mx-auto mt-16 grid max-w-3xl gap-4 sm:grid-cols-3">
          {[
            { t: "Contacts", d: "A clean pipeline from lead to client." },
            { t: "Reminders", d: "Overdue and upcoming, always in view." },
            { t: "Timeline", d: "Every call, email, and note logged." },
          ].map((f) => (
            <div key={f.t} className="card text-left">
              <p className="font-semibold">{f.t}</p>
              <p className="mt-1 text-sm text-ink-muted">{f.d}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
