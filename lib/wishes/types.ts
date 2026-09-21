import type { EventMemberRole, WishStatus } from "@prisma/client";

/**
 * Dashboard-facing shape — authenticated, event-scoped, never sent to the
 * public invitation. Includes `guestName` (via the `Wish → Guest`
 * relation) so a moderator can see who submitted a wish; the public DTO
 * (`lib/invitations/types.ts`'s `PublicWish`) never carries this.
 */
export interface WishListItem {
  id: string;
  guestName: string;
  name: string;
  message: string;
  status: WishStatus;
  createdAt: Date;
}

export interface WishModerationData {
  event: { id: string; title: string };
  role: EventMemberRole;
  wishes: WishListItem[];
  total: number;
  page: number;
  pageSize: number;
}

export type WishFormState =
  | { status: "idle" }
  | { status: "success" }
  | { status: "error"; error: string; fieldErrors?: Record<string, string[]> };
