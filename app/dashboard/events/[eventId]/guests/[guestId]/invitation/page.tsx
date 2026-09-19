import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { requireAppUser } from "@/lib/auth/session";
import { getGuestInvitationDetail } from "@/lib/guests/service";
import { buildGuestInvitationUrl } from "@/lib/guests/invitation-url";
import { EventNotFoundError, GuestNotFoundError } from "@/lib/guests/errors";
import { GUEST_CATEGORY_LABELS } from "@/lib/guests/labels";
import { getRsvpForGuest } from "@/lib/rsvp/service";
import { composeInvitationMessage } from "@/lib/invitation-delivery/message";
import { buildWhatsAppShareUrl } from "@/lib/invitation-delivery/whatsapp";
import { InvitationStatusBadge } from "@/components/guests/invitation-status-badge";
import { RsvpStatusBadge } from "@/components/rsvp/rsvp-status-badge";
import { CopyInviteLinkButton } from "@/components/guests/copy-invite-link-button";
import { RegenerateTokenButton } from "@/components/guests/regenerate-token-button";
import { MessagePreview } from "@/components/guests/message-preview";

export const metadata: Metadata = {
  title: "Undangan Tamu — Digital Invitation",
};

interface GuestInvitationPageProps {
  params: Promise<{ eventId: string; guestId: string }>;
}

export default async function GuestInvitationPage({ params }: GuestInvitationPageProps) {
  const { eventId, guestId } = await params;
  const user = await requireAppUser();

  let detail;
  try {
    detail = await getGuestInvitationDetail(eventId, user.id, guestId);
  } catch (error) {
    if (error instanceof EventNotFoundError || error instanceof GuestNotFoundError) notFound();
    throw error;
  }

  const rsvp = await getRsvpForGuest(eventId, user.id, guestId);

  const canEdit = detail.role === "OWNER" || detail.role === "EDITOR";
  const inviteLink =
    canEdit && detail.invitationToken
      ? buildGuestInvitationUrl(detail.event.slug, detail.invitationToken)
      : null;
  const message = inviteLink
    ? composeInvitationMessage({
        guestName: detail.guestName,
        eventTitle: detail.event.title,
        invitationUrl: inviteLink,
      })
    : null;
  const whatsappUrl =
    message && detail.phone ? buildWhatsAppShareUrl(detail.phone, message.text) : null;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <Link
          href={`/dashboard/events/${eventId}/guests`}
          className="text-muted-foreground text-sm underline underline-offset-4"
        >
          ← Kembali ke Tamu
        </Link>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">{detail.guestName}</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          {GUEST_CATEGORY_LABELS[detail.category]}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2 rounded-lg border p-4">
        <span className="text-muted-foreground text-xs">Status undangan:</span>
        <InvitationStatusBadge status={detail.invitationStatus} />
        <span className="text-muted-foreground ml-4 text-xs">Status RSVP:</span>
        <RsvpStatusBadge attendance={rsvp?.attendance ?? null} />
      </div>

      {rsvp && (
        <div className="rounded-lg border p-4 text-sm">
          <p className="font-medium">Jawaban RSVP</p>
          {rsvp.attendance === "ATTENDING" && (
            <p className="mt-1">{rsvp.attendeeCount} orang akan hadir.</p>
          )}
          {rsvp.message && <p className="mt-1 italic opacity-80">&ldquo;{rsvp.message}&rdquo;</p>}
        </div>
      )}

      <div className="space-y-3 rounded-lg border p-4">
        <p className="text-sm font-medium">Tautan Undangan Pribadi</p>
        {inviteLink ? (
          <>
            <p className="text-muted-foreground text-xs break-all">{inviteLink}</p>
            <div className="flex flex-wrap gap-2">
              <CopyInviteLinkButton link={inviteLink} />
              <RegenerateTokenButton eventId={eventId} guestId={guestId} />
            </div>
          </>
        ) : (
          <p className="text-muted-foreground text-xs">
            {detail.invitationTokenAvailable
              ? "Tautan pribadi tersedia untuk tamu ini. Hubungi editor atau pemilik acara untuk menyalin atau membagikannya."
              : "Tautan pribadi belum tersedia."}
          </p>
        )}
      </div>

      {message && <MessagePreview messageText={message.text} whatsappUrl={whatsappUrl} />}
    </div>
  );
}
