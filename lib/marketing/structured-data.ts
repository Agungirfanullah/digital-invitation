import type { PublicPlan } from "@/lib/plans/service";

/**
 * Homepage JSON-LD (docs/DECISIONS.md D-092). Rendered by `app/page.tsx`
 * only — never the root layout, so customers' public invitations do not
 * describe themselves as this product. Prices come from the active `Plan`
 * rows (`getActivePlans()`), never hardcoded (docs/DATABASE.md §25, D-073).
 */

const PRODUCT_NAME = "Digital Invitation";

const PRODUCT_DESCRIPTION =
  "Platform SaaS pembuatan undangan digital untuk pernikahan, aqiqah, ulang tahun, dan berbagai acara spesial di Indonesia.";

/** Omitted when there are no plans or they mix currencies — one AggregateOffer can only state one. */
function buildAggregateOffer(plans: PublicPlan[]) {
  if (plans.length === 0) return null;

  const currency = plans[0].currency;
  if (plans.some((plan) => plan.currency !== currency)) return null;

  const prices = plans.map((plan) => plan.price);
  return {
    "@type": "AggregateOffer",
    priceCurrency: currency,
    lowPrice: String(Math.min(...prices)),
    highPrice: String(Math.max(...prices)),
    offerCount: plans.length,
  };
}

/** `appUrl` is `NEXT_PUBLIC_APP_URL`; without a valid one the Organization carries no url/logo rather than a made-up domain. */
function resolveOrigin(appUrl: string | undefined): string | null {
  if (!appUrl) return null;
  try {
    return new URL(appUrl).origin;
  } catch {
    return null;
  }
}

export function buildHomepageJsonLd(plans: PublicPlan[], appUrl: string | undefined) {
  const offers = buildAggregateOffer(plans);
  const origin = resolveOrigin(appUrl);

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "SoftwareApplication",
        name: PRODUCT_NAME,
        applicationCategory: "DesignApplication",
        operatingSystem: "Web",
        description: PRODUCT_DESCRIPTION,
        ...(offers && { offers }),
      },
      {
        "@type": "Organization",
        name: PRODUCT_NAME,
        ...(origin && { url: origin, logo: `${origin}/favicon.ico` }),
      },
    ],
  };
}

/** Escapes `<` so a value can never close the surrounding `<script>` element (Next.js JSON-LD guide). */
export function serializeJsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
