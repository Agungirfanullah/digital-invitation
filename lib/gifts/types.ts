import type { GiftMethodType } from "@prisma/client";

/** Dashboard-facing shape — authenticated, event-scoped, never sent to the public invitation. */
export interface GiftMethodListItem {
  id: string;
  type: GiftMethodType;
  providerName: string | null;
  accountName: string | null;
  accountNumber: string | null;
  qrImageUrl: string | null;
  instructions: string | null;
  isActive: boolean;
  createdAt: Date;
}
