# Project Status

This is a living engineering status summary. It is not a substitute for
the PRD, Architecture, Database Design, or Roadmap.

## Current State

**Project:** Digital Invitation SaaS

**Architecture:** Next.js 16 (App Router) + TypeScript + Prisma + Supabase
PostgreSQL + Supabase Storage + Vercel

**Development Mode:** Autonomous Claude Code agentic execution

**Current Phase:** Phase 5 --- Guest Management Foundation

**Status:** Phase 0-4 remain complete and passing. Phase 5's guest
management (CRUD, search/filter/sort, pagination, per-guest personalized
invitation tokens, CSV import/export) is implemented and verified against
the real Supabase DEV Postgres database, including a genuinely
authenticated E2E browser flow (see D-022).

**Note on phase numbering:** this engagement's "Phase 3 — Invitation
Foundation" was scoped by an explicit task brief to consolidate parts of
`docs/ROADMAP.md`'s Phase 3 (Template System), Phase 4 (Invitation Data —
Theme specifically), and Phase 6 (Public Invitation), building the
rendering foundation end-to-end in one pass rather than strictly
sequentially. "Phase 4 — Editor Foundation" then corresponded mainly to
Roadmap Phase 5 (Invitation Editor) plus the data-entry side of Roadmap
Phase 4. This phase, "Phase 5 — Guest Management Foundation," corresponds
to Roadmap Phase 7 (Guest Management) — RSVP/check-in-related fields
described there (`GuestInvitation.status` transitions past `NOT_SENT`,
seat-quota enforcement) belong to Roadmap Phase 9 (RSVP) and Phase 14
(Check-in), which remain future work; only the guest-record and
invitation-token half of Phase 7 is in scope here. This is a deliberate
execution-order adjustment permitted by `AGENT_EXECUTION.md` §9 ("adjust
the implementation order while preserving the product priorities"), not a
reinterpretation of the roadmap's actual content — `docs/ROADMAP.md`
itself is left unchanged since it still correctly describes the target
feature set for each phase; only the *grouping and sequencing* of these
implementation passes differs from a literal phase-by-phase reading.

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
-   [x] `npm run test` (Vitest) — **PASS** (293/293 as of Phase 5; 220/220
    at the end of Phase 4; 135/135 at the end of Phase 3; 79/79 at the end
    of Phase 2; 43/43 at the end of Phase 1; 10/10 at the end of Phase 0)
-   [x] `npm run build` (Next.js production build) — **PASS**
-   [x] `npm run test:e2e` (Playwright) — **PASS** (26/26 as of Phase 5;
    19/19 at the end of Phase 4;
    15/15 at the end of Phase 3; 8/8 at the end of Phase 2; 5/5 at the
    end of Phase 1; 1/1 at the end of Phase 0)
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

**Update from Phase 4:** the limitation below is narrower than originally
framed — see D-022 in `docs/DECISIONS.md`. The Supabase Auth restriction
is specific to the *public* `auth.signUp()` flow; the admin API's
`createUser({ email_confirm: true })` bypasses it and produces an account
that logs in through the real `/login` page like any other user.
`e2e/editor.spec.ts` uses this for genuine authenticated E2E coverage.
This section is left as originally written below for historical accuracy
about what Phase 2 itself covered — it was correct at the time, just not
the full picture of what's possible.

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

**Update from Phase 4:** this is narrower than framed below — see D-022 in
`docs/DECISIONS.md`. `e2e/editor.spec.ts` drives a real authenticated
register-equivalent (admin-provisioned, confirmed) → login → edit →
publish-reflects flow using `supabase.auth.admin.createUser({
email_confirm: true })`, which the public signup restriction described
here doesn't apply to. A public-invitation E2E rewritten to log in first
would be a reasonable follow-up, though the Prisma-seeded approach below
remains a valid, arguably more precise test of the rendering pipeline on
its own.

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

## Phase 4 --- Editor Foundation

**Status:** Implemented and verified against the real Supabase DEV
Postgres database, including a genuine authenticated browser E2E flow
(see D-022). No fake/mocked authorization, persistence, or preview logic.
No schema migration was required — every model this phase edits
(`WeddingProfile`, `Theme`, `EventSchedule`, `Venue`, `LoveStory`/
`LoveStoryItem`, `Gallery`/`GalleryItem`, `Event.templateId`) already
existed from Phase 0/3.

-   [x] Editor route `/dashboard/events/[eventId]/editor` — authorized at
    `EventMemberRole.EDITOR` (owner or EDITOR member); a VIEWER member or
    an unrelated user gets the same not-found behavior as a nonexistent
    event (see D-021). Reuses `lib/events/authorization.ts`'s
    `getAuthorizedEvent()` — no parallel authorization helper was written.
-   [x] Editor domain layer (`lib/editor/`) — `service.ts` (load +
    mutate, all authorization-checked), `validation.ts` (Zod),
    `errors.ts` (re-exports the existing `EventNotFoundError` rather than
    duplicating it, per instruction to reuse existing error taxonomy),
    `types.ts`, `actions.ts` (Server Actions), `preview.ts` (pure
    editor-state → `PublicInvitation` assembly for the live preview).
-   [x] Couple/wedding profile editing — all 10 `WeddingProfile` fields,
    autosaved.
-   [x] Theme editing — all 9 `Theme` columns, autosaved, applied to the
    live preview through the same `parseTheme()` fallback logic
    production uses (see "Theme parameter type relaxed" below) — never a
    second theme representation.
-   [x] Template selection — reuses the existing registry
    (`lib/invitations/templates/registry.ts`) as the single source of
    truth for what's actually implemented. All 6 seeded `Template` rows
    are listed; only `minimal-elegant` is selectable, the other 5 render
    as visibly disabled "Segera hadir" cards — the UI does not claim more
    templates work than actually do. The server independently re-validates
    the selection (active + registry-known), not just the UI's disabled
    state.
-   [x] Schedule (+ embedded venue) CRUD — create/update/delete, each
    schedule optionally carrying one venue (name/address/map URL/lat/lng)
    created/updated in the same Prisma transaction. Removing a venue from
    a schedule detaches it (`venueId → null`) without deleting the
    `Venue` row — see "Persistence strategy" below.
-   [x] Love story CRUD — title (autosaved) + items (add/edit/delete);
    the `LoveStory` row is created on first item add (find-or-create),
    matching the public renderer's assumption of at most one per event.
-   [x] Gallery CRUD — items (add/edit/delete: type, URL, caption); same
    find-or-create pattern as love story. Gallery title editing was
    deliberately **not** included — a single field with limited rendering
    impact; scope trim, not an oversight.
-   [x] Live preview reuses the real pipeline — `EditorShell` builds a
    `PublicInvitation` from current (possibly-unsaved) local state via
    `lib/editor/preview.ts`'s `buildPreviewInvitation()`, then renders it
    through the exact same `<InvitationRenderer>` the public
    `/invite/[slug]` route uses. No separate/duplicated preview template
    exists.
-   [x] Autosave (`components/editor/use-autosave.ts`) — debounced
    (800ms default), not per-keystroke. Tracks the last-saved value
    against the latest value so a stale in-flight response can't
    overwrite a newer edit's outcome. Explicitly single-editor-oriented
    (documented in the hook's own comment) — this does not attempt
    multi-tab/multi-user conflict resolution, and doesn't claim to.
-   [x] Truthful save states — "Tersimpan" (idle) / "Menyimpan..." /
    "Perubahan tersimpan" / "Gagal menyimpan", shown once, in the header
    (lifted up from whichever autosaved section is active via an
    `onStatusChange` callback) — not claimed until the mutation actually
    succeeds. Originally rendered per-section *and* in the header; that
    duplication was caught and removed after `e2e/editor.spec.ts` itself
    exposed it as a strict-mode ambiguity (two elements with identical
    text) — a good example of E2E tests catching a real UX defect, not
    just a testing inconvenience.
-   [x] Server-side Zod validation on every mutation — string length
    limits, date/time format, enum values (gallery item type), theme
    color format (character-class restricted — see "CSS injection"
    below), and safe-URL checks whereever a value can reach an
    `href`/`src`.
-   [x] IDOR defense on every nested mutation — updating/deleting a
    `EventSchedule`, `LoveStoryItem`, or `GalleryItem` re-derives
    ownership by querying `{ id, eventId }` (or the relation-scoped
    equivalent for items) rather than trusting the id alone; a caller who
    owns Event B cannot mutate a schedule/item that belongs to Event A
    merely by knowing its id. Directly tested (see below).
-   [x] Loading/error/empty states — `editor/loading.tsx` skeleton,
    unauthorized/missing event reuses the existing
    `/dashboard/events/[eventId]/not-found.tsx`, empty states for
    schedule/love-story/gallery lists, inline field errors on every form.

### Security review findings (fixed in this phase)

Two real gaps were found and closed while implementing the editor's write
paths — both affect the *existing* Phase 3 rendering pipeline too, not
just new Phase 4 code:

-   **`javascript:`/`data:` URLs were not rejected.** `lib/invitations/
    theme.ts`'s `backgroundImageUrl` check (and the render path for
    `Venue.mapUrl`, `LoveStoryItem.imageUrl`, `GalleryItem.url`/
    `thumbnailUrl` in `lib/invitations/projection.ts`) previously relied
    on plain `z.string().url()` / the WHATWG `URL` constructor, which
    parses `javascript:alert(1)` as a syntactically valid URL — the check
    never actually restricted the *scheme*. Values reaching an `<a href>`
    (map links, gallery items) would execute on click. Fixed with a new
    shared `lib/invitations/url-safety.ts` (`toSafeHttpUrl`/
    `isSafeHttpUrl`, http/https only), applied at both the write boundary
    (`lib/editor/validation.ts`) and the existing public read boundary
    (`theme.ts`, `projection.ts` — gallery items with an unsafe URL are
    now filtered out rather than passed through). Covered by
    `lib/invitations/url-safety.test.ts` plus new cases added to the
    existing `theme.test.ts`/`projection.test.ts`.
-   **Theme color fields had no character restriction.** Colors reach the
    DOM only via the `style` attribute/CSS custom properties (never a
    string-built `<style>` tag or `dangerouslySetInnerHTML`), so this was
    not an exploitable injection in the current architecture — but
    `lib/editor/validation.ts`'s `colorField` now restricts the
    character set anyway (`[a-zA-Z0-9#(),.%\-\s]`) as defense in depth
    against that architecture ever changing without the validation
    being revisited. Covered in `validation.test.ts` and
    `actions.test.ts`.

### Notable implementation decisions

-   **`parseTheme()`'s parameter type was relaxed** from the full Prisma
    `Theme` type to a structural `ThemeColumns` interface (the 9 columns
    it actually reads). This lets the editor's in-memory `EditorTheme`
    state (which has no `id`/`eventId`/timestamps) reuse the exact same
    default-fallback function the public renderer uses for the live
    preview, instead of duplicating that logic. Purely a type-signature
    widening — behavior for real `Theme` rows is unchanged (confirmed by
    the existing `theme.test.ts` suite still passing unmodified).
-   **Schedule validation is flat, not nested**, even though
    `lib/editor/service.ts`'s `ScheduleInput` type nests `venue`.
    `ZodError.flatten()` only reports field errors one level deep (keyed
    by `issue.path[0]`), so a nested `venue: venueSchema.nullable()`
    schema would collapse every venue-field error under one opaque
    `venue` key the form can't map back to the right input. `lib/editor/
    validation.ts`'s `scheduleFormSchema` validates flat fields
    (`venueName`, `venueAddress`, ...) and `toScheduleInput()`
    reconstructs the nested shape after validation, so `service.ts` (and
    its Prisma calls) never needed to change.
-   **Persistence strategy for a schedule's venue**: create+update run in
    one `$transaction`; updating an existing venue mutates that same row
    (never creates a second one); removing a venue from a schedule sets
    `venueId → null` without deleting the `Venue` row — per the explicit
    instruction not to delete nested records the UI merely omitted. All
    three behaviors are directly asserted in
    `lib/editor/service.integration.test.ts` (row-count checks, id
    stability checks).
-   **Discovered `admin.auth.admin.createUser({ email_confirm: true })`
    bypasses the Phase 2/3 "can't automate authenticated E2E" limitation**
    — see D-022. Used for `e2e/editor.spec.ts`'s real login → edit →
    persist → public-page-reflects-it flow. Phase 2/3 tests were left
    unmodified (not retroactively reworked — out of scope here, and they
    already pass); the STATUS.md sections above got a short pointer note
    to this discovery rather than a rewrite.

### Tests Added (Phase 4)

Pure unit tests (no database):

-   `lib/invitations/url-safety.test.ts` (new module) — http(s) accepted,
    `javascript:`/`data:`/`vbscript:`/malformed rejected
-   `lib/invitations/theme.test.ts` (+1) — `javascript:` background image
    URL now rejected
-   `lib/invitations/projection.test.ts` (+2) — unsafe venue map URL
    stripped; gallery item with an unsafe URL filtered out entirely
-   `lib/editor/validation.test.ts` (24 tests) — every schema: wedding
    profile, theme (including the color character-class and unsafe-URL
    rejections), template selection, schedule (including the
    start<end-time refinement, the "venue name+address together" rule,
    and `toScheduleInput`'s flat→nested transform), love story item,
    gallery item
-   `lib/editor/errors.test.ts` — domain error → Indonesian message
    mapping, confirms unexpected errors never leak raw details
-   `lib/editor/preview.test.ts` (9 tests) — `buildPreviewInvitation()`:
    core field mapping, guest always null, theme default-fallback reuse,
    raw theme passthrough, wedding profile/schedule passthrough, single
    gallery wrapped into the renderer's array shape, no crash on
    all-empty input
-   `lib/editor/actions.test.ts` (7 tests) — every action rejects invalid
    input **without calling the service layer or checking auth**
    (Prisma/service/auth mocked here specifically to prove the
    short-circuit ordering); confirms the authenticated user's id (never
    a client-supplied value) is what reaches the service layer; confirms
    the flat→nested schedule transform runs before the service call

Integration tests (real Supabase DEV Postgres, no mocks):

-   `lib/editor/service.integration.test.ts` (31 tests) — the
    authoritative authorization/persistence proof: owner and EDITOR-role
    member can load/mutate; VIEWER-role member and an unrelated user
    cannot (for `getEditorEvent`, `updateWeddingProfile`, `updateTheme`,
    `selectTemplate`, schedule/love-story/gallery mutations); a
    seeded-but-unimplemented template slug and a nonexistent slug are
    both rejected; a schedule's venue is created once and updated in
    place (row-count assertion); removing a venue detaches rather than
    deletes it (row-existence assertion after the mutation); **a
    schedule/love-story-item/gallery-item belonging to a different event
    cannot be mutated even by that other event's rightful owner, by
    passing the wrong `eventId`** — the core IDOR defense this phase
    depends on; love story and gallery auto-create their parent row on
    first item add. Every row created is deleted in `afterEach`
    regardless of outcome — verified with a follow-up query showing zero
    leftover rows.

E2E (real Supabase DEV database and a real authenticated session — see
D-022):

-   `e2e/editor.spec.ts` (4 tests) — unauthenticated access redirects to
    `/login`; an owner logs in for real, opens the editor, sees real
    persisted `WeddingProfile` data pre-filled, edits a field, watches
    the save-status indicator move through "Menyimpan..." →
    "Perubahan tersimpan", reloads the page and confirms the change
    persisted server-side (not just local state), and confirms the live
    preview reflects it; a second test confirms an edited field is
    reflected on the actual public `/invite/[slug]` page once saved; a
    VIEWER-role member is rejected with the same not-found page an
    unrelated user would see.

## Phase 5 --- Guest Management Foundation

**Status:** Implemented and verified against the real Supabase DEV
Postgres database, including a genuine authenticated browser E2E flow (see
D-022). No fake/mocked authorization, persistence, or CSV logic. No schema
migration was required — `Guest` and `GuestInvitation` already existed
from Phase 0 with every field this phase needs.

-   [x] Guest domain layer (`lib/guests/`) — `service.ts` (load + mutate,
    all authorization-checked), `validation.ts` (Zod), `errors.ts`
    (re-exports `EventNotFoundError`, adds `GuestNotFoundError`/
    `CsvTooLargeError`), `types.ts`, `actions.ts` (Server Actions),
    `labels.ts` (Indonesian labels), `normalize.ts` (name/phone matching
    helpers), `token.ts` (invitation token generation), `csv.ts`
    (parser/serializer).
-   [x] Guest route `/dashboard/events/[eventId]/guests` — list is
    VIEWER-and-above readable (see D-023); create/edit/delete/import
    require EDITOR. A VIEWER-role member sees the list without any
    mutation controls; a stranger/nonexistent event gets the same
    not-found behavior as everywhere else in the app.
-   [x] Guest CRUD — create (`/guests/new`), edit (`/guests/[guestId]/edit`),
    delete (two-step confirm, same pattern as `DeleteEventButton`). Every
    field (`name`, `phone`, `email`, `category`, `seatQuota`, `notes`)
    reuses the existing Prisma `Guest` columns; nothing new was added to
    the schema.
-   [x] Personalized invitation tokens — every guest gets an opaque,
    cryptographically random `GuestInvitation` token
    (`lib/guests/token.ts`, `crypto.randomBytes(24)` base64url) created in
    the **same transaction** as the guest itself (see D-024), so a guest
    can never exist without one. Tokens are format-compatible with the
    existing Phase 3 `guestTokenSchema`/`resolveGuestContext()` — no
    changes to `lib/invitations/token.ts` were needed. A "Salin Tautan"
    button copies the full `/invite/[slug]?to=[token]` link — rendered
    only for OWNER/EDITOR, never for a VIEWER, since a token is a
    personalization secret and not guest-list data (see D-023's explicit
    permission matrix).
-   [x] Search/filter/sort/pagination — server-side (`getGuestPageData`):
    case-insensitive search across name/phone/email, category filter,
    four sort orders, real `skip`/`take` pagination (25 per page) with a
    `count` query for total pages. No unbounded "load everything" query.
-   [x] CSV import (`/guests/import`) — a client wizard
    (`components/guests/csv-import-wizard.tsx`) reads the file locally
    (`FileReader`, no upload endpoint needed) and submits the raw text to
    a preview Server Action, which parses, validates every row with
    Zod, and flags duplicates (against both the database and other rows
    in the same file) without writing anything. A second "confirm" action
    **re-parses and re-validates the same text from scratch** — it never
    trusts the preview step's result as already-safe, so a
    tampered/replayed confirm can't smuggle in a row the preview never
    approved. Only valid, non-duplicate rows are created; duplicates and
    invalid rows are skipped with a plain-language summary (X imported, Y
    duplicates skipped, Z invalid skipped). Capped at 500 rows / 200,000
    characters (`CsvTooLargeError`) against oversized payloads.
-   [x] CSV export (`/guests/export`, a Route Handler, not a Server
    Action — needed to return a file response) — VIEWER-and-above,
    same authorization as the list. Invitation tokens are **deliberately
    excluded** from the export; they're a personalization secret, not
    guest-list data.
-   [x] CSV injection defense (`lib/guests/csv.ts`) — a cell whose first
    character is a spreadsheet formula trigger (`=`, `+`, `-`, `@`) is
    prefixed with a leading apostrophe on export, since a name field is
    guest-controlled data that a real spreadsheet app could later
    misinterpret as a formula.
-   [x] IDOR defense — every guest mutation re-verifies `{ id: guestId,
    eventId }` via `findFirst` before acting (never `guest.update({
    where: { id } })` alone), the same pattern established in Phase 4 for
    nested editor entities. Directly tested: the event owner *themselves*
    cannot update/delete a guest belonging to their own **other** event by
    passing the wrong `eventId`.
-   [x] Loading/empty/error states — `guests/loading.tsx` skeleton, a real
    empty state distinguishing "no guests yet" from "no results for this
    filter," inline field errors on the guest form, the shared
    `not-found.tsx` for unauthorized/nonexistent events.

### Security review findings

No new gaps were found in existing code during this phase (Phase 4 already
closed the `javascript:`/`data:` URL and theme-color issues). Guest-specific
review points, all satisfied by the design above:

-   Guest data (phone/email/notes) never reaches the public invitation
    projection — `lib/invitations/projection.ts` has no guest-list field
    at all, unchanged by this phase, and the full pre-existing invitation
    test suite (unit + integration + E2E) still passes unmodified.
-   Invitation tokens are excluded from CSV export (above).
-   No `userId`/`ownerId`/ `eventId`-authorization field is ever read from
    client input — every action derives the user from `requireAppUser()`
    and re-validates `eventId` via `getAuthorizedEvent()`, proven by
    `actions.test.ts` asserting a malicious extra form field is ignored.
-   No raw Prisma/internal error text reaches the client —
    `mapGuestErrorMessage()` logs server-side and returns a generic
    Indonesian message for anything unexpected, tested in `errors.test.ts`.
-   No `dangerouslySetInnerHTML` anywhere in `components/guests/` — every
    guest-controlled string (name, notes, etc.) renders through ordinary
    JSX text interpolation, which React escapes automatically.
-   Rate limiting on guest creation/CSV import was **not** added — the
    existing rate limiter (`lib/rate-limit/`) is applied only to the
    unauthenticated auth endpoints (register/login/password-reset) per
    Phase 1; abuse-resistant limits on authenticated dashboard mutations
    are `docs/ROADMAP.md` Phase 20 (Production Hardening) scope, not
    Phase 7. The CSV row/size caps above are the only volume control added
    here.

### Scope decisions

-   **Duplicate detection applies to CSV import, not the single-guest
    "Tambah Tamu" form.** `docs/ROADMAP.md`'s CSV import requirement
    explicitly calls for duplicate detection; the manual add form does
    not block or warn on a repeated name, since real guest lists
    legitimately contain multiple people with the same common name (e.g.
    several "Budi"s) — blocking that would be an incorrect assumption,
    not a safety feature. Duplicate matching (both paths, where it
    applies) compares normalized name and digits-only phone
    (`lib/guests/normalize.ts`), not raw string equality, so formatting
    differences (`0812...` vs `+62812...`) still match.
-   **CSV import creates each row's `Guest` + `GuestInvitation` in its own
    transaction**, not the whole batch as one — a token-collision retry
    needs a fresh transaction scope (Postgres aborts an entire
    transaction after any failed statement, so a caught unique-violation
    can't just be retried in place). Every row was already individually
    validated and deduplicated before this runs, so a mid-batch failure
    is expected to be rare; when it happens, already-created rows stay
    persisted rather than the whole import rolling back.
-   **The CSV parser is hand-rolled** (`lib/guests/csv.ts`), not a new
    dependency — the format is small and fixed (six guest columns), and a
    ~100-line, thoroughly-unit-tested RFC4180-style parser was simpler to
    verify than vetting and wiring an external library for this scope.
-   **Guest list read access is VIEWER-and-above**, unlike the Phase 4
    editor (which is EDITOR-only per D-021) — see D-023 for the rationale
    (viewing a guest list is a materially different risk than mutating
    invitation content).

### Tests Added (Phase 5)

Pure unit tests (no database):

-   `lib/guests/csv.test.ts` (13 tests) — `parseCsv`/`toCsv`: quoted
    fields with embedded commas/newlines/escaped quotes, CRLF/LF, trailing
    blank lines, no-trailing-newline, and the CSV-injection leading-quote
    defense; a round-trip through both functions
-   `lib/guests/normalize.test.ts` (6 tests) — name normalization
    (lowercase/trim/collapse whitespace, diacritics preserved) and phone
    digit normalization (leading-`0` vs `+62` equivalence)
-   `lib/guests/token.test.ts` (3 tests) — generated tokens pass the
    existing Phase 3 `guestTokenSchema` format check, are URL-safe, and
    don't collide across 1,000 generations
-   `lib/guests/validation.test.ts` (14 tests) — every schema: guest
    input (empty-string-to-null handling, length limits, phone/email
    format, category enum, seat-quota bounds/coercion), list-query
    defaults and safe fallback for garbage query-string values, CSV row
    schema defaults
-   `lib/guests/errors.test.ts` (4 tests) — domain error → Indonesian
    message mapping; confirms unexpected errors never leak raw details
-   `lib/guests/actions.test.ts` (7 tests) — every action rejects invalid
    input **without calling the service layer**; confirms the
    authenticated user's id (never a client-supplied one) reaches the
    service layer for both the guest CRUD and CSV import actions

Integration tests (real Supabase DEV Postgres, no mocks):

-   `lib/guests/service.integration.test.ts` (26 tests) — the
    authoritative authorization/IDOR/persistence proof: owner and
    EDITOR-role member can create/update/delete; VIEWER-role member can
    read but not mutate; a stranger/nonexistent event is rejected
    identically; **a guest belonging to a different event cannot be
    updated or deleted even by that other event's rightful owner**, by
    passing the wrong `eventId`; two guests in different events may share
    a name without a token collision; search/filter/sort/pagination each
    verified against real rows; CSV preview writes nothing; CSV confirm
    creates only valid/non-duplicate rows and gives every imported guest
    its own invitation token; duplicate detection catches both
    DB-existing and within-file duplicates; export excludes invitation
    tokens and is available to VIEWER but not a stranger. Every row
    created is deleted in `afterEach` regardless of outcome — verified
    with a follow-up query showing zero leftover rows.

E2E (real Supabase DEV database and a real authenticated session — see
D-022):

-   `e2e/guests.spec.ts` (7 tests) — unauthenticated access redirects to
    `/login`; an owner logs in for real, adds a guest through the actual
    form, sees it appear in the list, edits it, reloads the page and
    confirms the change persisted server-side; the owner deletes a guest
    and sees the empty state return; a VIEWER-role member sees the list
    read-only with no Tambah/Edit/Hapus controls rendered at all; a
    VIEWER-role member navigating directly to `/guests/new` gets the
    shared not-found page; a stranger cannot access another owner's guest
    list.

### Known Limitations

-   RSVP-related `GuestInvitation.status` transitions (`RSVPED`,
    `CHECKED_IN`) and seat-quota **enforcement** are not part of this
    phase — those belong to Roadmap Phase 9/14. `seatQuota` is captured
    and stored (it's a genuine `Guest` field), but nothing currently reads
    or enforces it; there's no RSVP submission surface yet for it to
    constrain.
-   No WhatsApp deep-link generation (Roadmap Phase 12) — "Salin Tautan"
    copies the raw invitation URL; a formatted WhatsApp message is later,
    separate scope.
-   No bulk selection/bulk-delete in the guest list UI — CSV import
    already covers bulk *creation*; bulk mutation of existing rows was
    not requested and would be new UI surface beyond this phase's scope.
-   Manual single-guest duplicate detection is intentionally not enforced
    — see "Scope decisions" above.

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
Unit tests:                 PASS (293/293 — lib/utils, lib/env, lib/auth/*, lib/rate-limit,
                             lib/supabase, lib/events/*, lib/invitations/*, lib/editor/*,
                             lib/guests/*; 86 of these are live-DB integration tests — 15
                             events, 14 invitations, 31 editor, 26 guests — 0 leftover rows
                             verified after each run)
Build:                      PASS (next build; proxy.ts recognized as Proxy/Middleware;
                             /invite/[slug], the editor route, and all guest routes
                             correctly dynamic)
E2E:                        PASS (26/26 — homepage smoke test, auth foundation suite,
                             event-route protection suite, public invitation suite, editor
                             suite, and guest management suite; auth/invitation/editor/
                             guests suites exercise the real Supabase DEV database directly,
                             no mocks — the editor and guests suites additionally drive a
                             real authenticated session, see D-022)
Prisma validate:            PASS
Prisma migrate status:      PASS ("Database schema is up to date!" — 2 migrations total;
                             none new in Phase 5, the existing Guest/GuestInvitation schema
                             was fully sufficient)
Vercel deployment:          NOT YET ATTEMPTED
Supabase connectivity:      PASS (DB via Prisma — including live cross-tenant event,
                             invitation-token, editor/IDOR, AND guest/IDOR authorization
                             proofs; Auth via a real authenticated login in
                             e2e/editor.spec.ts and e2e/guests.spec.ts)
```

## Update Rules

1.  Do not claim completion without evidence.
2.  Keep the current phase accurate.
3.  Record meaningful blockers.
4.  Record verification results.
5.  Remove resolved blockers.
6.  Keep this file concise.
