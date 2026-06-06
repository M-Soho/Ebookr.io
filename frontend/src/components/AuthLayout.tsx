import { Link } from "react-router-dom";
import { Wordmark } from "./ui/Logo";

// Split-screen auth shell: form on the left, product pitch on the right.
export function AuthLayout({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      {/* Form panel */}
      <div className="flex w-full flex-col px-6 py-8 sm:px-12 lg:w-1/2">
        <Link to="/" className="inline-flex">
          <Wordmark />
        </Link>
        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-sm animate-fade-in">
            <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
            {subtitle && <p className="mt-1.5 text-sm text-ink-muted">{subtitle}</p>}
            <div className="mt-6">{children}</div>
            {footer && <div className="mt-6 text-center text-sm text-ink-muted">{footer}</div>}
          </div>
        </div>
      </div>

      {/* Pitch panel */}
      <div className="relative hidden w-1/2 overflow-hidden border-l border-line bg-bg-card lg:block">
        <div className="absolute inset-0 bg-grid-fade" />
        <div className="relative flex h-full flex-col justify-center px-12">
          <blockquote className="max-w-md">
            <p className="text-2xl font-semibold leading-snug text-ink-primary">
              Never drop a lead again.
            </p>
            <p className="mt-4 text-ink-secondary">
              Ebookr keeps every contact, follow-up, and conversation in one place —
              built for freelancers and small teams who live by the next touchpoint.
            </p>
            <ul className="mt-8 space-y-3 text-sm text-ink-secondary">
              {[
                "Contact pipeline: lead → prospect → client",
                "Reminders with overdue & upcoming views",
                "A full interaction timeline per contact",
              ].map((f) => (
                <li key={f} className="flex items-center gap-3">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-accent-blueSoft text-accent-blue">
                    ✓
                  </span>
                  {f}
                </li>
              ))}
            </ul>
          </blockquote>
        </div>
      </div>
    </div>
  );
}
