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

/**
 * A small set of specific Picsum photo IDs (Picsum serves free-to-use
 * Unsplash photos, no attribution required), each individually viewed and
 * picked because it actually shows a person — not a random seed, which
 * (confirmed by inspection) just as often turns up a forest, a hiking
 * backpack, or a dog. Grouped into two moods and assigned per template so
 * the demo's cover/gallery photos suit that template's own palette,
 * instead of one photo style looking out of place everywhere. Still never
 * a real couple's photo (this product has no rights to use one) — these
 * are editorial/lifestyle portraits of individual models.
 */
const ELEGANT_PHOTO_IDS = [1027, 338];
const WARM_PHOTO_IDS = [64, 1012, 823];

const WARM_MOOD_SLUGS = new Set([
  "floral-romance",
  "soft-romantic",
  "cinematic-journey",
  "rustic-earth",
  "playful-pop",
  "blue-bloom",
  "garden-tropical",
]);

function demoPhotoIds(slug: string): number[] {
  return WARM_MOOD_SLUGS.has(slug) ? WARM_PHOTO_IDS : ELEGANT_PHOTO_IDS;
}

function demoPhotoUrl(id: number, width: number, height: number): string {
  return `https://picsum.photos/id/${id}/${width}/${height}`;
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
  //   features too, using the verified-to-show-a-person photo IDs above
  //   (demoPhotoIds()), matched to this template's own mood.
  const base = buildDemoInvitation(slug);
  const photoIds = demoPhotoIds(slug);
  const invitation = {
    ...base,
    guest: { displayName: "Tamu Undangan" },
    theme: {
      ...base.theme,
      backgroundImageUrl: demoPhotoUrl(photoIds[0], 800, 1200),
    },
    galleries: [
      {
        title: null,
        items: [0, 1, 2, 3].map((i) => ({
          id: `demo-gallery-${i}`,
          type: "IMAGE" as const,
          url: demoPhotoUrl(photoIds[i % photoIds.length], 800, 800),
          thumbnailUrl: null,
          caption: null,
        })),
      },
    ],
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
