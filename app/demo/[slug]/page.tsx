import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { isKnownTemplateKey } from "@/lib/invitations/templates/registry";
import { buildDemoInvitation } from "@/lib/marketing/demo-invitation";
import { InvitationRenderer } from "@/components/invitation/invitation-renderer";

interface DemoPageProps {
  params: Promise<{ slug: string }>;
}

/** "modern-editorial" -> "Modern Editorial" — purely cosmetic, no DB round trip for a static demo page. */
function templateDisplayName(slug: string): string {
  return slug
    .split("-")
    .map((word) => word[0].toUpperCase() + word.slice(1))
    .join(" ");
}

export async function generateMetadata({ params }: DemoPageProps): Promise<Metadata> {
  const { slug } = await params;
  if (!isKnownTemplateKey(slug)) {
    return { title: "Template Tidak Ditemukan", robots: { index: false, follow: false } };
  }

  const name = templateDisplayName(slug);
  const title = `Demo Template ${name} — Digital Invitation`;
  const description = `Lihat tampilan asli template undangan digital ${name} — bukan tangkapan layar, ini pengalaman yang sama persis yang akan dilihat tamumu.`;

  return {
    title,
    description,
    openGraph: { title, description, type: "website" },
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

  // Demo-page-only additions (not touched in the Homepage's shared
  // buildDemoInvitation() usage):
  // - a generic, obviously-fake guest name so this page can also
  //   demonstrate personalization and the guest-facing QR check-in button
  //   — both genuinely real features, shown honestly in a page already
  //   labeled as a demo. This never flips RSVP/Wishes into their
  //   submittable state, since those read the separate `rsvp`/`wishGuest`
  //   props (intentionally omitted below), not `invitation.guest`.
  // - a cover photo + gallery so the demo can show the real photo-upload
  //   features too. Picsum (picsum.photos) serves free-to-use, seeded
  //   (stable, not random-per-request) placeholder photos — not a real
  //   couple's photos, which this product has no rights to use. Seeds are
  //   per-template so each of the 6 demo pages shows different images
  //   instead of all six looking identical.
  const base = buildDemoInvitation(slug);
  const invitation = {
    ...base,
    guest: { displayName: "Tamu Undangan" },
    theme: {
      ...base.theme,
      backgroundImageUrl: `https://picsum.photos/seed/${slug}-cover/800/1200`,
    },
    galleries: [
      {
        title: null,
        items: [1, 2, 3, 4].map((n) => ({
          id: `demo-gallery-${n}`,
          type: "IMAGE" as const,
          url: `https://picsum.photos/seed/${slug}-gallery-${n}/800/800`,
          thumbnailUrl: null,
          caption: null,
        })),
      },
    ],
  };

  return (
    <div className="relative min-h-screen">
      <div className="bg-foreground text-background flex flex-wrap items-center justify-center gap-x-3 gap-y-1 px-4 py-2 text-center text-xs font-medium">
        <span>Ini tampilan demo template {templateDisplayName(slug)} — bukan undangan asli.</span>
        <Link href="/register" className="underline underline-offset-2">
          Buat Undanganmu →
        </Link>
      </div>
      <InvitationRenderer invitation={invitation} />
    </div>
  );
}
