import { afterEach, describe, expect, it, vi } from "vitest";

import {
  DeliveryChannelNotConfiguredError,
  mapDeliveryErrorMessage,
} from "@/lib/invitation-delivery/errors";

describe("mapDeliveryErrorMessage", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("maps DeliveryChannelNotConfiguredError to an Indonesian message pointing to manual copy/link", () => {
    expect(mapDeliveryErrorMessage(new DeliveryChannelNotConfiguredError("WHATSAPP"))).toMatch(
      /salin tautan\/pesan/i,
    );
  });

  it("falls back to a generic message and logs unexpected errors without leaking details", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => undefined);

    const message = mapDeliveryErrorMessage(new Error("some internal provider detail"));

    expect(message).not.toMatch(/internal provider detail/i);
    expect(message).toMatch(/kesalahan/i);
    expect(spy).toHaveBeenCalled();
  });
});
