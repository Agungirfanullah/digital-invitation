import { describe, expect, it } from "vitest";

import { auditActorLabel } from "@/lib/admin/labels";

describe("auditActorLabel", () => {
  it("shows the actor's email when the account exists", () => {
    expect(auditActorLabel({ user: { email: "a@contoh.com" }, metadata: null })).toBe(
      "a@contoh.com",
    );
  });

  it("names a script-written row as the system", () => {
    expect(auditActorLabel({ user: null, metadata: { via: "script", to: "ADMIN" } })).toBe(
      "Sistem (skrip)",
    );
  });

  it("names a row without an actor as a deleted account otherwise", () => {
    expect(auditActorLabel({ user: null, metadata: null })).toBe("Akun yang sudah dihapus");
    expect(auditActorLabel({ user: null, metadata: { email: "x" } })).toBe(
      "Akun yang sudah dihapus",
    );
  });
});
