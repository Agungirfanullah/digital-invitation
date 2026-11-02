import { describe, expect, it } from "vitest";

import { mosaicCell } from "@/components/invitation/sections/gallery-grid";

describe("mosaicCell", () => {
  it("makes the first photo of each complete group of three tall, alternating sides", () => {
    const cells = Array.from({ length: 6 }, (_, index) => mosaicCell(index, 6));
    expect(cells).toEqual(["row-span-2", null, null, "col-start-2 row-span-2", null, null]);
  });

  it("keeps a trailing pair as squares and widens a single leftover photo, so no gap opens", () => {
    expect([3, 4].map((index) => mosaicCell(index, 5))).toEqual([null, null]);
    expect(mosaicCell(3, 4)).toContain("col-span-2");
    expect([0, 1].map((index) => mosaicCell(index, 2))).toEqual([null, null]);
  });

  it("shows a lone photo as a plain square", () => {
    expect(mosaicCell(0, 1)).toBeNull();
  });
});
