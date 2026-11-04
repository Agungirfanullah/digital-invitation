import { afterEach, describe, expect, it, vi } from "vitest";

import robots from "@/app/robots";
import sitemap from "@/app/sitemap";
import { TEMPLATE_KEYS } from "@/lib/invitations/templates/registry";

describe("robots.txt and sitemap.xml", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("lists the homepage and every template demo, never a customer invitation", () => {
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://undangan.example");
    const urls = sitemap().map((entry) => entry.url);

    expect(urls).toContain("https://undangan.example/");
    for (const slug of TEMPLATE_KEYS) {
      expect(urls).toContain(`https://undangan.example/demo/${slug}`);
    }
    expect(urls.some((url) => url.includes("/invite/"))).toBe(false);
  });

  it("keeps private areas out but lets crawlers see invitations' noindex", () => {
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://undangan.example");
    const result = robots();
    const disallow = [result.rules].flat().flatMap((rule) => [rule.disallow ?? []].flat());

    expect(disallow).toContain("/dashboard");
    expect(disallow).not.toContain("/invite/");
    expect(result.sitemap).toBe("https://undangan.example/sitemap.xml");
  });

  it("returns an empty sitemap instead of failing when the site URL is missing", () => {
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "");
    expect(sitemap()).toEqual([]);
  });
});
