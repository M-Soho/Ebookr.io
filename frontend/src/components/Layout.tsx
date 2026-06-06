import { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../store/auth";
import { Logo, Wordmark } from "./ui/Logo";
import { VerifyBanner } from "./VerifyBanner";
import { initials } from "../lib/format";

const NAV = [
  { to: "/dashboard", label: "Dashboard", icon: IconGrid },
  { to: "/contacts", label: "Contacts", icon: IconUsers },
  { to: "/reminders", label: "Reminders", icon: IconBell },
  { to: "/settings", label: "Settings", icon: IconGear },
];

export function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const navLinks = (
    <nav className="flex flex-col gap-1">
      {NAV.map(({ to, label, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          onClick={() => setOpen(false)}
          className={({ isActive }) =>
            `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
              isActive
                ? "bg-accent-blueSoft text-accent-blue"
                : "text-ink-muted hover:bg-white/5 hover:text-ink-primary"
            }`
          }
        >
          <Icon />
          {label}
        </NavLink>
      ))}
    </nav>
  );

  const userInitials = initials(user?.name);

  return (
    <div className="flex min-h-screen">
      {/* Desktop sidebar */}
      <aside className="hidden w-64 shrink-0 flex-col border-r border-line bg-bg-card p-4 lg:flex">
        <div className="px-2 py-3">
          <Wordmark size={26} />
        </div>
        <div className="mt-4 flex-1">{navLinks}</div>
        <UserCard initials={userInitials} name={user?.name} email={user?.email} plan={user?.plan} onLogout={handleLogout} />
      </aside>

      {/* Mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={() => setOpen(false)} />
          <aside className="absolute left-0 top-0 flex h-full w-64 flex-col border-r border-line bg-bg-card p-4">
            <div className="px-2 py-3">
              <Wordmark size={26} />
            </div>
            <div className="mt-4 flex-1">{navLinks}</div>
            <UserCard initials={userInitials} name={user?.name} email={user?.email} plan={user?.plan} onLogout={handleLogout} />
          </aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Mobile top bar */}
        <header className="flex items-center justify-between border-b border-line bg-bg-card px-4 py-3 lg:hidden">
          <button onClick={() => setOpen(true)} className="text-ink-primary" aria-label="Open menu">
            <IconMenu />
          </button>
          <Logo size={24} />
          <div className="h-8 w-8 rounded-full bg-accent-blueSoft text-center text-sm font-semibold leading-8 text-accent-blue">
            {userInitials}
          </div>
        </header>

        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
          <VerifyBanner />
          <Outlet />
        </main>
      </div>
    </div>
  );
}

function UserCard({
  initials: ini,
  name,
  email,
  plan,
  onLogout,
}: {
  initials: string;
  name?: string;
  email?: string;
  plan?: string;
  onLogout: () => void;
}) {
  return (
    <div className="mt-4 border-t border-line pt-4">
      <div className="flex items-center gap-3 px-2">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent-blueSoft text-sm font-semibold text-accent-blue">
          {ini}
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">{name}</p>
          <p className="truncate text-xs text-ink-muted">{email}</p>
        </div>
      </div>
      {plan && (
        <div className="mt-2 px-2">
          <span className="badge bg-accent-blueSoft capitalize text-accent-blue">{plan} plan</span>
        </div>
      )}
      <button onClick={onLogout} className="btn-ghost mt-3 w-full justify-start gap-3 text-sm">
        <IconLogout />
        Log out
      </button>
    </div>
  );
}

/* --- icons --- */
function base(props: { children: React.ReactNode }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      {props.children}
    </svg>
  );
}
function IconGrid() { return base({ children: <><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></> }); }
function IconUsers() { return base({ children: <><circle cx="9" cy="8" r="3.2" /><path d="M3.5 20a5.5 5.5 0 0 1 11 0" /><path d="M16 5.2a3 3 0 0 1 0 5.6" /><path d="M20.5 20a5 5 0 0 0-3.5-4.8" /></> }); }
function IconBell() { return base({ children: <><path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.7 21a2 2 0 0 1-3.4 0" /></> }); }
function IconGear() { return base({ children: <><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-2.7.7 1.6 1.6 0 0 0-1.6 1.3H12a2 2 0 0 1-4 0v-.1a1.6 1.6 0 0 0-1-1.5 1.6 1.6 0 0 0-1.8.3l-.1.1A2 2 0 1 1 2.3 18l.1-.1a1.6 1.6 0 0 0 .3-1.8 1.6 1.6 0 0 0-1.5-1H1a2 2 0 0 1 0-4h.1a1.6 1.6 0 0 0 1.5-1 1.6 1.6 0 0 0-.3-1.8l-.1-.1A2 2 0 1 1 5 2.3l.1.1a1.6 1.6 0 0 0 1.8.3H7a1.6 1.6 0 0 0 1-1.5V1a2 2 0 0 1 4 0v.1a1.6 1.6 0 0 0 1 1.5 1.6 1.6 0 0 0 1.8-.3l.1-.1A2 2 0 1 1 21.7 5l-.1.1a1.6 1.6 0 0 0-.3 1.8V7a1.6 1.6 0 0 0 1.5 1H23a2 2 0 0 1 0 4h-.1a1.6 1.6 0 0 0-1.5 1Z" /></> }); }
function IconLogout() { return base({ children: <><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><path d="m16 17 5-5-5-5" /><path d="M21 12H9" /></> }); }
function IconMenu() { return base({ children: <><line x1="4" y1="6" x2="20" y2="6" /><line x1="4" y1="12" x2="20" y2="12" /><line x1="4" y1="18" x2="20" y2="18" /></> }); }
