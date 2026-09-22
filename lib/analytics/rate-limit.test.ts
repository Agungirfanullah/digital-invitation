import { randomUUID } from "node:crypto";
import { describe, expect, it } from "vitest";

import { checkAnalyticsTrackingRateLimit } from "@/lib/analytics/rate-limit";

describe("checkAnalyticsTrackingRateLimit", () => {
  it("allows requests under the limit and blocks once the limit is exceeded", () => {
    const sessionId = randomUUID();

    for (let i = 0; i < 20; i++) {
      expect(checkAnalyticsTrackingRateLimit(sessionId)).toBe(true);
    }
    expect(checkAnalyticsTrackingRateLimit(sessionId)).toBe(false);
  });

  it("tracks distinct sessions independently", () => {
    const sessionA = randomUUID();
    const sessionB = randomUUID();

    for (let i = 0; i < 20; i++) {
      checkAnalyticsTrackingRateLimit(sessionA);
    }
    expect(checkAnalyticsTrackingRateLimit(sessionA)).toBe(false);
    expect(checkAnalyticsTrackingRateLimit(sessionB)).toBe(true);
  });
});
