/**
 * Small hand-authored line icons for homepage marketing sections. Kept as
 * inline SVG rather than adding an icon library dependency (CLAUDE.md §5 —
 * no new dependency when a few simple paths solve it). Purely decorative,
 * so every icon carries `aria-hidden`.
 */

type IconProps = { className?: string };

const base = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.75,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
};

export function PaletteIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M12 3a9 9 0 1 0 0 18c1.1 0 2-.9 2-2 0-.5-.2-1-.5-1.3-.3-.4-.5-.8-.5-1.3 0-1.1.9-2 2-2h2.3A4.2 4.2 0 0 0 21 12.2 9 9 0 0 0 12 3Z" />
      <circle cx="7.5" cy="11" r="1" fill="currentColor" stroke="none" />
      <circle cx="10.5" cy="7.5" r="1" fill="currentColor" stroke="none" />
      <circle cx="15" cy="8" r="1" fill="currentColor" stroke="none" />
      <circle cx="16.5" cy="12" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function UsersIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M16 19v-1.5a3.5 3.5 0 0 0-3.5-3.5h-5A3.5 3.5 0 0 0 4 17.5V19" />
      <circle cx="9" cy="8" r="3" />
      <path d="M17 10.5a2.5 2.5 0 0 0 0-5" />
      <path d="M19.5 19v-1.2a3 3 0 0 0-2-2.8" />
    </svg>
  );
}

export function CheckCircleIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <circle cx="12" cy="12" r="9" />
      <path d="m8.5 12.5 2.3 2.3L15.5 9.5" />
    </svg>
  );
}

export function DashboardIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <rect x="3.5" y="3.5" width="7" height="7" rx="1.2" />
      <rect x="13.5" y="3.5" width="7" height="4.5" rx="1.2" />
      <rect x="13.5" y="10.5" width="7" height="10" rx="1.2" />
      <rect x="3.5" y="13" width="7" height="7.5" rx="1.2" />
    </svg>
  );
}

export function CalendarCheckIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <rect x="3.5" y="4.5" width="17" height="16" rx="2" />
      <path d="M3.5 9.5h17" />
      <path d="M8 3v3M16 3v3" />
      <path d="m8.5 14 2 2 4-4" />
    </svg>
  );
}

export function WalletIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <rect x="3" y="6" width="18" height="13" rx="2" />
      <path d="M3 10h18" />
      <circle cx="16.5" cy="14" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function ChartBarIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M4 20V10M10 20V4M16 20v-7M22 20H2" />
    </svg>
  );
}

export function QuoteIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className} fill="currentColor" stroke="none">
      <path d="M9.5 7C6.5 7 4 9.5 4 12.8c0 2.6 1.8 4.5 4.1 4.5.4 0 .7-.3.7-.7 0-.3-.2-.6-.5-.7-1.2-.4-2-1.5-2-2.8 0-.2 0-.3.1-.5.3.1.6.2 1 .2 1.5 0 2.6-1.2 2.6-2.6S11 7 9.5 7Zm9 0c-3 0-5.5 2.5-5.5 5.8 0 2.6 1.8 4.5 4.1 4.5.4 0 .7-.3.7-.7 0-.3-.2-.6-.5-.7-1.2-.4-2-1.5-2-2.8 0-.2 0-.3.1-.5.3.1.6.2 1 .2 1.5 0 2.6-1.2 2.6-2.6S20 7 18.5 7Z" />
    </svg>
  );
}

export function SendIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M21 3 10 14" />
      <path d="m21 3-6.5 18-4-8-8-4L21 3Z" />
    </svg>
  );
}

export function QrCodeIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <rect x="3.5" y="3.5" width="6" height="6" rx="1" />
      <rect x="14.5" y="3.5" width="6" height="6" rx="1" />
      <rect x="3.5" y="14.5" width="6" height="6" rx="1" />
      <path d="M14.5 14.5h2v2h-2zM18.5 14.5h2M14.5 18.5v2M18.5 18.5h2v2" />
    </svg>
  );
}

export function ShieldIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M12 3 4.5 6v5.5c0 4.6 3.2 8.4 7.5 9.5 4.3-1.1 7.5-4.9 7.5-9.5V6L12 3Z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}

export function SparklesIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M12 3.5 13.8 9l5.7 1.8-5.7 1.8L12 18.2l-1.8-5.6-5.7-1.8L10.2 9 12 3.5Z" />
      <path d="M19 3v3M17.5 4.5h3M5 17v3M3.5 18.5h3" />
    </svg>
  );
}

export function PencilIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M4 20h4L19 9a2.8 2.8 0 0 0-4-4L4 16v4Z" />
      <path d="m13.5 6.5 4 4" />
    </svg>
  );
}

export function UserPlusIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <circle cx="9" cy="8" r="3.5" />
      <path d="M3 20v-1a5 5 0 0 1 5-5h2a5 5 0 0 1 5 5v1" />
      <path d="M19 8v6M16 11h6" />
    </svg>
  );
}

export function ArrowRightIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className} strokeWidth={2}>
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}

export function ArrowUpRightIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className} strokeWidth={2}>
      <path d="M7 17 17 7M8 7h9v9" />
    </svg>
  );
}

export function ChevronLeftIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className} strokeWidth={2}>
      <path d="m15 6-6 6 6 6" />
    </svg>
  );
}

export function ChevronRightIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className} strokeWidth={2}>
      <path d="m9 6 6 6-6 6" />
    </svg>
  );
}

export function CheckIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className} strokeWidth={2.5}>
      <path d="m5 12.5 4.5 4.5L19 7.5" />
    </svg>
  );
}

export function MenuIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className} strokeWidth={2}>
      <path d="M4 7h16M4 12h16M4 17h16" />
    </svg>
  );
}

export function CloseIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className} strokeWidth={2}>
      <path d="M6 6l12 12M18 6 6 18" />
    </svg>
  );
}

export function LogoMark({ className }: IconProps) {
  return (
    <svg {...base} className={className} strokeWidth={2}>
      <path d="M12 2L9 9l-7 3 7 3 3 7 3-7 7-3-7-3-3-7z" />
    </svg>
  );
}
