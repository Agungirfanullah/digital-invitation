import { beforeEach, describe, expect, it, vi } from "vitest";

const upsertMock = vi.fn();

vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    user: {
      upsert: (...args: unknown[]) => upsertMock(...args),
    },
  },
}));

import { ensureAppUser } from "@/lib/auth/provisioning";

describe("ensureAppUser", () => {
  beforeEach(() => {
    upsertMock.mockReset();
  });

  it("upserts by Supabase user id, creating the row with name+email", async () => {
    upsertMock.mockResolvedValue({ id: "sb-123", email: "a@b.com", name: "Agung" });

    const result = await ensureAppUser({ id: "sb-123", email: "a@b.com", name: "Agung" });

    expect(upsertMock).toHaveBeenCalledWith({
      where: { id: "sb-123" },
      update: { email: "a@b.com" },
      create: { id: "sb-123", email: "a@b.com", name: "Agung" },
    });
    expect(result).toEqual({ id: "sb-123", email: "a@b.com", name: "Agung" });
  });

  it("never overwrites name on repeat calls, only email", async () => {
    upsertMock.mockResolvedValue({});

    await ensureAppUser({ id: "sb-1", email: "x@y.com", name: "Whatever Supabase Sends" });

    const call = upsertMock.mock.calls[0][0];
    expect(call.update).toStrictEqual({ email: "x@y.com" });
    expect(call.update).not.toHaveProperty("name");
  });
});
