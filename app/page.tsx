import type { Metadata } from "next";

import { getSupabaseUser } from "@/lib/auth/session";
import { listTemplateOptions } from "@/lib/editor/service";
import { getActivePlans } from "@/lib/plans/service";
import { Benefits } from "@/components/marketing/benefits";
import { ClosingCta } from "@/components/marketing/closing-cta";
import { Faq } from "@/components/marketing/faq";
import { FeatureSection } from "@/components/marketing/feature-section";
import { Hero } from "@/components/marketing/hero";
import { HowItWorks } from "@/components/marketing/how-it-works";
import {
  CalendarCheckIcon,
  ChartBarIcon,
  UsersIcon,
  WalletIcon,
} from "@/components/marketing/icons";
import {
  AnalyticsMockup,
  GiftMockup,
  GuestListMockup,
  RsvpMockup,
} from "@/components/marketing/feature-mockups";
import { InvitationPreview } from "@/components/marketing/invitation-preview";
import { Pricing } from "@/components/marketing/pricing";
import { SiteFooter } from "@/components/marketing/site-footer";
import { SiteHeader } from "@/components/marketing/site-header";
import { Testimonials } from "@/components/marketing/testimonials";
import { TemplateShowcase } from "@/components/marketing/template-showcase";
import { InvitationRenderer } from "@/components/invitation/invitation-renderer";
import { buildDemoInvitation } from "@/lib/marketing/demo-invitation";
import { buildHomepageJsonLd, serializeJsonLd } from "@/lib/marketing/structured-data";

const HOME_TITLE = "Digital Invitation — Undangan Digital yang Cantik, Personal, dan Berkesan";
const HOME_DESCRIPTION =
  "Buat undangan digital dalam hitungan menit. Pilih desain, kelola tamu, bagikan lewat WhatsApp, dan pantau RSVP dari satu tempat.";

// `openGraph`/`twitter` replace the root layout's objects whole (metadata
// merges shallowly), so the layout's siteName/locale/type are repeated here.
export const metadata: Metadata = {
  title: HOME_TITLE,
  description: HOME_DESCRIPTION,
  openGraph: {
    title: HOME_TITLE,
    description: HOME_DESCRIPTION,
    siteName: "Digital Invitation",
    locale: "id_ID",
    type: "website",
    url: "/",
  },
  twitter: { card: "summary_large_image", title: HOME_TITLE, description: HOME_DESCRIPTION },
};

// Every other route already reads cookies/headers/searchParams somewhere in
// its render tree, which forces dynamic rendering — this is the one page
// that doesn't. Nonce-based CSP (proxy.ts) requires dynamic rendering to
// inject a fresh nonce into Next's own hydration scripts; a statically
// generated page would have none, and its own scripts would be blocked.
export const dynamic = "force-dynamic";

export default async function Home() {
  const user = await getSupabaseUser();
  // Mirrors app/(auth)/register/page.tsx's own existing precedent for an
  // already-authenticated visitor — Homepage never modifies loginAction/
  // registerAction, it only routes into them (D-071 compatibility).
  const ctaHref = user ? "/dashboard" : "/register";

  const [templates, plans] = await Promise.all([
    listTemplateOptions().then((options) => options.filter((option) => option.implemented)),
    getActivePlans(),
  ]);

  // Pre-rendered server-side (buildDemoInvitation/InvitationRenderer are not
  // usable from the Client Component below) — one per template, so clicking
  // a card in TemplateShowcase only toggles visibility, never re-renders.
  const templatePreviews = Object.fromEntries(
    templates.map((template) => [
      template.slug,
      <InvitationRenderer
        key={template.slug}
        invitation={buildDemoInvitation(template.slug)}
        bypassOpening
      />,
    ]),
  );

  const jsonLd = buildHomepageJsonLd(plans, process.env.NEXT_PUBLIC_APP_URL);

  return (
    <div className="flex flex-1 flex-col">
      {/* A data block, not executed, so the nonce CSP (D-053) does not apply. */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLd) }}
      />
      <SiteHeader ctaHref={ctaHref} />

      <main className="flex-1">
        <Hero ctaHref={ctaHref} />
        <TemplateShowcase templates={templates} previews={templatePreviews} />
        <Benefits />
        <HowItWorks />
        <InvitationPreview />
        <FeatureSection
          id="guest-management"
          heading="Kelola Tamu Tanpa Ribet"
          description="Tambahkan tamu satu per satu atau impor dari CSV, lengkap dengan tautan undangan pribadi untuk masing-masing tamu."
          icon={UsersIcon}
          visual={<GuestListMockup />}
        />
        <FeatureSection
          id="marketing-rsvp"
          heading="RSVP Langsung dari Undangan"
          description="Tamu mengisi kehadiran langsung dari undangan digital, dan kamu bisa memantau jawabannya secara langsung."
          icon={CalendarCheckIcon}
          visual={<RsvpMockup />}
          reverse
          className="bg-muted/30"
        />
        <FeatureSection
          id="digital-gift"
          heading="Digital Gift"
          description="Tampilkan informasi rekening atau e-wallet untuk hadiah digital langsung di undanganmu."
          icon={WalletIcon}
          visual={<GiftMockup />}
        />
        <FeatureSection
          id="analytics"
          heading="Analitik Undangan"
          description="Pantau berapa banyak tamu yang membuka undanganmu, langsung dari dashboard."
          icon={ChartBarIcon}
          visual={<AnalyticsMockup />}
          reverse
          className="bg-muted/30"
        />
        <Pricing plans={plans} ctaHref={ctaHref} />
        <Testimonials />
        <Faq />
        <ClosingCta ctaHref={ctaHref} />
      </main>

      <SiteFooter />
    </div>
  );
}
