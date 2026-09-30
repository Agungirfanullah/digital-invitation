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
import { InvitationPreview } from "@/components/marketing/invitation-preview";
import { Pricing } from "@/components/marketing/pricing";
import { SiteFooter } from "@/components/marketing/site-footer";
import { SiteHeader } from "@/components/marketing/site-header";
import { Testimonials } from "@/components/marketing/testimonials";
import { TemplateShowcase } from "@/components/marketing/template-showcase";

export const metadata: Metadata = {
  title: "Digital Invitation — Undangan Digital yang Cantik, Personal, dan Berkesan",
  description:
    "Buat undangan digital dalam hitungan menit. Pilih desain, kelola tamu, bagikan lewat WhatsApp, dan pantau RSVP dari satu tempat.",
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

  return (
    <div className="flex flex-1 flex-col">
      <SiteHeader ctaHref={ctaHref} />

      <main className="flex-1">
        <Hero ctaHref={ctaHref} />
        <TemplateShowcase templates={templates} />
        <Benefits />
        <HowItWorks />
        <InvitationPreview />
        <FeatureSection
          id="guest-management"
          heading="Kelola Tamu Tanpa Ribet"
          description="Tambahkan tamu satu per satu atau impor dari CSV, lengkap dengan tautan undangan pribadi untuk masing-masing tamu."
        />
        <FeatureSection
          id="marketing-rsvp"
          heading="RSVP Langsung dari Undangan"
          description="Tamu mengisi kehadiran langsung dari undangan digital, dan kamu bisa memantau jawabannya secara langsung."
          className="bg-muted/30"
        />
        <FeatureSection
          id="digital-gift"
          heading="Digital Gift"
          description="Tampilkan informasi rekening atau e-wallet untuk hadiah digital langsung di undanganmu."
        />
        <FeatureSection
          id="analytics"
          heading="Analitik Undangan"
          description="Pantau berapa banyak tamu yang membuka undanganmu, langsung dari dashboard."
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
