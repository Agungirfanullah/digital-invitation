import { beforeEach, describe, expect, it, vi } from "vitest";

// The access check passes, then the event is gone by the time it is read:
// deleted in another tab or by a co-owner between the two queries.
const { getAuthorizedEvent, findUnique } = vi.hoisted(() => ({
  getAuthorizedEvent: vi.fn(),
  findUnique: vi.fn(),
}));
vi.mock("@/lib/events/authorization", () => ({ getAuthorizedEvent }));
vi.mock("@/lib/db/prisma", () => ({ prisma: { event: { findUnique } } }));

import { EventNotFoundError } from "@/lib/editor/errors";
import { getEditorEvent } from "@/lib/editor/service";

describe("getEditorEvent when the event is deleted after the access check", () => {
  beforeEach(() => {
    getAuthorizedEvent.mockResolvedValue({ id: "evt1" });
    findUnique.mockResolvedValue(null);
  });

  it("reports the event as not found instead of throwing a database error", async () => {
    await expect(getEditorEvent("evt1", "user1")).rejects.toBeInstanceOf(EventNotFoundError);
  });
});
