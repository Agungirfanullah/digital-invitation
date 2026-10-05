"use client";

import type { InvitationSectionKey } from "@/lib/event-types/sections";
import type { PublicInvitation } from "@/lib/invitations/types";

type IconProps = { className?: string };
const iconBase = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.75,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
};

function CalendarIcon({ className }: IconProps) {
  return (
    <svg {...iconBase} className={className}>
      <rect x="3.5" y="4.5" width="17" height="16" rx="2" />
      <path d="M3.5 9.5h17M8 3v3M16 3v3" />
    </svg>
  );
}
function HeartIcon({ className }: IconProps) {
  return (
    <svg {...iconBase} className={className}>
      <path d="M12 20s-7-4.4-9.5-9A5 5 0 0 1 12 6a5 5 0 0 1 9.5 5c-2.5 4.6-9.5 9-9.5 9Z" />
    </svg>
  );
}
function ImageIcon({ className }: IconProps) {
  return (
    <svg {...iconBase} className={className}>
      <rect x="3.5" y="4.5" width="17" height="15" rx="2" />
      <circle cx="9" cy="10" r="1.5" fill="currentColor" stroke="none" />
      <path d="m5 17 5-5 4 4 2.5-2.5L20.5 17" />
    </svg>
  );
}
function GiftIcon({ className }: IconProps) {
  return (
    <svg {...iconBase} className={className}>
      <rect x="3.5" y="9" width="17" height="11" rx="1.5" />
      <path d="M3.5 13h17M12 9v11" />
      <path d="M12 9C9.5 9 8 7.5 8 6a2 2 0 0 1 4 0 2 2 0 0 1 4 0c0 1.5-1.5 3-4 3Z" />
    </svg>
  );
}
function ChatIcon({ className }: IconProps) {
  return (
    <svg {...iconBase} className={className}>
      <path d="M4 5h16v11H8l-4 4V5Z" />
    </svg>
  );
}
function CheckCircleIcon({ className }: IconProps) {
  return (
    <svg {...iconBase} className={className}>
      <circle cx="12" cy="12" r="9" />
      <path d="m8.5 12.5 2.3 2.3L15.5 9.5" />
    </svg>
  );
}

const NAV_ITEMS: {
  key: InvitationSectionKey;
  headingId: string;
  label: string;
  icon: (props: IconProps) => React.JSX.Element;
  /**
   * Mirrors the exact condition each section component itself uses to
   * decide whether to render at all (e.g. `GallerySection`/`GiftSection`/
   * `LoveStorySection` all return `null` when they have no real content —
   * CLAUDE.md §1.5/§9.1 "no placeholder content"). A nav button pointing
   * at a heading id that was never rendered just silently does nothing
   * when clicked, which is what this guards against — not demo-specific,
   * the exact same gap would show up on any real event where a section is
   * enabled but the owner hasn't added content yet.
   */
  hasContent: (invitation: PublicInvitation) => boolean;
}[] = [
  {
    key: "schedule",
    headingId: "schedule-heading",
    label: "Jadwal Acara",
    icon: CalendarIcon,
    hasContent: (invitation) => invitation.schedules.length > 0,
  },
  {
    key: "story",
    headingId: "love-story-heading",
    label: "Kisah Cinta",
    icon: HeartIcon,
    hasContent: (invitation) => (invitation.loveStory?.items.length ?? 0) > 0,
  },
  {
    key: "gallery",
    headingId: "gallery-heading",
    label: "Galeri",
    icon: ImageIcon,
    hasContent: (invitation) => invitation.galleries.some((gallery) => gallery.items.length > 0),
  },
  {
    key: "gift",
    headingId: "gift-heading",
    label: "Hadiah",
    icon: GiftIcon,
    hasContent: (invitation) => invitation.giftMethods.length > 0,
  },
  {
    key: "rsvp",
    headingId: "rsvp-heading",
    label: "RSVP",
    icon: CheckCircleIcon,
    // Always renders — same no-personal-link fallback state Wishes has.
    hasContent: () => true,
  },
  {
    key: "wishes",
    headingId: "wishes-heading",
    label: "Ucapan",
    icon: ChatIcon,
    hasContent: () => true,
  },
];

/**
 * A floating "jump to section" bar, fixed at the bottom of the viewport —
 * rendered once by `InvitationRenderer` (not per-template), so every
 * template gets it for free instead of six separate implementations.
 * Only shown for sections the event actually has enabled
 * (`invitation.sections`) AND that actually have content to scroll to
 * (`hasContent` above), in whatever order they're configured
 * (`invitation.sectionOrder`).
 */
export function FloatingSectionNav({ invitation }: { invitation: PublicInvitation }) {
  const items = invitation.sectionOrder
    .filter((key) => invitation.sections[key])
    .map((key) => NAV_ITEMS.find((item) => item.key === key))
    .filter(
      (item): item is (typeof NAV_ITEMS)[number] =>
        item !== undefined && item.hasContent(invitation),
    );

  if (items.length === 0) return null;

  function scrollToHeading(headingId: string) {
    document.getElementById(headingId)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <nav
      aria-label="Navigasi cepat undangan"
      className="fixed bottom-4 left-1/2 z-40 -translate-x-1/2"
    >
      <ul className="flex items-center gap-1 rounded-full border border-[color:var(--ii-secondary)] bg-[color:var(--ii-background)]/95 p-1.5 shadow-lg backdrop-blur">
        {items.map((item) => (
          <li key={item.key}>
            <button
              type="button"
              onClick={() => scrollToHeading(item.headingId)}
              aria-label={item.label}
              title={item.label}
              className="flex size-10 items-center justify-center rounded-full text-[color:var(--ii-primary)] transition-colors hover:bg-[color:var(--ii-secondary)]/60"
            >
              <item.icon className="size-5" />
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );
}
