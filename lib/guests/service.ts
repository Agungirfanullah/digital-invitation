import "server-only";
import { EventMemberRole, GuestCategory, Prisma } from "@prisma/client";

import { prisma } from "@/lib/db/prisma";
import { getAuthorizedEvent } from "@/lib/events/authorization";
import { CsvTooLargeError, EventNotFoundError, GuestNotFoundError } from "@/lib/guests/errors";
import { GUEST_CATEGORY_LABELS } from "@/lib/guests/labels";
import { normalizeGuestName, phoneDigits } from "@/lib/guests/normalize";
import { generateGuestToken } from "@/lib/guests/token";
import { parseCsv, toCsv } from "@/lib/guests/csv";
import {
  guestCsvRowSchema,
  MAX_CSV_LENGTH,
  MAX_CSV_ROWS,
  type GuestCsvRowInput,
  type GuestInput,
  type GuestListQueryInput,
} from "@/lib/guests/validation";
import type {
  CsvImportPreview,
  CsvImportRowResult,
  CsvImportSummary,
  GuestDetail,
  GuestListItem,
} from "@/lib/guests/types";

export const GUEST_PAGE_SIZE = 25;

const GUEST_SELECT = {
  id: true,
  name: true,
  phone: true,
  email: true,
  category: true,
  seatQuota: true,
  notes: true,
  createdAt: true,
  invitations: { select: { token: true, status: true } },
} satisfies Prisma.GuestSelect;

type GuestRow = Prisma.GuestGetPayload<{ select: typeof GUEST_SELECT }>;

/** Every guest is created together with exactly one `GuestInvitation` (see `createGuestWithInvitation`) — this invariant is what makes `invitations[0]` safe here. */
function toListItem(guest: GuestRow): GuestListItem {
  const invitation = guest.invitations[0];
  if (!invitation) {
    throw new Error(`Guest ${guest.id} is missing its invitation row — data invariant violated`);
  }

  return {
    id: guest.id,
    name: guest.name,
    phone: guest.phone,
    email: guest.email,
    category: guest.category,
    seatQuota: guest.seatQuota,
    notes: guest.notes,
    createdAt: guest.createdAt,
    invitationToken: invitation.token,
    invitationStatus: invitation.status,
  };
}

function isUniqueConstraintError(error: unknown, target: string): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002" &&
    (Array.isArray(error.meta?.target)
      ? (error.meta.target as string[]).includes(target)
      : error.meta?.target === target)
  );
}

function resolveRole(
  event: { ownerId: string; members: { role: EventMemberRole }[] },
  userId: string,
): EventMemberRole {
  if (event.ownerId === userId) return EventMemberRole.OWNER;
  return event.members[0]?.role ?? EventMemberRole.VIEWER;
}

interface NewGuestData {
  name: string;
  phone: string | null;
  email: string | null;
  category: GuestCategory;
  seatQuota: number;
  notes: string | null;
}

const MAX_TOKEN_ATTEMPTS = 5;

/**
 * Creates a `Guest` and its `GuestInvitation` atomically (one transaction
 * per guest) — every guest must always have exactly one opaque invitation
 * token from the moment it exists, per docs/DATABASE.md §9 ("never use
 * guest database ID as public invitation token"). Retries with a freshly
 * generated token on the astronomically unlikely event of a token
 * collision (192 bits of randomness); a Postgres transaction can't
 * continue after a failed statement, so the retry re-runs the whole
 * transaction rather than reusing it.
 */
async function createGuestWithInvitation(
  eventId: string,
  data: NewGuestData,
): Promise<GuestListItem> {
  const normalizedName = normalizeGuestName(data.name);

  for (let attempt = 1; attempt <= MAX_TOKEN_ATTEMPTS; attempt += 1) {
    const token = generateGuestToken();
    try {
      const result = await prisma.$transaction(async (tx) => {
        const guest = await tx.guest.create({
          data: {
            eventId,
            name: data.name,
            normalizedName,
            phone: data.phone,
            email: data.email,
            category: data.category,
            seatQuota: data.seatQuota,
            notes: data.notes,
          },
        });
        const invitation = await tx.guestInvitation.create({
          data: { eventId, guestId: guest.id, token },
        });
        return { guest, invitation };
      });

      return toListItem({ ...result.guest, invitations: [result.invitation] });
    } catch (error) {
      if (isUniqueConstraintError(error, "token") && attempt < MAX_TOKEN_ATTEMPTS) continue;
      throw error;
    }
  }

  throw new Error("Unreachable: exhausted token generation attempts");
}

