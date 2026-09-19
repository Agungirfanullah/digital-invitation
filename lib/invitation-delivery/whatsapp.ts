import { phoneDigits } from "@/lib/guests/normalize";

/**
 * Builds a `wa.me` deep link that opens the *user's own* WhatsApp client
 * (app or web) with the message pre-filled. This is not a provider
 * integration and never transmits anything itself — the actual send
 * action is performed by the person operating the dashboard, tapping
 * "Send" inside their own WhatsApp client, exactly like `docs/PRD.md`
 * §32's "Open WhatsApp" action. Returns `null` when the guest has no
 * usable phone number rather than building a broken link.
 */
export function buildWhatsAppShareUrl(phone: string, messageText: string): string | null {
  const digits = phoneDigits(phone);
  if (digits.length < 8) return null;

  return `https://wa.me/${digits}?text=${encodeURIComponent(messageText)}`;
}
