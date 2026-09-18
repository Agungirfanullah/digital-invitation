import { EVENT_TYPE_LABELS } from "@/lib/events/labels";
import { formatIndonesianDate } from "@/lib/invitations/format";
import type { PublicInvitation } from "@/lib/invitations/types";

function coupleOrTitleHeading(invitation: PublicInvitation): string {
  const profile = invitation.weddingProfile;
  if (profile?.groomNickname && profile?.brideNickname) {
    return `${profile.brideNickname} & ${profile.groomNickname}`;
  }
  if (profile?.groomFullName && profile?.brideFullName) {
    return `${profile.brideFullName} & ${profile.groomFullName}`;
  }
  return invitation.title;
}

export function HeroSection({ invitation }: { invitation: PublicInvitation }) {
  const earliestSchedule = invitation.schedules[0];

  return (
    <section
      aria-label="Sampul undangan"
      className="flex min-h-[80vh] flex-col items-center justify-center gap-4 px-6 py-16 text-center"
    >
      <p className="text-xs font-medium tracking-[0.3em] text-[color:var(--ii-accent)] uppercase">
        {EVENT_TYPE_LABELS[invitation.type]}
      </p>

      <h1
        className="text-4xl font-semibold text-balance text-[color:var(--ii-primary)] sm:text-5xl"
        style={{ fontFamily: "var(--ii-heading-font)" }}
      >
        {coupleOrTitleHeading(invitation)}
      </h1>

      {earliestSchedule && (
        <p className="text-sm text-[color:var(--ii-text)]">
          {formatIndonesianDate(earliestSchedule.date)}
        </p>
      )}

      <div className="mt-6 space-y-1">
        <p className="text-xs tracking-wide text-[color:var(--ii-text)] uppercase opacity-70">
          Kepada Yth.
        </p>
        <p className="text-lg font-medium text-[color:var(--ii-primary)]">
          {invitation.guest?.displayName ?? "Bapak/Ibu/Saudara/i Tamu Undangan"}
        </p>
      </div>
    </section>
  );
}
