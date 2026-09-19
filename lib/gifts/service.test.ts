import { describe, expect, it } from "vitest";

import { sanitizeGiftMethodInput } from "@/lib/gifts/service";
import type { GiftMethodInput } from "@/lib/gifts/validation";

function input(overrides: Partial<GiftMethodInput>): GiftMethodInput {
  return {
    type: "BANK",
    providerName: "Bank Contoh",
    accountName: "Budi Santoso",
    accountNumber: "1234567890",
    qrImageUrl: "https://example.com/qris.png",
    instructions: "Catatan",
    isActive: true,
    ...overrides,
  };
}

describe("sanitizeGiftMethodInput", () => {
  it("nulls out qrImageUrl for a BANK method", () => {
    const result = sanitizeGiftMethodInput(input({ type: "BANK" }));
    expect(result.qrImageUrl).toBeNull();
    expect(result.accountNumber).toBe("1234567890");
  });

  it("nulls out qrImageUrl for an EWALLET method", () => {
    const result = sanitizeGiftMethodInput(input({ type: "EWALLET" }));
    expect(result.qrImageUrl).toBeNull();
  });

  it("nulls out accountName/accountNumber for a QR method", () => {
    const result = sanitizeGiftMethodInput(input({ type: "QR" }));
    expect(result.accountName).toBeNull();
    expect(result.accountNumber).toBeNull();
    expect(result.qrImageUrl).toBe("https://example.com/qris.png");
  });

  it("nulls out qrImageUrl for an OTHER method but keeps accountName/accountNumber/instructions", () => {
    const result = sanitizeGiftMethodInput(input({ type: "OTHER" }));
    expect(result.qrImageUrl).toBeNull();
    expect(result.accountName).toBe("Budi Santoso");
    expect(result.instructions).toBe("Catatan");
  });

  it("never mutates the original input object", () => {
    const original = input({ type: "BANK" });
    sanitizeGiftMethodInput(original);
    expect(original.qrImageUrl).toBe("https://example.com/qris.png");
  });
});
