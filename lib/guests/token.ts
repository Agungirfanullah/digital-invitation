import "server-only";
import { randomBytes } from "node:crypto";

/**
 * Generates an opaque, cryptographically random invitation token — never a
 * sequential/guessable id (see docs/DATABASE.md §9, docs/CLAUDE.md §7.2).
 * 24 random bytes base64url-encoded yields a 32-character token, well
 * within `guestTokenSchema`'s accepted 10-128 char / `[A-Za-z0-9_-]` shape
 * (lib/invitations/token.ts), so tokens minted here resolve correctly
 * through the existing public personalization lookup unchanged.
 */
export function generateGuestToken(): string {
  return randomBytes(24).toString("base64url");
}
