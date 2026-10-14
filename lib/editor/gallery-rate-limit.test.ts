import { describe, expect, it } from "vitest";

import { GALLERY_UPLOAD_LIMIT, checkGalleryUploadRateLimit } from "@/lib/editor/gallery-rate-limit";
import { MAX_FILES_PER_BATCH } from "@/lib/editor/upload-queue";

describe("gallery upload rate limit", () => {
  it("leaves room for at least a few full 20-photo selections in one window", () => {
    expect(GALLERY_UPLOAD_LIMIT.limit).toBeGreaterThanOrEqual(MAX_FILES_PER_BATCH * 3);
  });

  it("allows exactly the limit per user, then refuses", async () => {
    const userId = `rate-limit-test-${Math.random()}`;

    for (let upload = 0; upload < GALLERY_UPLOAD_LIMIT.limit; upload += 1) {
      expect(await checkGalleryUploadRateLimit(userId), `upload ${upload + 1}`).toBe(true);
    }
    expect(await checkGalleryUploadRateLimit(userId)).toBe(false);
  });

  it("counts each user separately", async () => {
    const busy = `rate-limit-busy-${Math.random()}`;
    const other = `rate-limit-other-${Math.random()}`;

    for (let upload = 0; upload < GALLERY_UPLOAD_LIMIT.limit; upload += 1) {
      await checkGalleryUploadRateLimit(busy);
    }

    expect(await checkGalleryUploadRateLimit(busy)).toBe(false);
    expect(await checkGalleryUploadRateLimit(other)).toBe(true);
  });
});
