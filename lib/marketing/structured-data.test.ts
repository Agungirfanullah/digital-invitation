import { describe, expect, it } from "vitest";

import { buildHomepageJsonLd, serializeJsonLd } from "@/lib/marketing/structured-data";
import type { PublicPlan } from "@/lib/plans/service";

function plan(slug: string, price: number, currency = "IDR"): PublicPlan {
  return { name: slug, slug, price, currency, maxEvents: null, maxGuests: null };
}

const SEEDED_PLANS = [plan("free", 0), plan("premium", 99000), plan("business", 299000)];

function graph(jsonLd: ReturnType<typeof buildHomepageJsonLd>) {
  const [app, org] = jsonLd["@graph"];
  return { app: app as Record<string, unknown>, org: org as Record<string, unknown> };
}

describe("buildHomepageJsonLd", () => {
  it("takes the price range from the plans, not a hardcoded value", () => {
    const { app } = graph(buildHomepageJsonLd(SEEDED_PLANS, "https://undangan.example"));

    expect(app.offers).toEqual({
      "@type": "AggregateOffer",
      priceCurrency: "IDR",
      lowPrice: "0",
      highPrice: "299000",
      offerCount: 3,
    });
  });

  it("follows a price change in the database", () => {
    const { app } = graph(
      buildHomepageJsonLd([plan("free", 0), plan("premium", 149000)], undefined),
    );

    expect(app.offers).toMatchObject({ lowPrice: "0", highPrice: "149000", offerCount: 2 });
  });

  it("omits offers when there are no active plans", () => {
    const { app } = graph(buildHomepageJsonLd([], undefined));

    expect(app).not.toHaveProperty("offers");
  });

  it("omits offers when plans mix currencies", () => {
    const { app } = graph(
      buildHomepageJsonLd([plan("a", 0, "IDR"), plan("b", 10, "USD")], undefined),
    );

    expect(app).not.toHaveProperty("offers");
  });

  it("uses the configured origin for the organization url and logo", () => {
    const { org } = graph(buildHomepageJsonLd(SEEDED_PLANS, "https://undangan.example/some/path"));

    expect(org.url).toBe("https://undangan.example");
    expect(org.logo).toBe("https://undangan.example/favicon.ico");
  });

  it.each([undefined, "", "not a url"])("invents no url when the app url is %j", (appUrl) => {
    const { org } = graph(buildHomepageJsonLd(SEEDED_PLANS, appUrl));

    expect(org).not.toHaveProperty("url");
    expect(org).not.toHaveProperty("logo");
  });

  it("carries no rating", () => {
    const output = JSON.stringify(buildHomepageJsonLd(SEEDED_PLANS, undefined));

    expect(output).not.toMatch(/aggregateRating|ratingValue|reviewCount|"review"/);
  });
});

describe("serializeJsonLd", () => {
  it("cannot close the surrounding script element", () => {
    const output = serializeJsonLd({ name: "</script><script>alert(1)</script>" });

    expect(output).not.toContain("<");
    expect(JSON.parse(output)).toEqual({ name: "</script><script>alert(1)</script>" });
  });
});
