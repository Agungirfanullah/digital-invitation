import { describe, expect, it } from "vitest";

import { giftMethodInputSchema } from "@/lib/gifts/validation";

const base = {
  providerName: null,
  accountName: null,
  accountNumber: null,
  qrImageUrl: null,
  instructions: null,
  isActive: "on",
};

describe("giftMethodInputSchema", () => {
  it("accepts a fully-specified BANK method", () => {
    const result = giftMethodInputSchema.safeParse({
      ...base,
      type: "BANK",
      providerName: "Bank Contoh",
      accountName: "Budi Santoso",
      accountNumber: "1234567890",
    });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.isActive).toBe(true);
  });

  it("rejects a BANK method missing the bank name", () => {
    const result = giftMethodInputSchema.safeParse({
      ...base,
      type: "BANK",
      accountNumber: "1234567890",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.providerName).toBeTruthy();
    }
  });

  it("rejects a BANK method missing the account number", () => {
    const result = giftMethodInputSchema.safeParse({
      ...base,
      type: "BANK",
      providerName: "Bank Contoh",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.accountNumber).toBeTruthy();
    }
  });

  it("accepts a fully-specified EWALLET method", () => {
    const result = giftMethodInputSchema.safeParse({
      ...base,
      type: "EWALLET",
      providerName: "GoPay",
      accountNumber: "081234567890",
    });
    expect(result.success).toBe(true);
  });

  it("rejects an EWALLET method missing both provider and account number", () => {
    const result = giftMethodInputSchema.safeParse({ ...base, type: "EWALLET" });
    expect(result.success).toBe(false);
    if (!result.success) {
      const errors = result.error.flatten().fieldErrors;
      expect(errors.providerName).toBeTruthy();
      expect(errors.accountNumber).toBeTruthy();
    }
  });

  it("accepts a QR method with only an image URL", () => {
    const result = giftMethodInputSchema.safeParse({
      ...base,
      type: "QR",
      qrImageUrl: "https://example.com/qris.png",
    });
    expect(result.success).toBe(true);
  });

  it("rejects a QR method missing the image URL", () => {
    const result = giftMethodInputSchema.safeParse({ ...base, type: "QR" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.qrImageUrl).toBeTruthy();
    }
  });

  it("rejects a QR method with an unsafe (javascript:) image URL", () => {
    const result = giftMethodInputSchema.safeParse({
      ...base,
      type: "QR",
      qrImageUrl: "javascript:alert(1)",
    });
    expect(result.success).toBe(false);
  });

  it("accepts an OTHER (manual/physical-gift) method with a title and instructions", () => {
    const result = giftMethodInputSchema.safeParse({
      ...base,
      type: "OTHER",
      providerName: "Alamat Pengiriman",
      instructions: "Jl. Contoh No. 1, Jakarta",
    });
    expect(result.success).toBe(true);
  });

  it("rejects an OTHER method missing the title or instructions", () => {
    const result = giftMethodInputSchema.safeParse({ ...base, type: "OTHER" });
    expect(result.success).toBe(false);
    if (!result.success) {
      const errors = result.error.flatten().fieldErrors;
      expect(errors.providerName).toBeTruthy();
      expect(errors.instructions).toBeTruthy();
    }
  });

  it("treats an empty string as null for optional fields (FormData shape)", () => {
    const result = giftMethodInputSchema.safeParse({
      type: "BANK",
      providerName: "Bank Contoh",
      accountName: "",
      accountNumber: "1234567890",
      qrImageUrl: "",
      instructions: "",
      isActive: "on",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.accountName).toBeNull();
      expect(result.data.instructions).toBeNull();
    }
  });

  it("treats a missing (unchecked-checkbox) isActive as false", () => {
    const result = giftMethodInputSchema.safeParse({
      ...base,
      type: "BANK",
      providerName: "Bank Contoh",
      accountNumber: "1234567890",
      isActive: undefined,
    });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.isActive).toBe(false);
  });

  it("rejects a provider name longer than 100 characters", () => {
    const result = giftMethodInputSchema.safeParse({
      ...base,
      type: "BANK",
      providerName: "A".repeat(101),
      accountNumber: "1234567890",
    });
    expect(result.success).toBe(false);
  });

  it("rejects instructions longer than 1000 characters", () => {
    const result = giftMethodInputSchema.safeParse({
      ...base,
      type: "OTHER",
      providerName: "Alamat Pengiriman",
      instructions: "A".repeat(1001),
    });
    expect(result.success).toBe(false);
  });
});
