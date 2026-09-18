# Project Status

This is a living engineering status summary. It is not a substitute for
the PRD, Architecture, Database Design, or Roadmap.

## Current State

**Project:** Digital Invitation SaaS

**Architecture:** Next.js 16 (App Router) + TypeScript + Prisma + Supabase
PostgreSQL + Supabase Storage + Vercel

**Development Mode:** Autonomous Claude Code agentic execution

**Current Phase:** Phase 0 --- Foundation

**Status:** Application scaffold implemented and verified locally
(typecheck/lint/format/unit tests/build/e2e all passing). Live connectivity
to the Supabase DEV database is blocked on a missing credential --- see
"Known Blockers".

## Documentation Baseline

-   [x] `CLAUDE.md`
-   [x] `docs/PRD.md`
-   [x] `docs/ARCHITECTURE.md`
-   [x] `docs/DATABASE.md`
-   [x] `docs/ROADMAP.md`
-   [x] `docs/AGENT_EXECUTION.md`
-   [x] `docs/DECISIONS.md`
-   [x] `docs/STATUS.md`

## Infrastructure Baseline

``` text
GitHub
  ↓
Vercel
  ↓
Next.js
  ↓
Prisma
  ↓
Supabase PostgreSQL
```

Additional services:

``` text
Supabase Storage
Supabase Auth
External providers
```

Local development requires Node.js 20.9+, npm, and Git. Local PostgreSQL
and Docker are not required — the app connects to the hosted Supabase DEV
project via `DATABASE_URL`/`DIRECT_URL`.

## Phase 0 --- Foundation

**Status:** Implemented and verified, except live database connectivity
(blocked — see below).

-   [x] Next.js 16 app bootstrapped at the repo root (App Router, TypeScript,
    Tailwind CSS v4)
-   [x] TypeScript configured (`tsconfig.json`, strict mode)
-   [x] Tailwind CSS v4 + design tokens (`app/globals.css`)
-   [x] shadcn/ui foundation (`components.json`, `lib/utils.ts`,
    `components/ui/button.tsx`) — implemented with the standard
    Radix/CVA primitives rather than the CLI's newest experimental
    `base-nova`/`@base-ui` default, to keep the foundation on
    well-established, production-proven tooling
-   [x] ESLint configured (`eslint-config-next` + `eslint-config-prettier`)
-   [x] Prettier configured (`.prettierrc.json`, `format`/`format:check`
    scripts)
-   [x] Prisma installed and configured for PostgreSQL via
    `DATABASE_URL`/`DIRECT_URL` (`prisma.config.ts`, serverless-safe
    client singleton at `lib/db/prisma.ts`)
-   [x] Full Prisma schema authored from `docs/DATABASE.md`
    (`prisma/schema.prisma`) — validated successfully; not yet migrated
    against Supabase (blocked, see below)
-   [x] Seed script for reference/catalog data — Templates and Plans only
    (`prisma/seed.ts`); User/Event/Guest/RSVP fixtures intentionally
    deferred to the phases that introduce those features
-   [x] Zod environment validation (`lib/env.ts`, unit tested)
-   [x] Supabase client boundary for Storage/Auth
    (`lib/supabase/server.ts`, `lib/supabase/client.ts`) — connection
    setup only, no upload/auth business logic yet (that lands with the
    phases that need it)
-   [x] Vitest configured, 2 test files / 10 tests passing
-   [x] Playwright configured, 1 e2e smoke test passing
-   [x] `.env.example` reviewed against actual usage — already accurate,
    left as-is
-   [x] GitHub Actions workflow fixed: was at `.github/workflow/` (not
    discoverable by GitHub Actions, which requires `.github/workflows/`)
    — moved via `git mv`, no content changes