export interface GuestPageData {
  event: { id: string; title: string; slug: string };
  role: EventMemberRole;
  guests: GuestListItem[];
  total: number;
  page: number;
  pageSize: number;
}

/** VIEWER-and-above read access — the roadmap's guest list/search/filter/sort is a read surface, not just an EDITOR one. Mutation actions below all require EDITOR. */
export async function getGuestPageData(
  eventId: string,
  userId: string,
  query: GuestListQueryInput,
): Promise<GuestPageData> {
  const event = await getAuthorizedEvent(eventId, userId, EventMemberRole.VIEWER);
  if (!event) throw new EventNotFoundError();

  const where: Prisma.GuestWhereInput = { eventId };
  if (query.category !== "ALL") where.category = query.category;
  if (query.q) {
    where.OR = [
      { name: { contains: query.q, mode: "insensitive" } },
      { phone: { contains: query.q, mode: "insensitive" } },
      { email: { contains: query.q, mode: "insensitive" } },
    ];
  }

  const orderBy: Prisma.GuestOrderByWithRelationInput =
    query.sort === "name_asc"
      ? { name: "asc" }
      : query.sort === "name_desc"
        ? { name: "desc" }
        : query.sort === "oldest"
          ? { createdAt: "asc" }
          : { createdAt: "desc" };

  const [total, guests] = await Promise.all([
    prisma.guest.count({ where }),
    prisma.guest.findMany({
      where,
      orderBy,
      skip: (query.page - 1) * GUEST_PAGE_SIZE,
      take: GUEST_PAGE_SIZE,
      select: GUEST_SELECT,
    }),
  ]);

  return {
    event: { id: event.id, title: event.title, slug: event.slug },
    role: resolveRole(event, userId),
    guests: guests.map(toListItem),
    total,
    page: query.page,
    pageSize: GUEST_PAGE_SIZE,
  };
}

/** EDITOR-and-above — used to prefill the edit form. Throws `GuestNotFoundError` for a guest id that doesn't exist or belongs to a different event (IDOR-safe: identical to "doesn't exist" from the caller's view). */
export async function getGuestForEditor(
  eventId: string,
  userId: string,
  guestId: string,
): Promise<GuestDetail> {
  const event = await getAuthorizedEvent(eventId, userId, EventMemberRole.EDITOR);
  if (!event) throw new EventNotFoundError();

  const guest = await prisma.guest.findFirst({
    where: { id: guestId, eventId },
    select: GUEST_SELECT,
  });
  if (!guest) throw new GuestNotFoundError();

  return { eventId, ...toListItem(guest) };
}

export async function createGuestForUser(
  eventId: string,
  userId: string,
  input: GuestInput,
): Promise<GuestListItem> {
  const event = await getAuthorizedEvent(eventId, userId, EventMemberRole.EDITOR);
  if (!event) throw new EventNotFoundError();

  return createGuestWithInvitation(eventId, input);
}

/** Re-verifies `{ id: guestId, eventId }` before updating — never `guest.update({ where: { id } })` alone, which would let a caller mutate another event's guest merely by knowing its id. */
export async function updateGuestForUser(
  eventId: string,
  userId: string,
  guestId: string,
  input: GuestInput,
): Promise<GuestListItem> {
  const event = await getAuthorizedEvent(eventId, userId, EventMemberRole.EDITOR);
  if (!event) throw new EventNotFoundError();

  const existing = await prisma.guest.findFirst({
    where: { id: guestId, eventId },
    select: { id: true },
  });
  if (!existing) throw new GuestNotFoundError();

  const guest = await prisma.guest.update({
    where: { id: guestId },
    data: {
      name: input.name,
      normalizedName: normalizeGuestName(input.name),
      phone: input.phone,
      email: input.email,
      category: input.category,
      seatQuota: input.seatQuota,
      notes: input.notes,
    },
    select: GUEST_SELECT,
  });

  return toListItem(guest);
}

