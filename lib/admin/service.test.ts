import { describe, expect, it, vi } from "vitest";

const { prisma, recordAudit } = vi.hoisted(() => ({
  prisma: {
    user: { findUnique: vi.fn(), count: vi.fn(), update: vi.fn() },
  },
  recordAudit: vi.fn(),
}));
vi.mock("@/lib/db/prisma", () => ({ prisma }));
vi.mock("@/lib/audit/log", () => ({ recordAudit }));
vi.mock("@/lib/account/service", () => ({ deleteAccount: vi.fn() }));
vi.mock("@/lib/storage/provider", () => ({ getStorageProvider: vi.fn() }));

import {
  AdminActionError,
  adminDeleteUser,
  setUserRole,
  setUserSuspended,
} from "@/lib/admin/service";

describe("admin guards", () => {
  it("never lets an admin change, suspend or delete their own account", async () => {
    await expect(setUserRole("a1", "a1", "USER")).rejects.toBeInstanceOf(AdminActionError);
    await expect(setUserSuspended("a1", "a1", true)).rejects.toBeInstanceOf(AdminActionError);
    await expect(adminDeleteUser("a1", "a1")).rejects.toBeInstanceOf(AdminActionError);
    expect(prisma.user.update).not.toHaveBeenCalled();
  });

  it("keeps at least one admin", async () => {
    prisma.user.findUnique.mockResolvedValueOnce({ id: "a2", email: "a2@x", role: "ADMIN" });
    prisma.user.count.mockResolvedValueOnce(1);
    await expect(setUserRole("a1", "a2", "USER")).rejects.toThrow("minimal satu admin");
    expect(prisma.user.update).not.toHaveBeenCalled();
  });

  it("records a role change with its old and new value", async () => {
    prisma.user.findUnique.mockResolvedValueOnce({ id: "u2", email: "u2@x", role: "USER" });
    prisma.user.update.mockResolvedValueOnce({});
    await setUserRole("a1", "u2", "ADMIN");
    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: "u2" },
      data: { role: "ADMIN" },
    });
    expect(recordAudit).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: "a1",
        action: "admin.set_role",
        resourceId: "u2",
        metadata: { from: "USER", to: "ADMIN" },
      }),
    );
  });

  it("refuses to delete another admin until they are demoted", async () => {
    prisma.user.findUnique.mockResolvedValueOnce({ id: "a2", email: "a2@x", role: "ADMIN" });
    await expect(adminDeleteUser("a1", "a2")).rejects.toThrow("Turunkan role admin");
  });
});
