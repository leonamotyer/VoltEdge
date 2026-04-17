/** Compact inline icons for primary nav (recognition over recall — Nielsen #6). */

export function NavIconCurtailment({ className }: { className?: string }) {
  return (
    <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden focusable="false">
      <path
        d="M4 18V6M8 18v-5M12 18V9M16 18v-3M20 18v-7"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function NavIconStorage({ className }: { className?: string }) {
  return (
    <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden focusable="false">
      <rect x="6" y="7" width="12" height="11" rx="2" stroke="currentColor" strokeWidth="2" />
      <path d="M9 11h6M9 14h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M10 7V5a2 2 0 012-2h0a2 2 0 012 2v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function NavIconNetwork({ className }: { className?: string }) {
  return (
    <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden focusable="false">
      <circle cx="6" cy="8" r="2.5" stroke="currentColor" strokeWidth="2" />
      <circle cx="18" cy="6" r="2.5" stroke="currentColor" strokeWidth="2" />
      <circle cx="15" cy="17" r="2.5" stroke="currentColor" strokeWidth="2" />
      <path d="M8 9.5l6-2M16.5 8l-2.5 7M12.5 17l-5-5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
    </svg>
  );
}
