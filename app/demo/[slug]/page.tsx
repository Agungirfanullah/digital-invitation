import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { isKnownTemplateKey } from "@/lib/invitations/templates/registry";
import {
  buildDemoInvitationWithPhotos,
  templateDisplayName,
} from "@/lib/marketing/demo-invitation";
import { InvitationRenderer } from "@/components/invitation/invitation-renderer";

interface DemoPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: DemoPageProps): Promise<Metadata> {
  const { slug } = await params;
  if (!isKnownTemplateKey(slug)) {
    return { title: "Template Tidak Ditemukan", robots: { index: false, follow: false } };
  }

  const name = templateDisplayName(slug);
  // The root layout's title template appends the brand to the page title;
  // social previews get no template, so they carry it themselves.
  const title = `Demo Template ${name}`;
  const shareTitle = `${title} — Digital Invitation`;
  const description = `Lihat tampilan asli template undangan digital ${name} — bukan tangkapan layar, ini pengalaman yang sama persis yang akan dilihat tamumu.`;

  return {
    title,
    description,
    openGraph: {
      title: shareTitle,
      description,
      type: "website",
      siteName: "Digital Invitation",
      locale: "id_ID",
    },
    twitter: { card: "summary_large_image", title: shareTitle, description },
    alternates: { canonical: `/demo/${slug}` },
  };
}

/**
 * Public, unauthenticated demo of one template — the same "Ayu & Budi"
 * fabricated demo data and real `InvitationRenderer`/template system the
 * Homepage's Template Showcase/Hero/Invitation Preview sections already
 * use (`lib/marketing/demo-invitation.ts`), but as its own full-page,
 * shareable URL instead of a small embedded preview. Unlike those
 * Homepage previews, this does NOT pass `bypassOpening` — a visitor gets
 * the real Opening/Reveal gate and full scroll experience a guest would,
 * which is the point of a dedicated demo link.
 */
export default async function DemoPage({ params }: DemoPageProps) {
  const { slug } = await params;
  if (!isKnownTemplateKey(slug)) notFound();

  // Sample photos come from buildDemoInvitationWithPhotos(), shared with the
  // Homepage previews. The page adds a generic, obviously-fake guest name so
  // it can also demonstrate personalization and the guest-facing QR check-in
  // button, both real features, shown honestly on a page labeled as a demo.
  // This never flips RSVP/Wishes into their submittable state: those read the
  // separate `rsvp`/`wishGuest` props, intentionally omitted below.
  const invitation = {
    ...buildDemoInvitationWithPhotos(slug),
    guest: { displayName: "Tamu Undangan" },
  };

  return (
    <div className="relative min-h-screen">
      <div className="bg-foreground text-background relative z-[60] flex flex-wrap items-center justify-center gap-x-3 gap-y-1 px-4 py-2 text-center text-xs font-medium">
        <span>Ini tampilan demo template {templateDisplayName(slug)} — bukan undangan asli.</span>
        <Link href="/register" className="underline underline-offset-2">
          Buat Undanganmu →
        </Link>
      </div>
      <InvitationRenderer invitation={invitation} />
    </div>
  );
}
