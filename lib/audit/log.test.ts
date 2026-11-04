import { describe, expect, it, vi } from "vitest";

const { create } = vi.hoisted(() => ({ create: vi.fn() }));
vi.mock("@/lib/db/prisma", () => ({ prisma: { auditLog: { create } } }));

import { recordAudit } from "@/lib/audit/log";

describe("recordAudit", () => {
  it("stores who did what to which resource", async () => {
    create.mockResolvedValueOnce({});
    await recordAudit({
      userId: "u1",
      action: "event.delete",
      resourceType: "event",
      resourceId: "e1",
      metadata: { slug: "ayu-budi" },
    });
    expect(create).toHaveBeenCalledWith({
      data: {
        userId: "u1",
        action: "event.delete",
        resourceType: "event",
        resourceId: "e1",
        metadata: { slug: "ayu-budi" },
      },
    });
  });

  it("never fails the user's action when the log cannot be written", async () => {
    create.mockImplementation(async () => {
      throw new Error("database down");
    });
    const logged: unknown[] = [];
    const originalError = console.error;
    console.error = (...args: unknown[]) => logged.push(args);
    try {
      await recordAudit({
        userId: "u1",
        action: "guest.delete",
        resourceType: "guest",
        resourceId: "g1",
      });
    } finally {
      console.error = originalError;
    }
    expect(String(logged[0])).toContain("audit_log_failed");
  });
});
