import { randomUUID } from "node:crypto";
import { describe, expect, it } from "vitest";

import { checkAnalyticsTrackingRateLimit } from "@/lib/analytics/rate-limit";

describe("checkAnalyticsTrackingRateLimit", () => {
  it("allows requests under the limit and blocks once the limit is exceeded", async () => {
    const sessionId = randomUUID();

    for (let i = 0; i < 20; i++) {
      expect(await checkAnalyticsTrackingRateLimit(sessionId)).toBe(true);
    }
    expect(await checkAnalyticsTrackingRateLimit(sessionId)).toBe(false);
  });

  it("tracks distinct sessions independently", async () => {
    const sessionA = randomUUID();
    const sessionB = randomUUID();

    for (let i = 0; i < 20; i++) {
      await checkAnalyticsTrackingRateLimit(sessionA);
    }
    expect(await checkAnalyticsTrackingRateLimit(sessionA)).toBe(false);
    expect(await checkAnalyticsTrackingRateLimit(sessionB)).toBe(true);
  });
});