-   [x] `npm run typecheck` — **PASS**
-   [x] `npm run lint` — **PASS**
-   [x] `npm run format:check` — **PASS**
-   [x] `npm run test` (Vitest) — **PASS** (10/10)
-   [x] `npm run build` (Next.js production build) — **PASS**
-   [x] `npm run test:e2e` (Playwright) — **PASS** (1/1)
-   [x] `npx prisma validate` — **PASS**
-   [x] `npx prisma generate` — **PASS**
-   [ ] `npx prisma migrate dev` against Supabase DEV — **BLOCKED** (see
    Known Blockers)
-   [ ] Verify Vercel compatibility — not yet deployed; no Vercel-specific
    APIs used, static build succeeds locally

## Phase 1 --- Authentication

-   [ ] Register
-   [ ] Login
-   [ ] Logout
-   [ ] Session handling
-   [ ] Password recovery
-   [ ] Protected dashboard
-   [ ] User/application-user mapping
-   [ ] Authorization tests

## Phase 2 --- Event Management

-   [ ] Event CRUD
-   [ ] Event ownership
-   [ ] Event types
-   [ ] Dashboard event list
-   [ ] Event settings
-   [ ] Authorization tests

## Later Phases

Follow `docs/ROADMAP.md`. Do not mark later phases complete here without
implementation and verification evidence.

## Known Blockers

### Supabase DEV database credential missing (blocks live DB verification)

`.env.local` has real Supabase project URL, anon key, and service role key
configured, but `DATABASE_URL` and `DIRECT_URL` still contain the literal
placeholder `<SUPABASE_DB_PASSWORD>` instead of the actual database
password. Confirmed via `npx prisma migrate status`:

```
Error: P1000: Authentication failed against database server, the provided
database credentials for `postgres` are not valid.
```

**What's needed:** the real Supabase DEV database password (Supabase
dashboard → Project Settings → Database → Connection string), substituted
into both `DATABASE_URL` and `DIRECT_URL` in `.env.local`. This file is
git-ignored and must be edited locally — do not paste the password into
chat/tickets.

**Blocked until resolved:**
- `npx prisma migrate dev` (creating/applying the initial migration)
- `npm run db:seed`
- Any runtime code path that queries the database

Everything else in Phase 0 (schema authoring/validation, app scaffold,
typecheck/lint/test/build/e2e) does not depend on this and is verified
passing.

## Known Issues

- 2 moderate/3 high `npm audit` advisories, both in **devDependencies
  only** (not shipped to production): `@vitest/mocker` (path traversal in
  Vitest's mocker) and `deepmerge-ts` via `@prisma/config` (stack
  exhaustion). Fixing either requires a breaking major-version bump
  (`vitest@5`, `prisma@6.12` — actually older; resolve via `npm audit
  fix --force` only after evaluating compatibility). Deferred for now
  since neither affects the deployed application.
- `next dev`/`next build` (Next.js 16.3+) auto-appended a managed
  `<!-- BEGIN:nextjs-agent-rules -->` block to `CLAUDE.md`, pointing
  future coding agents at the version-matched docs bundled in
  `node_modules/next/dist/docs/`. This is a documented first-party Next.js
  feature (see `node_modules/next/dist/docs/01-app/02-guides/ai-agents.md`),
  not an edit made by the agent working this task. It only appends; all
  existing `CLAUDE.md` content is preserved. Disable via `agentRules:
  false` in `next.config.ts` if undesired.

## Latest Verification

```text
TypeScript:              PASS
Lint:                     PASS
Format check:             PASS
Unit tests:                PASS (10/10 — lib/utils, lib/env)
Integration tests:          N/A (no DB-backed code yet)
Build:                     PASS
E2E:                       PASS (1/1 — homepage smoke test)
Prisma validate:            PASS
Prisma generate:            PASS
Prisma migrate (Supabase):  BLOCKED — see Known Blockers
Vercel deployment:          NOT YET ATTEMPTED
Supabase connectivity:      BLOCKED — see Known Blockers
```

## Update Rules

1.  Do not claim completion without evidence.
2.  Keep the current phase accurate.
3.  Record meaningful blockers.
4.  Record verification results.
5.  Remove resolved blockers.
6.  Keep this file concise.
