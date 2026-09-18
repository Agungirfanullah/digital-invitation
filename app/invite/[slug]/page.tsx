import { cache } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { getPublicInvitationBySlug } from "@/lib/invitations/service";
import { InvitationNotFoundError } from "@/lib/invitations/errors";
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

  return <InvitationRenderer invitation={invitation} />;
}
