import { cache } from "react";
import type { Metadata } from "next";
import { cookies, headers } from "next/headers";
import { notFound } from "next/navigation";

import { getPublicInvitationBySlug } from "@/lib/invitations/service";
import { InvitationNotFoundError } from "@/lib/invitations/errors";
import { getRsvpGuestView } from "@/lib/rsvp/service";
import { trackPublicInvitationView } from "@/lib/analytics/service";
import { ANALYTICS_SESSION_COOKIE_NAME } from "@/lib/analytics/session";
import { InvitationRenderer } from "@/components/invitation/invitation-renderer";

interface InvitePageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ to?: string }>;
}

// Memoized per-request: generateMetadata and the page body both need the
// same lookup, and this avoids running it twice against the database.
const getInvitation = cache(getPublicInvitationBySlug);

export async function generateMetadata({
  params,
  searchParams,
}: InvitePageProps): Promise<Metadata> {
  const { slug } = await params;
  const { to } = await searchParams;

  try {
    const invitation = await getInvitation(slug, to);
    const title = `Undangan ${invitation.title}`;
    const description =
      invitation.description ?? "Buka undangan digital ini untuk melihat detail acara.";

    return {
      title,
      description,
      openGraph: { title, description, type: "website" },
      alternates: { canonical: `/invite/${invitation.slug}` },
    };
  } catch {
    return {
      title: "Undangan Tidak Ditemukan",
      description: "Undangan yang kamu cari tidak ditemukan.",
      robots: { index: false, follow: false },
    };
  }
}

export default async function InvitePage({ params, searchParams }: InvitePageProps) {
  const { slug } = await params;
  const { to } = await searchParams;

  let invitation;
  try {
    invitation = await getInvitation(slug, to);
  } catch (error) {
    if (error instanceof InvitationNotFoundError) notFound();
    throw error;
  }

  // A malformed/foreign token already resolves to no guest context above
  // (`invitation.guest === null`), so the RSVP lookup only ever runs for
  // a request that's already personalized — no separate validation
  // needed here to decide whether to attempt it.
  const rsvpView = to && invitation.guest ? await getRsvpGuestView(invitation.eventId, to) : null;
  const rsvp = rsvpView && to ? { token: to, view: rsvpView } : null;

  // No second lookup needed — invitation.guest already resolved the
  // display name from the same token (see docs/DECISIONS.md D-039).
  const wishGuest =
    to && invitation.guest ? { token: to, guestName: invitation.guest.displayName } : null;

  // Never awaited into the render path in a way that could block it on
  // failure — `trackPublicInvitationView()` catches everything internally
  // and always resolves (see docs/DECISIONS.md's Phase 15 entry). The
  // `sessionId` cookie is assigned by `proxy.ts` before this Server
  // Component ever runs; reading it here is read-only and always safe.
  const [cookieStore, headerList] = await Promise.all([cookies(), headers()]);
  await trackPublicInvitationView({
    eventId: invitation.eventId,
    guestToken: to ?? null,
    hasPersonalizationContext: Boolean(to && invitation.guest),
    sessionId: cookieStore.get(ANALYTICS_SESSION_COOKIE_NAME)?.value,
    userAgent: headerList.get("user-agent"),
    referrer: headerList.get("referer"),
  });

  return <InvitationRenderer invitation={invitation} rsvp={rsvp} wishGuest={wishGuest} />;
}
