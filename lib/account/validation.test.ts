import { describe, expect, it } from "vitest";

import { changePasswordSchema, deleteAccountSchema, profileSchema } from "@/lib/account/validation";

describe("account validation", () => {
  it("trims the name and rejects one that is too short", () => {
    expect(profileSchema.parse({ name: "  Citra  " }).name).toBe("Citra");
    expect(profileSchema.safeParse({ name: "C" }).success).toBe(false);
  });

  it("requires a strong new password, a matching confirmation and a real change", () => {
    const base = {
      currentPassword: "Lama-1234",
      password: "Baru-5678",
      confirmPassword: "Baru-5678",
    };
    expect(changePasswordSchema.safeParse(base).success).toBe(true);
    expect(changePasswordSchema.safeParse({ ...base, password: "pendek" }).success).toBe(false);
    expect(changePasswordSchema.safeParse({ ...base, confirmPassword: "Lain-5678" }).success).toBe(
      false,
    );
    expect(
      changePasswordSchema.safeParse({
        currentPassword: "Sama-1234",
        password: "Sama-1234",
        confirmPassword: "Sama-1234",
      }).success,
    ).toBe(false);
  });

  it("accepts only the account's own email as the delete confirmation, in any case", () => {
    const schema = deleteAccountSchema("Ayu@Example.com");
    expect(schema.safeParse({ confirmEmail: " ayu@example.com " }).success).toBe(true);
    expect(schema.safeParse({ confirmEmail: "budi@example.com" }).success).toBe(false);
  });
});
