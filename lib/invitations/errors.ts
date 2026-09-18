import "server-only";

/**
 * Thrown for both "no event at this slug" and "event exists but isn't
 * publicly visible" — deliberately indistinguishable to callers, same
 * reasoning as `lib/events/errors.ts`'s `EventNotFoundError`: an attacker
 * probing slugs must not be able to tell a private event apart from a
 * nonexistent one.
 */
export class InvitationNotFoundError extends Error {
  constructor() {
    super("Invitation not found or not publicly accessible");
    this.name = "InvitationNotFoundError";
  }
}
