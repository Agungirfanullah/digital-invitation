# Project Status

This is a living engineering status summary. It is not a substitute for
the PRD, Architecture, Database Design, or Roadmap.

## Current State

**Project:** Digital Invitation SaaS

**Architecture:** Next.js 16 (App Router) + TypeScript + Prisma + Supabase
PostgreSQL + Supabase Storage + Vercel

**Development Mode:** Autonomous Claude Code agentic execution

**Current Phase:** Phase 3 --- Invitation Foundation

**Status:** Phase 0, 1, and 2 remain complete and passing. Phase 3's public
invitation rendering pipeline (`/invite/[slug]`, projection, template
registry, theme validation, personalization) is implemented and verified
against the real Supabase DEV Postgres database.

**Note on phase numbering:** this engagement's "Phase 3 — Invitation
Foundation" was scoped by an explicit task brief to consolidate parts of
`docs/ROADMAP.md`'s Phase 3 (Template System), Phase 4 (Invitation Data —
Theme specifically), and Phase 6 (Public Invitation), building the
rendering foundation end-to-end in one pass rather than strictly
sequentially. This is a deliberate execution-order adjustment permitted by
`AGENT_EXECUTION.md` §9 ("adjust the implementation order while preserving
the product priorities"), not a reinterpretation of the roadmap's actual
content — `docs/ROADMAP.md` itself is left unchanged since it still
correctly describes the target feature set for each of those phases; only
the *grouping and sequencing* of this implementation pass differs from a
literal phase-by-phase reading. Guest management (Roadmap Phase 7) and the
invitation editor (Roadmap Phase 5) are explicitly **not** part of this
phase and remain unimplemented — see "What Phase 3 deliberately does not
include" below.

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
-   [x] `npm run test` (Vitest) — **PASS** (135/135 as of Phase 3; 79/79 at
    the end of Phase 2; 43/43 at the end of Phase 1; 10/10 at the end of
    Phase 0)
-   [x] `npm run build` (Next.js production build) — **PASS**
-   [x] `npm run test:e2e` (Playwright) — **PASS** (15/15 as of Phase 3;
    8/8 at the end of Phase 2; 5/5 at the end of Phase 1; 1/1 at the end
    of Phase 0)
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

## Phase 2 --- Event & Dashboard Foundation

**Status:** Implemented and verified against the real Supabase DEV
Postgres database (via Prisma). No mocked persistence for the
authorization-critical paths. No schema migration was required — the
Phase 0 `Event`/`EventMember` models already covered everything this
phase needs.

-   [x] Event CRUD (`lib/events/service.ts`) — create/list/get/update/delete,
    all server-side, all authorization-checked
-   [x] Event ownership + membership authorization
    (`lib/events/authorization.ts`) — `getAuthorizedEvent(eventId, userId,
    minRole)` checks `Event.ownerId` first, then falls back to an
    `EventMember` row at or above the required role. There's no UI to add
    members yet (that's team collaboration, a later phase), but the check
    already covers both paths so authorization logic won't need to change
    when that UI lands. Delete is restricted to the owner specifically
    (`event.ownerId === userId`), not just any EDITOR member — the most
    destructive operation gets the narrowest authorization.
-   [x] IDOR-safe error handling — `EventNotFoundError` is thrown
    identically for "doesn't exist" and "exists but not yours"; every page
    that catches it calls Next's `notFound()`, so a prober can't
    distinguish the two cases from the response.
-   [x] Event types — reuses the Prisma `EventType` enum directly
    (`z.enum(EventType)`); Indonesian labels in `lib/events/labels.ts`
-   [x] Dashboard event list (`app/dashboard/page.tsx`) — replaces the
    Phase 1 placeholder; real empty state, real data, `loading.tsx`
    skeleton, Server Component (no client-side fetching)
-   [x] Create event (`/dashboard/events/new`) — Zod-validated title/type/
    slug/description; the slug field live-suggests from the title as the
    user types (client-side `slugify()`) but stops auto-syncing the
    moment the user edits the slug field directly, so an explicit slug is
    never silently overwritten
-   [x] Event detail dashboard (`/dashboard/events/[eventId]`) — overview,
    edit link, delete action, and an honest "coming later" list for
    unimplemented modules (guests/RSVP, editor, gallery, analytics) — no
    dead/fake buttons, just plain text since those modules don't exist yet
-   [x] Edit event (`/dashboard/events/[eventId]/edit`) — same validation
    as create; slug does **not** auto-sync from title on edit (only on
    create), so editing the title never silently changes an
    already-established public URL
-   [x] Delete event (`components/events/delete-event-button.tsx`) — a
    two-step inline confirm (no accidental single-click delete), owner-only
    authorization, friendly error if a future restrict-on-delete relation
    (e.g. recorded gift transactions) ever blocks it
-   [x] Slug handling (`lib/events/slug.ts`, `lib/events/validation.ts`) —
    normalized (trim + lowercase) before format validation
    (`^[a-z0-9]+(-[a-z0-9]+)*$`, 3-60 chars); DB unique constraint is the
    source of truth for uniqueness, with the resulting Prisma `P2002`
    mapped to a friendly Indonesian message (`SlugConflictError`) instead
    of a raw database error
-   [x] Never-trust-the-client — `ownerId` is always taken from
    `requireAppUser()` (the authenticated session), never from form
    input; ordinary events can't be created/updated/deleted without a
    valid session (defense in depth: `proxy.ts` redirect + per-action
    `requireAppUser()` + per-operation `getAuthorizedEvent()`)
-   [x] Loading/empty/error/success states throughout — dashboard and
    event-detail `loading.tsx` skeletons, a real empty state on the
    dashboard, inline field errors + pending states on both forms, a
    dedicated `not-found.tsx` for the `[eventId]` segment
-   [x] Authorization/tenancy tests — see "Tests Added (Phase 2)" below

### Incidental improvements made while implementing this phase

-   `lib/auth/session.ts` — `getSupabaseUser`/`getCurrentAppUser` are now
    wrapped in React's `cache()`, per the Next.js authentication guide's
    DAL pattern. Phase 2 added several more nested routes under
    `/dashboard` that each need the current user (layout + page + form
    action); without this they'd each trigger their own
    `supabase.auth.getUser()` network call and Prisma upsert per request.
-   `components/auth/form-field.tsx` and `form-error.tsx` moved to
    `components/forms/` (same content, `FormField` gained an optional
    `hint` prop) — they were generic from the start but lived under
    `components/auth/`; Phase 2's event forms needed them too, and
    importing an auth-specific path from an unrelated feature was the
    wrong signal. All four existing auth forms were updated accordingly;
    behavior is unchanged.
-   `components/ui/select.tsx` and `components/ui/textarea.tsx` — added as
    plain-HTML, Tailwind-styled primitives (same pattern as the existing
    `Input`/`Button`), not a new dependency — no Radix `Select` primitive
    was installed.
-   `eslint.config.mjs` — added `argsIgnorePattern: "^_"` /
    `varsIgnorePattern: "^_"` to `@typescript-eslint/no-unused-vars`.
    `deleteEventAction`'s signature needs an unused trailing
    `_prevState`/`_formData` pair (required by `useActionState`'s
    calling convention after `.bind(null, eventId)`), which the default
    rule config flagged even with the underscore prefix.
-   `vitest.setup.ts` now loads `.env.local` (via the `dotenv` package,
    already a devDependency for `prisma.config.ts`) before tests run.
    This is what makes the live-database integration tests in
    `lib/events/service.integration.test.ts` possible without a separate
    env-loading step for `npm run test`.

### Remaining Limitation (not a blocker on this phase's completion)

Full authenticated browser E2E for event create/edit/delete (register →
login → create event → edit → delete, all through the UI) could not be
automated: the Supabase DEV project's Auth configuration rejects
signups from synthetic email domains (verified directly against the Auth
API — `example.com`/`.invalid` addresses are both rejected as "invalid"),
so there's no way to script a fresh authenticated session without a real,
deliverable inbox. This is the same class of constraint as the Phase 1
"Confirm email" dashboard setting — dashboard-controlled, not something
the repository can change.

What covers this instead:
-   `lib/events/service.integration.test.ts` — 11 tests against the real
    Supabase DEV Postgres database (via Prisma, not mocked) proving every
    authorization requirement (A-J) directly against the service layer
    these routes call. This is arguably a **more precise** test of tenancy
    than a full browser flow would be, since it isolates the
    authorization boundary from confounding variables like email
    deliverability.
-   `e2e/events.spec.ts` — confirms the new event routes
    (`/dashboard/events/new`, `/dashboard/events/[eventId]`,
    `/dashboard/events/[eventId]/edit`) redirect to `/login` when signed
    out, proving Proxy-based route protection extends correctly to the
    new nested dynamic routes.

If a real test inbox becomes available (or the DEV project's email
restrictions are relaxed), a full authenticated E2E event-CRUD spec would
be a good addition — the manual click-through below stands in for it for
now.

**Manually verify before considering this phase production-trustworthy:**
register a real account → create an event → confirm it appears on
`/dashboard` → open it → edit it → confirm the change persists on reload
→ delete it → confirm it's gone and `/dashboard/events/<id>` now 404s.

### Tests Added (Phase 2)

-   `lib/events/slug.test.ts` — `slugify()`: diacritic stripping, separator
    collapsing, 60-char truncation without a trailing hyphen
-   `lib/events/validation.test.ts` — `createEventSchema`/`slugSchema`:
    valid input, title/slug/description length limits, invalid event
    type, slug format (rejects spaces/underscores/leading-trailing
    hyphens), and confirms uppercase input is *normalized* to lowercase
    rather than rejected (deliberate — see "Slug handling" above)
-   `lib/events/errors.test.ts` — domain error → Indonesian message
    mapping; confirms an unexpected error's raw message never leaks to
    the returned string
-   `lib/events/actions.test.ts` — `createEventAction`/`updateEventAction`
    reject invalid `FormData` **without calling the service layer**
    (Prisma/service mocked here specifically to prove the short-circuit);
    also proves a client-supplied `ownerId` form field is ignored — the
    owner always comes from the authenticated session
-   `lib/events/service.integration.test.ts` — **runs against the real
    Supabase DEV Postgres database, no mocks.** Covers all of A-J from the
    phase's authorization requirements: create/list/get/update/delete for
    the owner (A-E), cross-user IDOR protection on get/update/delete
    (F-H), a nonexistent event id behaving identically to an unauthorized
    one, and duplicate-slug rejection on both create and update (I/J).
    Every row created is deleted in `afterEach` regardless of test
    outcome — verified with a follow-up query showing zero leftover rows
    after the suite runs. **Extended in Phase 3** with publish/unpublish
    IDOR coverage (R/S/T) — see Phase 3 below.
-   `e2e/events.spec.ts` — unauthenticated access to the three new event
    routes redirects to `/login` with the correct `next` param

## Phase 3 --- Invitation Foundation

**Status:** Implemented and verified against the real Supabase DEV
Postgres database. No fake/mocked authorization or projection logic.

-   [x] Public route `/invite/[slug]` (`app/invite/[slug]/page.tsx`) —
    Server Component; resolves slug → safe public data → renders via
    `InvitationRenderer`. No template-specific logic lives in the route.
-   [x] Public event lookup (`lib/invitations/service.ts`) — server-side
    only; normalizes the slug through the same `slugSchema` Phase 2
    already uses, so lookup behaves consistently with how slugs are
    validated at creation/edit time.
-   [x] Explicit published/private rule
    (`lib/invitations/authorization.ts`) — `isEventPubliclyVisible()`:
    `status === "PUBLISHED"` and (if set) `expiresAt` hasn't passed. Reuses
    the existing `Event.status`/`Event.expiresAt` fields — no second
    publication mechanism was invented.
-   [x] Publish/unpublish (`lib/events/service.ts`:
    `publishEventForUser`/`unpublishEventForUser`,
    `lib/events/actions.ts`: `publishEventAction`/`unpublishEventAction`,
    UI on `/dashboard/events/[eventId]`) — EDITOR-level authorization
    (owner or EventMember), `publishedAt` set on every publish and left
    as a historical record on unpublish. Added to the **existing** Event
    domain/service layer rather than a new "invitations" mutation
    surface, since publishing is fundamentally an Event state transition.
-   [x] Safe public projection (`lib/invitations/projection.ts`,
    `lib/invitations/types.ts`) — an explicit `PublicInvitation` DTO built
    field-by-field from a narrow, hand-picked Prisma `include`
    (`PUBLIC_EVENT_INCLUDE`); never spreads or returns a raw Event record.
    Structurally cannot contain `ownerId`, `members`, `payments`,
    `subscriptions`, `auditLogs`, or a guest list — proven by both a unit
    test (fabricated input) and an integration test (real DB round trip).
-   [x] `InvitationRenderer` (`components/invitation/invitation-renderer.tsx`)
    — the only thing the public route needs to call; resolves the
    template component from the registry and renders it.
-   [x] Template registry (`lib/invitations/templates/registry.ts`) —
    slug → component map. All 6 seeded `Template` rows (see
    `prisma/seed.ts`, matching `docs/ROADMAP.md`'s Phase 3 template names)
    resolve without error; only `minimal-elegant` has a real
    implementation so far — an unrecognized or unimplemented slug safely
    falls back to it rather than crashing or rendering blank. Building
    five more visually-distinct templates without the editor/theme UI to
    configure them (Roadmap Phase 5) would just be reskins pretending to
    be finished products, so that was deliberately not done here — see
    "What Phase 3 deliberately does not include" below.
-   [x] First real template
    (`components/invitation/templates/minimal-elegant-template.tsx`) —
    genuinely renders whatever data the event actually has. Every section
    beyond Hero/Closing is conditional on real backing data existing (own
    guard per section component in `components/invitation/sections/`), so
    an event with only a title still renders a complete, honest page
    instead of empty placeholders — this is the realistic case today,
    since there's no dashboard UI yet to create WeddingProfile/
    EventSchedule/Venue/LoveStory/Gallery data (Roadmap Phase 4).
-   [x] Theme contract + runtime validation (`lib/invitations/theme.ts`) —
    `parseTheme()` validates each `Theme` column independently with Zod
    and falls back to a neutral default per-field (not per-row), so one
    malformed value (e.g. an invalid `backgroundImageUrl`) doesn't take
    down the rest of the theme. Applied to the page via CSS custom
    properties (`components/invitation/theme-vars.ts`) rather than
    Tailwind static classes, since theme values are runtime data — colors
    and fonts reach the DOM only through `style`/CSS custom properties,
    never through `dangerouslySetInnerHTML` or string-built CSS.
-   [x] Section architecture (`components/invitation/sections/`) — Hero,
    Couple, Schedule (with nested Venue), LoveStory, Gallery, Closing.
    Only sections with real backing data in the current schema/UI are
    implemented; RSVP and Gift sections are explicitly **not** included
    (no RSVP submission or GiftMethod management UI exists yet — adding
    those sections now would mean fake, non-functional buttons).
-   [x] Personalization foundation (`lib/invitations/token.ts`) —
    `/invite/[slug]?to=[token]`. Token format is validated (opaque,
    10-128 chars, `[A-Za-z0-9_-]`) before ever reaching a query. The
    event scope check derives the event from the FK-enforced
    `GuestInvitation → Guest → Event` chain, **not** from
    `GuestInvitation.eventId` directly (see D-020) — so a token for Event
    A cannot personalize Event B even if that column were ever
    inconsistent. An invalid/foreign/nonexistent token resolves to `guest:
    null` (generic invitation), never an error.
-   [x] SEO metadata (`generateMetadata` in `app/invite/[slug]/page.tsx`)
    — title/description/OG derived from the safe public DTO, `noindex` +
    a generic not-found title when the invitation can't be resolved,
    canonical URL set to the invitation's own slug. The metadata lookup
    and the page body lookup are memoized per-request (`React.cache`) so
    they share one database round trip instead of two.
-   [x] Accessibility — semantic landmarks (`<main>`, `<section
    aria-label(ledby)>`), a real `<h1>`/`<h2>` heading hierarchy, `alt`
    text on every image, no information conveyed by color alone (every
    status/label pairs a text description), no `dangerouslySetInnerHTML`
    anywhere in the invitation rendering path.
-   [x] Mobile-first, dashboard-isolated presentation — `/invite/[slug]`
    renders under the same minimal root layout as the rest of the app
    (`app/layout.tsx` has no navigation to begin with), so there is no
    dashboard chrome to accidentally leak into the public page; verified
    directly in `e2e/invitation.spec.ts`.
-   [x] Authorization/privacy/personalization tests — see "Tests Added
    (Phase 3)" below.

### Database change

One migration, `20260918161434_add_guest_invitation_event_relation`:
added an enforced `@relation` (`onDelete: Cascade`) plus an index for
`GuestInvitation.eventId` → `Event`, which previously existed only as an
unconstrained scalar column (only `guestId` was FK-backed). Discovered
while implementing token scoping — see docs/DECISIONS.md D-020 for the
full rationale. Zero data impact: no `Guest`/`GuestInvitation` rows exist
yet in any environment (guest management is Roadmap Phase 7, not built).
Application code additionally never trusts this column directly for
authorization regardless — see the personalization bullet above.

No other schema changes were needed. `Template`, `Theme`,
`WeddingProfile`, `EventSchedule`, `Venue`, `LoveStory`/`LoveStoryItem`,
and `Gallery`/`GalleryItem` were already fully sufficient for this phase
as designed in Phase 0.

### What Phase 3 deliberately does not include

-   **The invitation editor** (Roadmap Phase 5) — there is no dashboard UI
    to create/edit a `WeddingProfile`, `EventSchedule`, `Venue`,
    `LoveStory`, `Gallery`, or `Theme` row yet. The renderer fully
    supports all of this data when it exists (proven by integration
    tests that create it directly via Prisma), but a real user has no way
    to enter it through the product yet. This is the correct scope
    boundary for "rendering foundation," not a gap in this phase.
-   **Guest management** (Roadmap Phase 7) — no dashboard UI to create
    guests or send invitation tokens. `Guest`/`GuestInvitation` fixtures
    in this phase's tests are created directly via Prisma, the same
    pattern already used for test users in Phase 1/2.
-   **RSVP and Gift sections** — no real backing functionality exists
    for either yet (no RSVP submission endpoint, no GiftMethod
    management UI), so no section was built for them. Adding either now
    would be exactly the "fake section that says it works when it
    doesn't" the phase brief explicitly prohibits.
-   **Five more visually-distinct templates** — see the template registry
    bullet above.
-   **View/open tracking** (`InvitationView`, "track invitation open" per
    `docs/PRD.md` §18/Roadmap Phase 8) — deliberately not wired up.
    Writing to the database on every public GET request (personalized or
    not) without a UI ever consuming that data yet is unnecessary write
    load and a potential abuse surface for this phase's scope.
-   **Caching of the public invitation page** — not introduced. The route
    already renders dynamically because it reads `searchParams` (the
    `?to=` token), which itself opts a Next.js route out of static/Full
    Route Caching, so an unpublish always takes effect immediately with
    no explicit cache invalidation to get wrong.

### Tests Added (Phase 3)

Pure unit tests (no database):

-   `lib/invitations/theme.test.ts` — `parseTheme()`: defaults when no
    Theme row exists, valid passthrough, independent per-field fallback
    for null/malformed values, never throws
-   `lib/invitations/authorization.test.ts` — `isEventPubliclyVisible()`:
    PUBLISHED/DRAFT/ARCHIVED, expired vs. not-yet-expired
-   `lib/invitations/format.test.ts` — Indonesian date/time formatting,
    including a check that no timezone label is assumed
-   `lib/invitations/templates/registry.test.ts` — known key resolves;
    unknown/null key safely falls back to the same default rather than
    throwing; every seeded template slug (`prisma/seed.ts`) resolves
    without error
-   `lib/invitations/projection.test.ts` — `toPublicInvitation()`: core
    field mapping, **never exposes owner/member/payment/subscription/
    audit fields or a guest list, and the ownerId value never appears
    anywhere in the serialized payload**, schedule/venue mapping,
    graceful handling when every optional relation is empty
-   `lib/invitations/token.test.ts` — `guestTokenSchema` format
    validation; `resolveGuestContext()` with Prisma mocked: valid token
    resolves the guest, **a token whose guest belongs to a different
    event returns null (cross-event protection)**, unknown token returns
    null, malformed token never reaches the database at all

Integration tests (real Supabase DEV Postgres, no mocks):

-   `lib/invitations/service.integration.test.ts` (14 tests) — the
    authoritative proof of Phase 3Q's requirements A-K, L/M, O, P/Q:
    resolves a published event by slug (A); malformed/nonexistent slug
    (B); DRAFT and ARCHIVED events are not publicly accessible (C/D); an
    expired PUBLISHED event is not accessible; the resolved DTO never
    carries owner/member data even round-tripped through real relations,
    including the WeddingProfile relation (E/F/G); real nested
    schedule/venue/love-story/gallery data renders correctly and missing
    optional data doesn't crash (P/Q); a malformed real Theme row falls
    back safely (O); a real seeded Template + Theme resolve correctly
    (L/M); a valid guest token personalizes the correct event (H); a
    token from Event A cannot personalize Event B (I); invalid/nonexistent
    tokens fall back safely (J); a second guest's name never leaks when
    resolving the first guest's token (K)
-   `lib/events/service.integration.test.ts` (extended, +4 tests) —
    publish/unpublish authorization (R/S/T): the owner can publish then
    unpublish their own event; another user cannot publish (S) or
    unpublish (T) it; publish/unpublish reject a nonexistent event id

E2E (real Supabase DEV database, fixtures seeded directly via Prisma —
see "Known Limitation" below for why):

-   `e2e/invitation.spec.ts` (6 tests) — a published event renders its
    real title/couple/type; a generic greeting shows with no token; a
    valid guest token personalizes the greeting; a token from an
    unrelated event falls back to the generic greeting (not the foreign
    guest's name); a DRAFT event and a nonexistent slug both show the
    same not-found page; the public page contains no dashboard
    navigation (`Dashboard` link, `Keluar` button)

### Known Limitation

Same underlying constraint as Phase 2: the Supabase DEV project's Auth
configuration rejects signups from synthetic email domains, so a fully
authenticated **register → create event → publish → view public
invitation** browser flow can't be automated end-to-end. `e2e/
invitation.spec.ts` works around this the way Phase 3R anticipated —
seeding a User/Event/Guest/GuestInvitation directly via Prisma (the same
strategy the Vitest integration suites already use) instead of driving a
real signup through the UI. This is arguably a more precise test of the
public-rendering pipeline anyway, since it isolates it from Auth email
deliverability entirely.

**Manually verify before relying on this in production:** publish a real
event from the dashboard, open `/invite/<slug>` in an incognito window,
confirm it renders and that unpublishing it makes the same URL 404
immediately.

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
- The Supabase DEV project's Auth configuration rejects signups from
  synthetic email domains (confirmed directly against the Auth API —
  `@example.com` and `@*.invalid` addresses are both rejected as
  "invalid"). This blocks fully automated authenticated browser E2E for
  any flow starting at registration (Phase 2's event CRUD included) unless
  a real, deliverable inbox is available. See "Remaining Limitation" under
  Phase 2 above for what covers this instead.
- `npm run test` now runs a handful of integration tests
  (`lib/events/service.integration.test.ts`) against the live Supabase DEV
  Postgres database rather than a mock — this is intentional (see Phase 2
  notes), but it does mean `npm run test` now requires the same working
  `DATABASE_URL`/`DIRECT_URL` that `npx prisma migrate status` does, and
  takes several seconds longer than a purely in-memory suite would.

## Latest Verification

```text
TypeScript:                 PASS
Lint:                       PASS
Format check:               PASS
Unit tests:                 PASS (135/135 — lib/utils, lib/env, lib/auth/*, lib/rate-limit,
                             lib/supabase, lib/events/*, lib/invitations/*; 25 of these are
                             live-DB integration tests, 0 leftover rows verified after each run)
Build:                      PASS (next build; proxy.ts recognized as Proxy/Middleware;
                             /invite/[slug] correctly dynamic, not statically prerendered)
E2E:                        PASS (15/15 — homepage smoke test, auth foundation suite,
                             event-route protection suite, and public invitation suite;
                             auth + invitation suites exercise the real Supabase DEV
                             database directly, no mocks)
Prisma validate:            PASS
Prisma migrate status:      PASS ("Database schema is up to date!" — 2 migrations total,
                             1 new in Phase 3: add_guest_invitation_event_relation)
Vercel deployment:          NOT YET ATTEMPTED
Supabase connectivity:      PASS (DB via Prisma — including live cross-tenant event
                             AND invitation-token authorization proofs; Auth via live
                             sign-in-rejection e2e test)
```

## Update Rules

1.  Do not claim completion without evidence.
2.  Keep the current phase accurate.
3.  Record meaningful blockers.
4.  Record verification results.
5.  Remove resolved blockers.
6.  Keep this file concise.
