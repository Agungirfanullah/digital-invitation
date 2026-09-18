# Project Status

This is a living engineering status summary. It is not a substitute for
the PRD, Architecture, Database Design, or Roadmap.

## Current State

**Project:** Digital Invitation SaaS

**Architecture:** Next.js 16 (App Router) + TypeScript + Prisma + Supabase
PostgreSQL + Supabase Storage + Vercel

**Development Mode:** Autonomous Claude Code agentic execution

**Current Phase:** Phase 1 --- Authentication & User Foundation

**Status:** Phase 0 foundation is complete, including live Supabase DEV
database connectivity (previously blocked, now resolved). Phase 1
authentication is implemented against the real Supabase Auth project (no
mocked auth) and verified locally (typecheck/lint/format/unit
tests/build/e2e all passing, including a live sign-in-rejection round trip
against Supabase Auth).

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

**Status:** Implemented and verified, including live Supabase DEV database
connectivity.

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
    (`prisma/schema.prisma`) — validated and migrated against the Supabase
    DEV database
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
-   [x] `npm run test` (Vitest) — **PASS** (43/43 as of Phase 1; 10/10 at
    the end of Phase 0)
-   [x] `npm run build` (Next.js production build) — **PASS**
-   [x] `npm run test:e2e` (Playwright) — **PASS** (5/5 as of Phase 1; 1/1
    at the end of Phase 0)
-   [x] `npx prisma validate` — **PASS**
-   [x] `npx prisma generate` — **PASS**
-   [x] `npx prisma migrate status` against Supabase DEV — **PASS**
    ("Database schema is up to date!"); the DB password placeholder
    blocking this in a prior session has since been resolved
-   [ ] Verify Vercel compatibility — not yet deployed; no Vercel-specific
    APIs used, static build succeeds locally

## Phase 1 --- Authentication & User Foundation

**Status:** Implemented and verified against the real Supabase DEV Auth
project. No fake/mocked authentication.

-   [x] Register (`app/(auth)/register`) — Supabase `auth.signUp`, Zod
    validation, honors the project's email-confirmation setting (shows a
    "check your email" success state when `session` is null instead of
    assuming immediate login)
-   [x] Login (`app/(auth)/login`) — Supabase `auth.signInWithPassword`,
    friendly Indonesian error messages, safe `next` redirect support
-   [x] Logout — `signOutAction`, a POST-only Server Action invoked from a
    `<form>` (not a GET link, to avoid CSRF-prone sign-out links)
-   [x] Session handling — cookie-based Supabase session via
    `@supabase/ssr` (`lib/supabase/client.ts`, `lib/supabase/server.ts`),
    refreshed on every request by `proxy.ts`. **Note:** Next.js 16 renamed
    the `middleware.ts` file convention to `proxy.ts`; this repo uses the
    new convention. Authorization decisions always call `auth.getUser()`,
    never `getSession()`, since only `getUser()` revalidates the token
    against Supabase Auth instead of trusting the local cookie.
-   [x] Auth callback handling — `app/auth/callback/route.ts` exchanges the
    PKCE `code` from confirmation/password-reset emails for a session
-   [x] Password reset architecture — `forgot-password` (request) +
    `reset-password` (confirm) pages; the request step always returns a
    generic success message regardless of whether the email is registered,
    to prevent account enumeration
-   [x] Email verification architecture — handled via Supabase Auth's
    built-in confirmation flow plus the callback route; whether
    confirmation is actually required depends on a Supabase dashboard
    setting (see "Remaining Manual Configuration" below) — both resulting
    code paths are implemented
-   [x] Protected dashboard routing — `proxy.ts` redirects unauthenticated
    requests to `/dashboard/*` to `/login?next=...`; `app/dashboard/layout.tsx`
    re-verifies server-side via `requireAppUser()` as defense in depth (a
    Proxy matcher change or excluded route must never be the only
    protection — see the Next.js 16 data-security guidance)
-   [x] User model / provisioning boundary — `lib/auth/provisioning.ts`
    upserts a Prisma `User` row keyed by the Supabase Auth user's UUID
    (used directly as `User.id`; no separate "external id" column and no
    schema migration needed). Supabase Auth owns credentials, so
    `passwordHash` stays null for these accounts.
-   [x] Rate limiting — in-memory fixed-window limiter (`lib/rate-limit/`)
    applied to register/login/password-reset Server Actions, keyed by IP
    (`lib/auth/rate-limit.ts`). Documented as a single-instance stopgap,
    not a substitute for a shared store at scale (see
    `docs/ARCHITECTURE.md` §28).
