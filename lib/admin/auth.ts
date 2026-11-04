import "server-only";
import { notFound } from "next/navigation";
import { UserRole, type User } from "@prisma/client";

import { requireAppUser } from "@/lib/auth/session";

/**
 * The admin panel's gate (D-107): signed in, not suspended, role ADMIN.
 * Anyone else gets a plain 404, so the panel's existence is not revealed.
 * Every admin page and action calls this; hiding the menu item is not a
 * security boundary.
 */
export async function requireAdmin(): Promise<User> {
  const user = await requireAppUser();
  if (user.role !== UserRole.ADMIN) notFound();
  return user;
}
