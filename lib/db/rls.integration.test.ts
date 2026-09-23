/**
 * Integration tests for the Supabase Data API lockdown (docs/DECISIONS.md
 * D-054), run against the real Supabase DEV Postgres database.
 *
 * The application never reads/writes tables through Supabase's Data API
 * (PostgREST / pg_graphql) — every table is accessed via Prisma as the
 * table-owning, BYPASSRLS role. These tests pin that contract down:
 * the Data API roles (`anon`, `authenticated`) must have no privileges and
 * no policies on any `public` table, every table (including ones added in
 * future migrations) must have RLS enabled, and the application's own
 * role must still bypass RLS so Prisma keeps working.
 *
 * Catalog metadata only — no application rows are read.
 */
import { describe, expect, it } from "vitest";

import { prisma } from "@/lib/db/prisma";

const DATA_API_ROLES = ["anon", "authenticated"] as const;
const TABLE_PRIVILEGES = [
  "SELECT",
  "INSERT",
  "UPDATE",
  "DELETE",
  "TRUNCATE",
  "REFERENCES",
  "TRIGGER",
] as const;

async function listPublicTables() {
  return prisma.$queryRaw<{ name: string; rls: boolean }[]>`
    SELECT c.relname AS name, c.relrowsecurity AS rls
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relkind IN ('r', 'p')
    ORDER BY c.relname`;
}

describe("Supabase Data API lockdown (integration — real Supabase DEV)", () => {
  it("the Data API roles exist (this suite targets a Supabase database)", async () => {
    const roles = await prisma.$queryRaw<{ rolname: string }[]>`
      SELECT rolname FROM pg_roles WHERE rolname IN ('anon', 'authenticated')`;
    expect(roles.map((r) => r.rolname).sort()).toEqual(["anon", "authenticated"]);
  });

  it("every public table has row level security enabled", async () => {
    const tables = await listPublicTables();
    expect(tables.length).toBeGreaterThan(0);
    expect(tables.filter((t) => !t.rls).map((t) => t.name)).toEqual([]);
  });

  it("no public table grants any privilege to anon or authenticated", async () => {
    // One catalog query for every (table, role, privilege) combination.
    const leaks = await prisma.$queryRaw<{ leak: string }[]>`
      SELECT r.role || ':' || p.privilege || ':' || c.relname AS leak
      FROM pg_class c
      JOIN pg_namespace n ON n.oid = c.relnamespace
      CROSS JOIN unnest(${[...DATA_API_ROLES]}::text[]) AS r(role)
      CROSS JOIN unnest(${[...TABLE_PRIVILEGES]}::text[]) AS p(privilege)
      WHERE n.nspname = 'public'
        AND c.relkind IN ('r', 'p')
        AND has_table_privilege(r.role, c.oid, p.privilege)
      ORDER BY 1`;

    expect(leaks.map((row) => row.leak)).toEqual([]);
  });

  it("no RLS policy exists on any public table (deny-all is the intended design)", async () => {
    const policies = await prisma.$queryRaw<{ tablename: string; policyname: string }[]>`
      SELECT tablename, policyname FROM pg_policies WHERE schemaname = 'public'`;
    expect(policies).toEqual([]);
  });

  it("tables created by the migration role in future do not inherit Data API grants", async () => {
    const defaults = await prisma.$queryRaw<{ acl: string }[]>`
      SELECT d.defaclacl::text AS acl
      FROM pg_default_acl d
      JOIN pg_namespace n ON n.oid = d.defaclnamespace
      WHERE n.nspname = 'public' AND d.defaclrole = (SELECT oid FROM pg_roles WHERE rolname = current_user)`;
    for (const { acl } of defaults) {
      expect(acl).not.toMatch(/(^|[{,])(anon|authenticated)=/);
    }
  });

  it("the anon role is actually refused when it queries a private table", async () => {
    await expect(
      prisma.$transaction(async (tx) => {
        await tx.$executeRawUnsafe(`SET LOCAL ROLE anon`);
        await tx.$queryRawUnsafe(`SELECT 1 FROM "GuestInvitation" LIMIT 1`);
      }),
    ).rejects.toThrow(/permission denied/i);
  });

  it("the application's own database role still bypasses RLS, so Prisma is unaffected", async () => {
    const [role] = await prisma.$queryRaw<{ bypass: boolean }[]>`
      SELECT (rolbypassrls OR rolsuper) AS bypass FROM pg_roles WHERE rolname = current_user`;
    expect(role.bypass).toBe(true);
  });
});