export async function deleteGuestForUser(
  eventId: string,
  userId: string,
  guestId: string,
): Promise<void> {
  const event = await getAuthorizedEvent(eventId, userId, EventMemberRole.EDITOR);
  if (!event) throw new EventNotFoundError();

  const existing = await prisma.guest.findFirst({
    where: { id: guestId, eventId },
    select: { id: true },
  });
  if (!existing) throw new GuestNotFoundError();

  // Cascades GuestInvitation/RSVP/Wish/CheckIn/etc. — enforced at the
  // database level via `onDelete: Cascade` (see prisma/schema.prisma).
  await prisma.guest.delete({ where: { id: guestId } });
}

const CSV_HEADER = ["nama", "telepon", "email", "kategori", "kuota", "catatan"];

const CSV_CATEGORY_LABEL_TO_VALUE: Record<string, string> = {
  keluarga: "FAMILY",
  teman: "FRIEND",
  "rekan kerja": "COLLEAGUE",
  vip: "VIP",
  lainnya: "OTHER",
  family: "FAMILY",
  friend: "FRIEND",
  colleague: "COLLEAGUE",
  other: "OTHER",
};

function resolveCategoryCell(raw: string): string {
  if (!raw.trim()) return "";
  const key = raw.trim().toLowerCase();
  return CSV_CATEGORY_LABEL_TO_VALUE[key] ?? raw.trim().toUpperCase();
}

function looksLikeHeaderRow(row: string[]): boolean {
  const normalized = row.map((cell) => cell.trim().toLowerCase());
  return CSV_HEADER.some((column) => normalized.includes(column));
}

interface CsvPreviewResult {
  preview: CsvImportPreview;
  importableRows: GuestCsvRowInput[];
}

/**
 * Shared by `previewGuestImport` and `confirmGuestImport` — confirm always
 * re-derives this from the raw CSV text rather than trusting a
 * client-held "already validated" flag from the preview step, so a
 * tampered/replayed confirm request can't smuggle in unvalidated rows.
 */
async function buildCsvPreview(eventId: string, csvText: string): Promise<CsvPreviewResult> {
  if (csvText.length > MAX_CSV_LENGTH) throw new CsvTooLargeError();

  const table = parseCsv(csvText.trim());
  if (table.length === 0) {
    return {
      preview: { rows: [], importableCount: 0, duplicateCount: 0, invalidCount: 0 },
      importableRows: [],
    };
  }

  const dataRows = looksLikeHeaderRow(table[0]) ? table.slice(1) : table;
  if (dataRows.length > MAX_CSV_ROWS) throw new CsvTooLargeError();

  const existingGuests = await prisma.guest.findMany({
    where: { eventId },
    select: { normalizedName: true, phone: true },
  });
  const existingNames = new Set(existingGuests.map((g) => g.normalizedName));
  const existingPhones = new Set(
    existingGuests
      .filter((g): g is typeof g & { phone: string } => !!g.phone)
      .map((g) => phoneDigits(g.phone)),
  );
  const seenNamesInFile = new Set<string>();
  const seenPhonesInFile = new Set<string>();

  const rows: CsvImportRowResult[] = [];
  const importableRows: GuestCsvRowInput[] = [];

  dataRows.forEach((cells, index) => {
    const rowNumber = index + 1;
    const [
      rawName = "",
      rawPhone = "",
      rawEmail = "",
      rawCategory = "",
      rawSeatQuota = "",
      rawNotes = "",
    ] = cells;

    const parsed = guestCsvRowSchema.safeParse({
      name: rawName,
      phone: rawPhone || null,
      email: rawEmail || null,
      category: resolveCategoryCell(rawCategory) || null,
      seatQuota: rawSeatQuota || null,
      notes: rawNotes || null,
    });

    if (!parsed.success) {
      rows.push({
        rowNumber,
        name: rawName || null,
        phone: rawPhone || null,
        email: rawEmail || null,
        category: null,
        seatQuota: null,
        notes: rawNotes || null,
        status: "invalid",
        errors: [...new Set(parsed.error.issues.map((issue) => issue.message))],
      });
      return;
    }

    const normalizedName = normalizeGuestName(parsed.data.name);
    const digits = parsed.data.phone ? phoneDigits(parsed.data.phone) : null;
    const isDuplicate =
      existingNames.has(normalizedName) ||
      seenNamesInFile.has(normalizedName) ||
      (digits !== null && (existingPhones.has(digits) || seenPhonesInFile.has(digits)));

    if (isDuplicate) {
      rows.push({
        rowNumber,
        name: parsed.data.name,
        phone: parsed.data.phone,
        email: parsed.data.email,
        category: parsed.data.category,
        seatQuota: parsed.data.seatQuota,
        notes: parsed.data.notes,
        status: "duplicate",
        errors: ["Nama atau nomor telepon sudah terdaftar di acara ini."],
      });
      return;
    }

    seenNamesInFile.add(normalizedName);
    if (digits !== null) seenPhonesInFile.add(digits);

    rows.push({
      rowNumber,
      name: parsed.data.name,
      phone: parsed.data.phone,
      email: parsed.data.email,
      category: parsed.data.category,
      seatQuota: parsed.data.seatQuota,
      notes: parsed.data.notes,
      status: "valid",
      errors: [],
    });
    importableRows.push(parsed.data);
  });

  return {
    preview: {
      rows,
      importableCount: importableRows.length,
      duplicateCount: rows.filter((row) => row.status === "duplicate").length,
      invalidCount: rows.filter((row) => row.status === "invalid").length,
    },
    importableRows,
  };
}