-   [x] Authorization tests — see "Tests" below

### Remaining Manual Configuration (Supabase Dashboard)

These cannot be verified or changed from the repository and require a
human with dashboard access:

-   Confirm **Auth → URL Configuration → Site URL / Redirect URLs**
    includes the deployed app origin(s) plus `/auth/callback`, so
    `emailRedirectTo`/`resetPasswordForEmail` links resolve correctly
    outside of `localhost`.
-   Confirm whether **Auth → Providers → Email → Confirm email** is
    enabled for the DEV project; this determines whether `signUp` returns
    an active session immediately or requires the "check your email" step
    already implemented in `RegisterForm`. Both code paths are handled;
    only the dashboard setting decides which one runs.
-   Google OAuth is explicitly optional per `docs/PRD.md` §9 and is **not
    implemented** — no OAuth client credentials exist yet. Add provider
    configuration and a `signInWithOAuth` entry point when credentials
    become available.

### Tests Added (Phase 1)

-   `lib/auth/validation.test.ts` — register/login/forgot/reset Zod schemas
-   `lib/auth/errors.test.ts` — Supabase error → Indonesian message mapping,
    confirms raw internal error text never leaks to the returned message
-   `lib/auth/provisioning.test.ts` — Prisma upsert shape (Supabase id as
    `User.id`, name never overwritten after creation) — Prisma mocked
-   `lib/auth/urls.test.ts` — open-redirect protection
    (`isSafeRedirectPath`) and callback URL construction
-   `lib/rate-limit/index.test.ts` — fixed-window allow/block/reset behavior
-   `lib/supabase/route-protection.test.ts` — protected-path matching
    (`/dashboard` and nested routes protected; lookalike paths like
    `/dashboardish` are not)
-   `e2e/auth.spec.ts` — **runs against the real Supabase DEV project**
    (no mocks): unauthenticated `/dashboard` access redirects to `/login`;
    register/login pages render; invalid login credentials are rejected
    with a friendly, non-technical message; homepage links to
    register/login work

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

None currently. The Supabase DEV database credential blocker recorded here
in Phase 0 has been resolved — `.env.local` now has a real database
password and `npx prisma migrate status` connects successfully.

The remaining Supabase **dashboard** configuration items for Phase 1 (Site
URL/redirect allowlist, email confirmation toggle, optional Google OAuth)
are not blockers on further engineering work — they're operational
settings a human should confirm before production traffic relies on them.
See "Remaining Manual Configuration" under Phase 1 above.

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
- `.prettierrc.json` now sets `"endOfLine": "auto"`. Without it,
  `npm run format:check` flagged essentially every file in the repo
  (including ones untouched by any recent change) as misformatted — caused
  by this Windows checkout's `core.autocrlf=true` converting the git-stored
  LF line endings to CRLF on disk, which then mismatched Prettier's
  default `endOfLine: "lf"`. `"auto"` makes Prettier preserve whichever
  line ending a file already has instead of forcing LF, which resolves the
  mismatch without changing git config (not permitted) or requiring a
  repository-wide re-checkout.
- A local machine without Playwright's Chromium binary installed yet needs
  one manual step before `npm run test:e2e` can run:
  `npx playwright install chromium`. This is a normal one-time local setup
  step (not tracked in the repo, since browser binaries aren't committed),
  surfaced here because `npm run test:e2e` fails outright without it —
  including the pre-existing Phase 0 homepage smoke test, confirming it's
  an environment gap and not a regression.

## Latest Verification

```text
TypeScript:                 PASS
Lint:                       PASS
Format check:               PASS
Unit tests:                 PASS (43/43 — lib/utils, lib/env, lib/auth/*, lib/rate-limit, lib/supabase)
Build:                      PASS (next build; proxy.ts recognized as Proxy/Middleware)
E2E:                        PASS (5/5 — homepage smoke test + auth foundation suite,
                             the latter exercising the real Supabase DEV Auth API)
Prisma validate:            PASS
Prisma migrate status:      PASS ("Database schema is up to date!")
Vercel deployment:          NOT YET ATTEMPTED
Supabase connectivity:      PASS (DB via Prisma; Auth via live sign-in-rejection e2e test)
```

## Update Rules

1.  Do not claim completion without evidence.
2.  Keep the current phase accurate.
3.  Record meaningful blockers.
4.  Record verification results.
5.  Remove resolved blockers.
6.  Keep this file concise.
