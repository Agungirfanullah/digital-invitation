import "server-only";
import type { Prisma } from "@prisma/client";

import { prisma } from "@/lib/db/prisma";

/**
 * Actions written to `AuditLog`: security-relevant or destructive changes
 * worth tracing later ("who unpublished this?", "who deleted that?"). Not
 * every edit; ordinary autosaves are not logged.
 */
export type AuditAction =
  | "event.publish"
  | "event.unpublish"
  | "event.delete"
  | "guest.delete"
  | "guest.import"
  | "account.update_profile"
  | "account.change_password"
  | "account.delete"
  | "admin.set_role"
  | "admin.suspend_user"
  | "admin.unsuspend_user"
  | "admin.delete_user"
  | "admin.publish_event"
  | "admin.unpublish_event"
  | "admin.delete_event"
  | "admin.set_template_active";

export interface AuditEntry {
  /** Who did it; null for a system action or an account already deleted. */
  userId: string | null;
  action: AuditAction;
  resourceType: "event" | "guest" | "user" | "template";
  resourceId: string | null;
  /**
   * Small, non-sensitive context (counts, slugs, old/new role). Never guest
   * contact details, tokens or passwords.
   */
  metadata?: Prisma.InputJsonValue;
}

/**
 * Records one audit entry. Best-effort: the action it describes has already
 * happened, so a failure to log is reported to the server log and never
 * undoes or fails the user's action.
 */
export async function recordAudit(entry: AuditEntry): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        userId: entry.userId,
        action: entry.action,
        resourceType: entry.resourceType,
        resourceId: entry.resourceId,
        metadata: entry.metadata,
      },
    });
  } catch (error) {
    console.error(
      JSON.stringify({
        level: "error",
        event: "audit_log_failed",
        action: entry.action,
        message: error instanceof Error ? error.message : String(error),
      }),
    );
  }
}