export async function previewGuestImport(
  eventId: string,
  userId: string,
  csvText: string,
): Promise<CsvImportPreview> {
  const event = await getAuthorizedEvent(eventId, userId, EventMemberRole.EDITOR);
  if (!event) throw new EventNotFoundError();

  const { preview } = await buildCsvPreview(eventId, csvText);
  return preview;
}

/**
 * Each importable row's `Guest` + `GuestInvitation` is created in its own
 * transaction (via `createGuestWithInvitation`), not the whole batch as
 * one transaction — a token-collision retry needs a fresh transaction
 * scope (Postgres won't let a transaction continue after a failed
 * statement). A mid-batch failure therefore leaves already-created rows
 * persisted rather than rolling back the entire import; every row was
 * already individually validated and deduplicated before this runs, so
 * that failure path is expected to be rare.
 */
export async function confirmGuestImport(
  eventId: string,
  userId: string,
  csvText: string,
): Promise<CsvImportSummary> {
  const event = await getAuthorizedEvent(eventId, userId, EventMemberRole.EDITOR);
  if (!event) throw new EventNotFoundError();

  const { preview, importableRows } = await buildCsvPreview(eventId, csvText);

  for (const row of importableRows) {
    await createGuestWithInvitation(eventId, row);
  }

  return {
    imported: importableRows.length,
    skippedDuplicates: preview.duplicateCount,
    skippedInvalid: preview.invalidCount,
  };
}

/** VIEWER-and-above, same read boundary as `getGuestPageData`. Invitation tokens are intentionally excluded from the export — they're a personalization secret, not guest-list data. */
export async function exportGuestsToCsv(
  eventId: string,
  userId: string,
): Promise<{ filename: string; csv: string }> {
  const event = await getAuthorizedEvent(eventId, userId, EventMemberRole.VIEWER);
  if (!event) throw new EventNotFoundError();

  const guests = await prisma.guest.findMany({
    where: { eventId },
    orderBy: { name: "asc" },
    select: { name: true, phone: true, email: true, category: true, seatQuota: true, notes: true },
  });

  const rows = guests.map((guest) => [
    guest.name,
    guest.phone ?? "",
    guest.email ?? "",
    GUEST_CATEGORY_LABELS[guest.category],
    String(guest.seatQuota),
    guest.notes ?? "",
  ]);

  return { filename: `tamu-${event.slug}.csv`, csv: toCsv([CSV_HEADER, ...rows]) };
}
