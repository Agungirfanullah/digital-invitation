import { describe, expect, it } from "vitest";

import {
  attemptDelivery,
  getDeliveryProvider,
  type InvitationDeliveryProvider,
} from "@/lib/invitation-delivery/providers";
import type { DeliveryRequest } from "@/lib/invitation-delivery/types";

const baseRequest: DeliveryRequest = {
  channel: "WHATSAPP",
  recipient: { name: "Ayu", phone: "081234567890", email: null },
  message: { text: "Halo Ayu!", url: "https://example.com/invite/x?to=y" },
};

describe("getDeliveryProvider", () => {
  it("returns null for every channel — no real provider is registered", () => {
    expect(getDeliveryProvider("WHATSAPP")).toBeNull();
    expect(getDeliveryProvider("EMAIL")).toBeNull();
  });
});

describe("attemptDelivery", () => {
  it("fails honestly with a clear message when no provider is configured, for every channel", async () => {
    const whatsappResult = await attemptDelivery(baseRequest);
    expect(whatsappResult.ok).toBe(false);

    const emailResult = await attemptDelivery({ ...baseRequest, channel: "EMAIL" });
    expect(emailResult.ok).toBe(false);
  });

  it("never throws, even for an unconfigured channel", async () => {
    await expect(attemptDelivery(baseRequest)).resolves.not.toThrow();
  });
});

describe("InvitationDeliveryProvider interface", () => {
  it("can be implemented by a future provider without any change to this module", async () => {
    const fakeProvider: InvitationDeliveryProvider = {
      channel: "WHATSAPP",
      async send() {
        return { ok: true, providerMessageId: "test-message-id" };
      },
    };

    const result = await fakeProvider.send(baseRequest);
    expect(result).toEqual({ ok: true, providerMessageId: "test-message-id" });
  });
});
