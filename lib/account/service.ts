import "server-only";

import { recordAudit } from "@/lib/audit/log";
import { prisma } from "@/lib/db/prisma";
import { getStorageProvider } from "@/lib/storage/provider";
import { createSupabaseServiceClient } from "@/lib/supabase/server";

/** Records (gift payments, subscriptions) that must outlive the account block deletion. */
export class AccountDeleteBlockedError extends Error {
  constructor() {
    super("Account has records that cannot be deleted");
    this.name = "AccountDeleteBlockedError";
  }
}

export async function updateAccountName(userId: string, name: string): Promise<void> {
  await prisma.user.update({ where: { id: userId }, data: { name } });
  await recordAudit({
    userId,
    action: "account.update_profile",
    resourceType: "user",
    resourceId: userId,
  });
}

/**
 * Deletes the account and everything it owns: the owner's events (with
 * their guests, RSVPs, wishes, photos and other cascading rows), their
 * uploaded files, memberships in other people's events, and the login.
 *
 * Financial records are never deleted with an account (they are
 * `onDelete: Restrict`), so an account holding any is refused with
 * `AccountDeleteBlockedError` before anything is removed.
 *
 * Order: database first (one transaction), then files and the login. A
 * failure after the transaction is logged, not shown: the person's data is
 * already gone, which is what they asked for.
 */
export async function deleteAccount(userId: string): Promise<void> {
  const ownedEvents = await prisma.event.findMany({
    where: { ownerId: userId },
    select: { id: true },
  });
  const eventIds = ownedEvents.map((event) => event.id);

  const [payments, subscriptions, giftTransactions] = await Promise.all([
    prisma.payment.count({ where: { userId } }),
    prisma.subscription.count({ where: { userId } }),
    prisma.giftTransaction.count({ where: { eventId: { in: eventIds } } }),
  ]);
  if (payments + subscriptions + giftTransactions > 0) throw new AccountDeleteBlockedError();

  await prisma.$transaction(async (tx) => {
    await tx.event.deleteMany({ where: { ownerId: userId } });
    await tx.user.delete({ where: { id: userId } });
  });

  // The audit row keeps no user link (the user is gone) but says what happened.
  await recordAudit({
    userId: null,
    action: "account.delete",
    resourceType: "user",
    resourceId: userId,
    metadata: { deletedEvents: eventIds.length },
  });

  const storage = getStorageProvider();
  for (const eventId of eventIds) {
    try {
      await storage.removeFolder(`events/${eventId}`);
    } catch (error) {
      logCleanupFailure("storage", userId, error);
    }
  }

  try {
    const { error } = await createSupabaseServiceClient().auth.admin.deleteUser(userId);
    if (error) logCleanupFailure("auth", userId, error);
  } catch (error) {
    // The client also throws (instead of returning an error) for some inputs.
    logCleanupFailure("auth", userId, error);
  }
}

function logCleanupFailure(step: string, userId: string, error: unknown) {
  console.error(
    JSON.stringify({
      level: "error",
      event: "account_delete_cleanup_failed",
      step,
      userId,
      message: error instanceof Error ? error.message : String(error),
    }),
  );
}
