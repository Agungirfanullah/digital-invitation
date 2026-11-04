import "server-only";
import { EventStatus, UserRole, type Prisma } from "@prisma/client";

import { deleteAccount } from "@/lib/account/service";
import { recordAudit } from "@/lib/audit/log";
import { prisma } from "@/lib/db/prisma";
import { getStorageProvider } from "@/lib/storage/provider";

/**
 * The admin panel's data access (D-107). Every function here assumes the
 * caller already passed `requireAdmin()`; the mutating ones take the acting
 * admin's id, refuse to act on that admin's own account, and write an
 * audit entry.
 */

export const ADMIN_PAGE_SIZE = 25;

export class AdminActionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AdminActionError";
  }
}

function pageArgs(page: number) {
  const safePage = Number.isFinite(page) && page > 0 ? Math.floor(page) : 1;
  return { skip: (safePage - 1) * ADMIN_PAGE_SIZE, take: ADMIN_PAGE_SIZE, page: safePage };
}

export async function getAdminOverview() {
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const [users, newUsers, suspended, events, published, guests, rsvps, wishes] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { createdAt: { gte: weekAgo } } }),
    prisma.user.count({ where: { suspendedAt: { not: null } } }),
    prisma.event.count(),
    prisma.event.count({ where: { status: EventStatus.PUBLISHED } }),
    prisma.guest.count(),
    prisma.rSVP.count(),
    prisma.wish.count(),
  ]);
  const recentAudit = await listAuditLogs({ page: 1, take: 8 });
  return {
    users,
    newUsers,
    suspended,
    events,
    published,
    guests,
    rsvps,
    wishes,
    recentAudit: recentAudit.rows,
  };
}

export async function listUsers({ q, page }: { q?: string; page: number }) {
  const { skip, take, page: current } = pageArgs(page);
  const where: Prisma.UserWhereInput = q
    ? {
        OR: [
          { email: { contains: q, mode: "insensitive" } },
          { name: { contains: q, mode: "insensitive" } },
        ],
      }
    : {};
  const [rows, total] = await Promise.all([
    prisma.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        suspendedAt: true,
        createdAt: true,
        _count: { select: { ownedEvents: true } },
      },
    }),
    prisma.user.count({ where }),
  ]);
  return { rows, total, page: current, pages: Math.max(1, Math.ceil(total / ADMIN_PAGE_SIZE)) };
}

export async function getUserDetail(userId: string) {
  return prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      suspendedAt: true,
      createdAt: true,
      ownedEvents: {
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          title: true,
          slug: true,
          status: true,
          createdAt: true,
          _count: { select: { guests: true } },
        },
      },
      _count: { select: { eventMemberships: true } },
    },
  });
}

async function loadTarget(adminId: string, userId: string) {
  if (adminId === userId) {
    throw new AdminActionError("Akunmu sendiri tidak bisa diubah dari panel admin.");
  }
  const target = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, role: true },
  });
  if (!target) throw new AdminActionError("Pengguna tidak ditemukan.");
  return target;
}

export async function setUserRole(adminId: string, userId: string, role: UserRole) {
  const target = await loadTarget(adminId, userId);
  if (target.role === role) return;
  if (target.role === UserRole.ADMIN && role !== UserRole.ADMIN) {
    const admins = await prisma.user.count({ where: { role: UserRole.ADMIN } });
    if (admins <= 1) throw new AdminActionError("Harus ada minimal satu admin.");
  }
  await prisma.user.update({ where: { id: userId }, data: { role } });
  await recordAudit({
    userId: adminId,
    action: "admin.set_role",
    resourceType: "user",
    resourceId: userId,
    metadata: { from: target.role, to: role },
  });
}

export async function setUserSuspended(adminId: string, userId: string, suspended: boolean) {
  await loadTarget(adminId, userId);
  await prisma.user.update({
    where: { id: userId },
    data: { suspendedAt: suspended ? new Date() : null },
  });
  await recordAudit({
    userId: adminId,
    action: suspended ? "admin.suspend_user" : "admin.unsuspend_user",
    resourceType: "user",
    resourceId: userId,
  });
}

export async function adminDeleteUser(adminId: string, userId: string) {
  const target = await loadTarget(adminId, userId);
  if (target.role === UserRole.ADMIN) {
    throw new AdminActionError("Turunkan role admin pengguna ini dulu sebelum menghapusnya.");
  }
  await deleteAccount(userId);
  await recordAudit({
    userId: adminId,
    action: "admin.delete_user",
    resourceType: "user",
    resourceId: userId,
  });
}

