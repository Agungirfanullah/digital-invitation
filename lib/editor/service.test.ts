import { describe, expect, it } from "vitest";

import { resolveGalleryMoveSwap } from "@/lib/editor/service";

describe("resolveGalleryMoveSwap", () => {
  const ids = ["a", "b", "c"];

  it("moving the middle item up swaps it with the first", () => {
    expect(resolveGalleryMoveSwap(ids, "b", "up")).toEqual({ indexA: 1, indexB: 0 });
  });

  it("moving the middle item down swaps it with the last", () => {
    expect(resolveGalleryMoveSwap(ids, "b", "down")).toEqual({ indexA: 1, indexB: 2 });
  });

  it("moving the first item up is a no-op (already at the top edge)", () => {
    expect(resolveGalleryMoveSwap(ids, "a", "up")).toBeNull();
  });

  it("moving the last item down is a no-op (already at the bottom edge)", () => {
    expect(resolveGalleryMoveSwap(ids, "c", "down")).toBeNull();
  });

  it("returns null for an id that isn't in the list at all", () => {
    expect(resolveGalleryMoveSwap(ids, "missing", "up")).toBeNull();
  });

  it("a single-item list can't move in either direction", () => {
    expect(resolveGalleryMoveSwap(["only"], "only", "up")).toBeNull();
    expect(resolveGalleryMoveSwap(["only"], "only", "down")).toBeNull();
  });
});
