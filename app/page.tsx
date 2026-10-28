import type { Metadata } from "next";

import { getSupabaseUser } from "@/lib/auth/session";
import { listTemplateOptions } from "@/lib/editor/service";
import { getTemplateDefaultTheme } from "@/lib/invitations/templates/default-themes";
import { getActivePlans } from "@/lib/plans/service";
import { Benefits } from "@/components/marketing/benefits";
import { ClosingCta } from "@/components/marketing/closing-cta";
import { EventTypesStrip } from "@/components/marketing/event-types-strip";
import { Faq } from "@/components/marketing/faq";
import { Hero } from "@/components/marketing/hero";
import { HowItWorks } from "@/components/marketing/how-it-works";
import { InvitationPreview } from "@/components/marketing/invitation-preview";
import { Pricing } from "@/components/marketing/pricing";
import { SiteFooter } from "@/components/marketing/site-footer";
import { SiteHeader } from "@/components/marketing/site-header";
import { Testimonials } from "@/components/marketing/testimonials";
import { TemplateShowcase } from "@/components/marketing/template-showcase";
import { InvitationRenderer } from "@/components/invitation/invitation-renderer";
import { buildDemoInvitationWithPhotos } from "@/lib/marketing/demo-invitation";
import { FAQ_ITEMS } from "@/lib/marketing/faq";
import { buildHomepageJsonLd, serializeJsonLd } from "@/lib/marketing/structured-data";
import { templateStyle } from "@/lib/marketing/template-styles";

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
  alternates: { canonical: "/" },
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

  // Pre-rendered server-side (the demo builders and InvitationRenderer are
  // not usable from the Client Component carousel) — one per template, so
  // filtering in TemplateShowcase only toggles visibility, never re-renders.
  const templatePreviews = Object.fromEntries(
    templates.map((template) => [
      template.slug,
      <InvitationRenderer
        key={template.slug}
        invitation={buildDemoInvitationWithPhotos(template.slug)}
        bypassOpening
      />,
    ]),
  );
  const showcaseTemplates = templates.map((template) => {
    const theme = getTemplateDefaultTheme(template.slug);
    return {
      slug: template.slug,
      name: template.name,
      style: templateStyle(template.slug),
      colors: [theme.backgroundColor, theme.primaryColor, theme.secondaryColor].filter(
        (color): color is string => Boolean(color),
      ),
    };
  });

  const jsonLd = buildHomepageJsonLd(plans, process.env.NEXT_PUBLIC_APP_URL, FAQ_ITEMS);

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
        <EventTypesStrip />
        <TemplateShowcase templates={showcaseTemplates} previews={templatePreviews} />
        <Benefits />
        <HowItWorks />
        <InvitationPreview />
        <Pricing plans={plans} ctaHref={ctaHref} />
        <Testimonials />
        <Faq />
        <ClosingCta ctaHref={ctaHref} />
      </main>

      <SiteFooter templates={templates} />
    </div>
  );
}