export async function listEvents({
  q,
  status,
  page,
}: {
  q?: string;
  status?: EventStatus;
  page: number;
}) {
  const { skip, take, page: current } = pageArgs(page);
  const where: Prisma.EventWhereInput = {
    ...(status ? { status } : {}),
    ...(q
      ? {
          OR: [
            { title: { contains: q, mode: "insensitive" } },
            { slug: { contains: q, mode: "insensitive" } },
            { owner: { email: { contains: q, mode: "insensitive" } } },
          ],
        }
      : {}),
  };
  const [rows, total] = await Promise.all([
    prisma.event.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take,
      select: {
        id: true,
        title: true,
        slug: true,
        type: true,
        status: true,
        createdAt: true,
        owner: { select: { id: true, email: true } },
        _count: { select: { guests: true } },
      },
    }),
    prisma.event.count({ where }),
  ]);
  return { rows, total, page: current, pages: Math.max(1, Math.ceil(total / ADMIN_PAGE_SIZE)) };
}

/** Takes an invitation offline (e.g. reported abuse). Publishing stays the owner's decision. */
export async function adminUnpublishEvent(adminId: string, eventId: string) {
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    select: { slug: true, status: true },
  });
  if (!event) throw new AdminActionError("Acara tidak ditemukan.");
  if (event.status !== EventStatus.PUBLISHED) return;
  await prisma.event.update({ where: { id: eventId }, data: { status: EventStatus.DRAFT } });
  await recordAudit({
    userId: adminId,
    action: "admin.unpublish_event",
    resourceType: "event",
    resourceId: eventId,
    metadata: { slug: event.slug },
  });
}

export async function adminDeleteEvent(adminId: string, eventId: string) {
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    select: { slug: true, title: true, ownerId: true },
  });
  if (!event) throw new AdminActionError("Acara tidak ditemukan.");
  const transactions = await prisma.giftTransaction.count({ where: { eventId } });
  if (transactions > 0) {
    throw new AdminActionError("Acara ini punya catatan transaksi hadiah dan tidak bisa dihapus.");
  }
  await prisma.event.delete({ where: { id: eventId } });
  await recordAudit({
    userId: adminId,
    action: "admin.delete_event",
    resourceType: "event",
    resourceId: eventId,
    metadata: { slug: event.slug, title: event.title, ownerId: event.ownerId },
  });
  try {
    await getStorageProvider().removeFolder(`events/${eventId}`);
  } catch (error) {
    console.error(
      JSON.stringify({
        level: "error",
        event: "admin_delete_event_storage_failed",
        eventId,
        message: error instanceof Error ? error.message : String(error),
      }),
    );
  }
}

export async function listTemplates() {
  const [templates, usage] = await Promise.all([
    prisma.template.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true, slug: true, category: true, isActive: true },
    }),
    prisma.event.groupBy({ by: ["templateId"], _count: { _all: true } }),
  ]);
  const counts = new Map(usage.map((row) => [row.templateId, row._count._all]));
  return templates.map((template) => ({ ...template, events: counts.get(template.id) ?? 0 }));
}

/** An inactive template disappears from the editor's choices; events already using it keep it. */
export async function setTemplateActive(adminId: string, templateId: string, active: boolean) {
  const template = await prisma.template.findUnique({
    where: { id: templateId },
    select: { slug: true },
  });
  if (!template) throw new AdminActionError("Template tidak ditemukan.");
  await prisma.template.update({ where: { id: templateId }, data: { isActive: active } });
  await recordAudit({
    userId: adminId,
    action: "admin.set_template_active",
    resourceType: "template",
    resourceId: templateId,
    metadata: { slug: template.slug, active },
  });
}

export async function listAuditLogs({
  action,
  page,
  take: takeOverride,
}: {
  action?: string;
  page: number;
  take?: number;
}) {
  const { skip, take, page: current } = pageArgs(page);
  const where: Prisma.AuditLogWhereInput = action ? { action } : {};
  const [rows, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: takeOverride ?? take,
      select: {
        id: true,
        action: true,
        resourceType: true,
        resourceId: true,
        metadata: true,
        createdAt: true,
        user: { select: { email: true } },
      },
    }),
    prisma.auditLog.count({ where }),
  ]);
  return { rows, total, page: current, pages: Math.max(1, Math.ceil(total / ADMIN_PAGE_SIZE)) };
}
