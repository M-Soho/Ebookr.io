export function Logo({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden>
      <rect width="32" height="32" rx="7" fill="#3b82f6" />
      <path
        d="M10 9h12M10 16h12M10 23h8"
        stroke="#fff"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function Wordmark({ size = 26 }: { size?: number }) {
  return (
    <div className="flex items-center gap-2.5">
      <Logo size={size} />
      <span className="text-lg font-extrabold tracking-tight text-ink-primary">
        Ebookr
      </span>
    </div>
  );
}
