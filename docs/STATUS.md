# Project Status

This is a living engineering status summary. It is not a substitute for
the PRD, Architecture, Database Design, or Roadmap.

## Current State

**Project:** Digital Invitation SaaS

**Architecture:** Next.js 16 (App Router) + TypeScript + Prisma + Supabase
PostgreSQL + Supabase Storage + Vercel

**Development Mode:** Autonomous Claude Code agentic execution

**Current Phase:** Roadmap Phase 8 (Guest Personalization) reconciliation
--- Invitation Open/Sent Lifecycle State

**Status:** An audit-first task re-examined the last remaining, previously
self-documented open question from Phase 7: should
`GuestInvitation.openedAt`/`status = OPENED` ever be written now that
Phase 15's `InvitationView` exists? Conclusion: **no — they remain
intentionally, permanently unused.** `InvitationView` (with its own
`guestId` association) already represents "was this guest's personalized
invitation accessed," and a per-guest write to `GuestInvitation` would
duplicate that signal with materially worse characteristics — specifically
a bot/link-preview-unfurler contamination risk that reads far more
misleadingly on a discrete per-guest dashboard "Opened" badge than on an
aggregate analytics count. A fresh reading of `docs/PRD.md` §17
("Invitation Opening") also surfaced that the product's own definition of
"opening" is a **client-side reveal gesture** (a "Buka Undangan" cover
screen gating music autoplay) — not a server-side page-render event at
all — which is unimplemented in every template today and, even if built,
would need its own new client→server signal, not a reuse of this dead
field. `SENT` remains correctly unused too, unchanged from D-029 (still
blocked purely on a real delivery provider, which doesn't exist). **No
code was changed** — this is a closed, documented architectural decision,
not an implementation. See D-052 for the full rationale. Phases 0-11,
13, 14, 15, and the Phase 3 template completion remain unaffected.

**Status (Phase 3 template completion, unchanged by this task):**
Following a Roadmap Reconciliation Audit, the one genuine product gap
found in an otherwise-complete feature set was closed:
Roadmap Phase 3 ("Template System") originally shipped with only 1 of
its 6 seeded templates (`minimal-elegant`) actually implemented (see the
"Phase 3 — Invitation Foundation" section below). All 5 remaining
templates — Modern Editorial, Floral Romance, Dark Luxury, Traditional
Nusantara, Soft Romantic — are now real, genuinely distinct
implementations (not recolors), verified with real automated tests, real
Supabase DEV integration tests, real-browser Playwright E2E coverage,
and real screenshot-based visual review. This update also fixed a
related, previously-undocumented gap: `RsvpForm`/`WishForm` weren't
theme-aware (they rendered with the dashboard's default colors
regardless of the invitation's own theme) — now fixed with zero changes
to those components themselves (D-051), and each template ships its own
default color/typography palette, verified against real WCAG AA contrast
math (D-050/D-051). See "Update — Five Additional Templates (completing
Roadmap Phase 3)" under the "Phase 3 — Invitation Foundation" section
below for the full detail. No Prisma schema/migration change. Phases
0-11, 13, 14, and 15 remain complete and passing, unaffected.

**Status (Phase 15, unchanged by this update):** implements
`docs/ROADMAP.md`'s Phase 15 ("Analytics") —
first-party, internal invitation-view tracking plus an event-scoped
analytics dashboard at `/dashboard/events/[eventId]/analytics`. Public
invitation opens (`/invite/[slug]`) are tracked into the already-existing
`InvitationView` model (present in the schema since the first migration —
no migration was needed or created) via a first-party, opaque, HttpOnly
anonymous session cookie assigned by `proxy.ts` — never a guest id, never
an invitation token, never a raw IP (D-048). The dashboard aggregates
total views, unique sessions, personalized opens, RSVP breakdown (reusing
`lib/rsvp/service.ts`'s existing `calculateResponseRate()`), wishes,
active gift methods (never a fabricated transaction/revenue figure,
D-037), and authoritative `CheckIn`-derived check-in progress (D-049).
Tracking a view never throws and can never block the invitation from
rendering, even on a database failure. OWNER/EDITOR/VIEWER can all read
the dashboard (read-only, same authorization model as every other
dashboard); a stranger/unauthenticated caller is rejected exactly like
every other event-scoped route. See D-048/D-049 for the full rationale.
This phase does not implement WhatsApp/Email real sending, Gift Registry/
Payment/Subscription, or any third-party analytics provider — all remain
explicitly out of scope and deferred (see "Known Limitations" below).

**Status (Phase 14, unchanged by this phase):** implements
`docs/ROADMAP.md`'s Phase 14 ("Check-in") — OWNER and EDITOR users can
check in guests at `/dashboard/events/[eventId]/check-in` by scanning a
guest's existing personalized-invitation QR (decoded client-side via
`qr-scanner`, D-045) or by manual name search (server-backed, mandatory
fallback); VIEWER can view the dashboard/search read-only but cannot
check anyone in. `CheckIn` is the authoritative source of check-in state,
with `GuestInvitationStatus.CHECKED_IN` synchronized transactionally as a
denormalized projection and duplicate prevention driven entirely by the
database's own `[eventId, guestId]` unique constraint rather than a
check-then-act read (D-046). RSVP status never gates check-in, and
"reception mode" is a fast, stay-on-page repeated-scan loop, not a
separate concept (D-047). See D-045/D-046/D-047 for the full rationale.
Phase 15 (this phase) only *reads* `CheckIn` data for its own dashboard —
it does not modify Phase 14's architecture in any way.

**Status (Phase 13, unchanged by this phase):** implements
`docs/ROADMAP.md`'s Phase 13 ("QR Invitation") — OWNER and EDITOR users can
view and download a QR code for any guest's personalized invitation from
the existing per-guest invitation page
(`/dashboard/events/[eventId]/guests/[guestId]/invitation`). The QR
encodes the exact same URL `buildGuestInvitationUrl()` already produces
for the copy-link and WhatsApp-share features — no second token, no
QR-specific identifier, and no persisted QR image. Rendering and download
are entirely client-side (`qrcode.react`'s `QRCodeSVG`, downloaded as a
real `.svg` file). No schema migration was required and none was
introduced — the QR is purely a different visual encoding of data that
already exists and is already correctly authorized; VIEWER-role masking
is inherited for free from the existing token-masking behavior
(D-027), not reimplemented. See D-044 for the full library-selection and
architecture rationale. Phase 14 (this phase) is the first thing that
actually consumes this QR for check-in.

**Note on Phase 12 (WhatsApp Sharing):** remains at the state described
under "Phase 7" below — message composition, `wa.me` deep link, and
copy-to-clipboard are implemented and verified; real automated sending via
a WhatsApp Business API remains deliberately deferred (D-029) pending
provider credentials nobody has configured. Nothing in this phase changed
that.

**Gallery/Phase 11 VIDEO note (carried forward, unchanged by this
phase):** `docs/PRD.md` §24 and the existing `GalleryItemType` enum only
ever specified "Video URLs," never uploaded video files — Phase 11
preserved that distinction and did not invent a video hosting/upload
system; this phase doesn't touch Gallery at all.

**Note on phase numbering:** this engagement's "Phase 3 — Invitation
Foundation" was scoped by an explicit task brief to consolidate parts of
`docs/ROADMAP.md`'s Phase 3 (Template System), Phase 4 (Invitation Data —
Theme specifically), and Phase 6 (Public Invitation), building the
rendering foundation end-to-end in one pass rather than strictly
sequentially. "Phase 4 — Editor Foundation" then corresponded mainly to
Roadmap Phase 5 (Invitation Editor) plus the data-entry side of Roadmap
Phase 4. "Phase 5 — Guest Management Foundation" corresponded to Roadmap
Phase 7 (Guest Management) minus its RSVP/check-in-related fields. "Phase
6 — RSVP & Guest Response Foundation" corresponded to Roadmap Phase 9
(RSVP). "Phase 7 — Guest Personalization & Invitation Delivery
Foundation" corresponded to Roadmap Phase 8 (Guest Personalization —
already substantially covered by Phase 3's token resolution) plus the
non-sending half of Roadmap Phase 12 (WhatsApp Sharing). This phase,
"Phase 8 — RSVP Dashboard & Guest Response Management," was requested
under the label "Roadmap Phase 8," but its actual scope (RSVP dashboard
depth: filtering, response rate, CSV export, guest-list RSVP surfacing)
matches `docs/ROADMAP.md`'s Phase 9 (RSVP) acceptance criteria and
`docs/PRD.md` §22 ("RSVP Dashboard") — it deepens Phase 6's RSVP
foundation, not Roadmap's own Phase 8 (Guest Personalization), which
remains where Phase 3/7 left it. This mismatch is noted here rather than
silently resolved, per this engagement's own rule to reconcile requested
scope against the actual repository instead of assuming the brief's phase
label is authoritative over its literal content. Check-in (Roadmap Phase
14) and wishes/guestbook (Roadmap Phase 10) remain future work. This is a
deliberate execution-order adjustment permitted by `AGENT_EXECUTION.md`
§9 ("adjust the implementation order while preserving the product
priorities"), not a reinterpretation of the roadmap's actual content —
`docs/ROADMAP.md` itself is left unchanged since it still correctly
describes the target feature set for each phase; only the *grouping and
sequencing* of these implementation passes differs from a literal
phase-by-phase reading. This phase, "Phase 9 — Digital Gift / Angpao
Foundation," was requested under the label "Roadmap Phase 9," but its
actual scope (gift method configuration/display, explicitly not RSVP)
matches `docs/ROADMAP.md`'s **Phase 16** ("Digital Gift", P2) — the
Roadmap's own Phase 9 is RSVP, which this engagement already delivered
as "Phase 6 — RSVP & Guest Response Foundation." The same reconciliation
rule applies: the brief's literal content (bank transfer/e-wallet/
physical-gift configuration, copy-to-clipboard, "no fake payment
confirmation") is unambiguous and was implemented as described, and the
label mismatch is recorded here rather than silently resolved or used as
a reason to halt. `docs/ROADMAP.md`'s own Phase 17 ("Gift Registry", P2)
remains deferred — see D-037. This phase, "Phase 10 — Wishes / Guestbook
Foundation," is the first phase in this engagement whose number matches
`docs/ROADMAP.md`'s own numbering exactly (Roadmap Phase 10, "Wishes") —
no reconciliation was needed. It was chosen as the next phase precisely
because it's the lowest-numbered P1 phase not yet implemented, directly
following the completed RSVP foundation in the Roadmap's own dependency
order (§29), per an explicit prior inspection task. Check-in (Roadmap
Phase 14) remains future work. This phase, "Phase 11 — Gallery
Foundation," likewise matches `docs/ROADMAP.md`'s own Phase 11 ("Gallery")
exactly — no reconciliation needed here either, chosen as the direct next
lowest-numbered unimplemented P1 phase per the same prior inspection task.
This phase, "Phase 13 — QR Invitation," also matches `docs/ROADMAP.md`'s
own Phase 13 exactly. Phase 12 (WhatsApp Sharing) was deliberately not
revisited as its own pass — a dedicated inspection task determined it was
already actionable-complete (message composition + `wa.me` deep link,
D-029) via the existing Phase 7 work, so Phase 13 — the next phase with
zero code written and all dependencies satisfied — was chosen instead,
consistent with this engagement's established "verify before assuming a
phase needs (re)work" practice. This phase, "Phase 14 — Event Check-in,"
likewise matches `docs/ROADMAP.md`'s own Phase 14 exactly and was chosen
as the direct, dependency-satisfied next step after Phase 13 (which built
the personalized-invitation QR this phase now scans). This phase, "Phase
15 — Analytics Foundation," matches `docs/ROADMAP.md`'s own Phase 15
exactly and was chosen after an explicit inspection task determined it
was the correct next step: every data source it aggregates (RSVP,
wishes, gifts, check-in) already existed and was populated by real user
actions, its own schema (`InvitationView`) required zero migration, and —
unlike every other currently-reachable roadmap item (real WhatsApp/Email
sending, Gift Registry, Subscription/Payment) — it needed no external
provider credential to satisfy its actual, documented acceptance
criteria (PRD §35, ARCHITECTURE §25).

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
    slug → component map. **Update:** all 6 seeded `Template` rows (see
    `prisma/seed.ts`, matching `docs/ROADMAP.md`'s Phase 3 template names)
    now have a real, genuinely distinct implementation — see "Update —
    Five Additional Templates (completing Roadmap Phase 3)" below. An
    unrecognized/removed slug still safely falls back to Minimal Elegant
    rather than crashing or rendering blank.
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
-   **Five more visually-distinct templates** — **update: no longer true,
    see below.** All 6 templates now have real implementations.
-   **View/open tracking** (`InvitationView`, "track invitation open" per
    `docs/PRD.md` §18/Roadmap Phase 8) — deliberately not wired up at the
    time this phase was written. **Update: superseded by Phase 15
    (Analytics)**, which wires `InvitationView` up as the authoritative
    view-tracking source — via a different mechanism than
    `GuestInvitation.openedAt` (still unused; see the Roadmap
    Reconciliation Audit's hidden-gap finding on that dead field, not
    re-litigated here since it's outside this phase's scope).
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

### Update --- Five Additional Templates (completing Roadmap Phase 3)

**Status:** Implemented and verified against the real Supabase DEV
Postgres database plus real-browser Playwright rendering (including
screenshot-based visual verification — see below). No fake/placeholder
templates: all 6 seeded slugs now resolve to a genuinely distinct, real
component. No Prisma schema change — confirmed by inspection before
starting and by `npx prisma migrate status` after finishing ("Database
schema is up to date!", 2 migrations total, unchanged).

-   [x] **Modern Editorial, Floral Romance, Dark Luxury, Traditional
    Nusantara, Soft Romantic** — five new template components under
    `components/invitation/templates/`, registered in
    `lib/invitations/templates/registry.ts`. Each has its own genuinely
    different composition, spacing rhythm, typography hierarchy,
    decorative language, image treatment, card/container strategy,
    divider treatment, and closing tone — not a recolored Minimal
    Elegant. See D-050 for the full design rationale and
    docs/STATUS.md's linked design audit for the per-template brief each
    one implements.
-   [x] Shared RSVP/Wishes form theme fix — `RsvpForm`/`WishForm`/
    `CopyValueButton` (via the shared shadcn `Button`/`Input`/`Textarea`)
    now render with the invitation's own theme colors instead of the
    dashboard's default palette, with **zero changes to those components
    themselves**. Achieved by extending `themeToCssVars()`
    (`components/invitation/theme-vars.ts`) to rescope the shared
    `--primary`/`--background`/`--border`/etc. CSS custom properties to
    the invitation's theme *within that subtree only* — see D-051.
-   [x] Per-template default themes — each new template ships its own
    default color/typography palette (`lib/invitations/templates/
    default-themes.ts`), applied only when an event has no explicit
    `Theme` row or leaves a field blank; an owner-set field always wins,
    field-by-field. No new DTO field, no new Prisma column — the merge
    happens by passing the template's own default as `parseTheme()`'s
    fallback parameter (now accepts one, defaulting to the unchanged
    global `DEFAULT_THEME`) from `lib/invitations/projection.ts`, which
    already knows the event's `templateKey` at that exact point. See
    D-051.
-   [x] WCAG AA contrast — every template's own default `textColor`/
    `backgroundColor` pairing is verified programmatically (not just
    visually) against the real WCAG relative-luminance formula
    (`lib/invitations/color-contrast.ts`, zero new dependency), proven by
    `lib/invitations/templates/default-themes.test.ts`. The same
    utility's `resolveReadableForeground()` also picks a guaranteed-
    readable foreground for buttons rendered against an arbitrary
    primary/secondary/accent color, rather than relying on a manually
    guessed pairing per template.
-   [x] Real visual verification — beyond automated tests, all 5 new
    templates were screenshotted at both desktop (1280px) and mobile
    (390×844) with realistic populated data via a temporary Playwright
    script (not committed) and visually reviewed: each is clearly,
    immediately distinguishable from the others and from Minimal Elegant,
    text is legible in every case (including Dark Luxury's dark surface
    and Soft Romantic's deliberately low-contrast-by-hue aesthetic), and
    no template showed horizontal overflow at the mobile baseline.
-   [x] Cultural sensitivity (Traditional Nusantara) — the template's
    decorative motif is a generic, abstract, repeating geometric pattern,
    explicitly not attributed to any specific named ethnic group, region,
    or textile tradition, per this phase's explicit instruction. A more
    specific, attributed motif remains an open product decision for the
    owner, not assumed here — see D-050.
-   [x] Shared behavior never forked — every new template calls the
    exact same `RsvpForm`, `WishForm`, `GalleryGrid` (including its
    lightbox), and `CopyValueButton` components Minimal Elegant already
    used, unchanged; only surrounding markup/layout differs per template.
    No template touches `lib/rsvp/actions.ts`, `lib/wishes/actions.ts`,
    or guest-token resolution logic.

### Files changed/added (this update)

-   New: 5 template components
    (`components/invitation/templates/{modern-editorial,floral-romance,
    dark-luxury,traditional-nusantara,soft-romantic}-template.tsx`),
    `lib/invitations/color-contrast.ts`,
    `lib/invitations/templates/default-themes.ts`,
    `components/invitation/templates/test-fixtures.ts` (test-only).
-   Modified: `lib/invitations/templates/registry.ts` (5 new entries),
    `lib/invitations/theme.ts` (`parseTheme()` gained an optional
    `fallback` parameter, backward compatible — every existing call site
    and test is unaffected), `lib/invitations/projection.ts` (passes the
    event's own template default into `parseTheme()`),
    `components/invitation/theme-vars.ts` (`themeToCssVars()` now also
    rescopes the shared shadcn design tokens).
-   Test-only edits: `lib/editor/service.integration.test.ts` (two
    pre-existing tests that hardcoded "modern-editorial is unimplemented"
    updated to seed their own synthetic unregistered-template row
    instead, since that assumption is no longer true for any real seeded
    slug — the underlying behavior being tested, "being in the catalog
    alone isn't sufficient," is unchanged and still verified).

### Tests Added (this update)

Pure unit tests (no database):

-   `lib/invitations/color-contrast.test.ts` (11 tests) — relative
    luminance, contrast ratio, and readable-foreground selection,
    including the unparseable-color fallback path.
-   `lib/invitations/templates/default-themes.test.ts` (6 tests) — every
    new template has a genuinely distinct palette, every template's own
    text/background pairing meets WCAG AA (real automated check, not
    eyeballed), `getTemplateDefaultTheme()` resolution including the
    unknown/null fallback.
-   `lib/invitations/templates/registry.test.ts` (+2 tests) — every
    seeded slug is now genuinely registered (`isKnownTemplateKey`), and
    resolves to its own distinct component (not the shared fallback).
-   `lib/invitations/projection.test.ts` (+3 tests) — an event with no
    Theme row and `dark-luxury` selected gets Dark Luxury's own default
    palette; an event with no template selected still gets the global
    default; an owner-set field always overrides the template default,
    field-by-field.
-   Per-template render-smoke tests (5 files, 3 tests each = 15 tests) —
    `components/invitation/templates/{modern-editorial,floral-romance,
    dark-luxury,traditional-nusantara,soft-romantic}-template.test.tsx`:
    renders without crashing for a title-only event and for a fully
    populated one, and shows the resolved guest name when personalized.
    First use of `@testing-library/react` render tests in this codebase
    (the infrastructure — jsdom, `@testing-library/jest-dom`— already
    existed, just unused until now).
-   `components/invitation/templates/cross-template.test.tsx` (36 tests,
    `describe.each` across all 6 registered templates) — a non-wedding
    event with no `WeddingProfile` renders via the title fallback; a
    150-char event title, a 120-char guest name, a 500-char venue
    address, and a 500-char wish message all render without crashing; an
    anonymous (non-personalized) visitor sees the correct RSVP/Wishes
    explanatory fallback text, never a submittable form.

Integration tests (real Supabase DEV Postgres, no mocks):

-   `lib/invitations/projection.test.ts` (see above — technically a unit
    test file, but these 3 cases are the authoritative proof of the
    per-template theme merge, listed here for visibility).
-   `lib/editor/service.integration.test.ts` (+3 new, +2 updated) — the
    owner can select each of the 5 new templates through
    `selectTemplate()`; `listTemplateOptions()` flags every Phase 3
    seeded template as implemented; a genuinely unregistered template
    (synthetic row) is still correctly flagged as not implemented and
    still rejected by `selectTemplate()`.

E2E (real Supabase DEV database, real authenticated sessions — D-022):

-   `e2e/templates.spec.ts` (6 tests) — the editor's template picker
    shows all 6 templates as selectable (no more "Segera hadir" disabled
    state) and a new selection persists across reload; each of the 5 new
    templates, given a real published event with real schedule/venue/
    profile data and a real personalized guest token, renders correctly
    in an actual browser with **zero console errors** and **no
    horizontal overflow at 390×844** (measured via
    `document.documentElement.scrollWidth`/`clientWidth`, not just
    visual inspection).

### Known Limitations (this update)

-   **Visual "genuinely different" judgment is inherently partly
    subjective** — automated tests prove every template renders
    correctly and passes WCAG AA contrast; the "does it *look*
    meaningfully different" bar was verified this session via real
    screenshots (desktop + mobile, all 5 new templates, described above)
    and reviewed directly, but no automated visual-regression tooling was
    introduced (explicitly out of scope for this task) to catch future
    drift.
-   **Gallery/RSVP/Wishes visual states were not screenshotted with every
    possible data combination** — the screenshot pass used one
    representative fully-populated fixture per template (schedule×2,
    love story, gift method, one approved wish) rather than every
    permutation in the design audit's full visual-QA checklist (e.g., a
    10+ image gallery, an anonymous visitor's fallback copy) — those
    specific states are instead covered by the automated E2E/unit tests
    above, not by a screenshot.
-   **Traditional Nusantara's motif remains generic/abstract** —
    intentionally, per this phase's explicit cultural-sensitivity
    instruction; a more specific, attributed pattern is a deferred
    product decision, not an engineering gap.
-   **Section ordering remains fixed per template** — no event-level
    configurable section order/visibility was introduced (would need new
    schema/DTO fields, explicitly out of this update's reuse-the-current-
    contract scope); each template hard-codes its own section sequence,
    same as Minimal Elegant already did.

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

## Phase 6 --- RSVP & Guest Response Foundation

**Status:** Implemented and verified against the real Supabase DEV
Postgres database, including a real browser E2E flow through the actual
`/invite/[slug]?to=[token]` page. No fake/mocked RSVP persistence,
authorization, or seat-quota logic. No schema migration was required —
the Phase 0 `RSVP` model (`docs/DATABASE.md` §16) already had every field
and the `eventId+guestId` unique constraint this phase needs.

-   [x] RSVP domain layer (`lib/rsvp/`) — `service.ts` (token resolution,
    submit/upsert, dashboard read), `validation.ts` (Zod, reuses the
    existing `guestTokenSchema` from `lib/invitations/token.ts` rather
    than duplicating the token format check), `errors.ts`
    (`InvalidRsvpTokenError`, `SeatQuotaExceededError`, re-exports
    `EventNotFoundError`), `rate-limit.ts`, `labels.ts`, `types.ts`,
    `actions.ts` (the public `submitRsvpAction` Server Action).
-   [x] Personalized guest RSVP — integrated directly into the existing
    `InvitationRenderer` → template → sections pipeline (see D-025), not
    a parallel page. `components/rsvp/rsvp-section.tsx` (Server
    Component) renders either the real form or a plain "use your
    personal link" message; `components/rsvp/rsvp-form.tsx` (Client
    Component) is the actual interactive form (`useActionState`,
    pending/error/success states, always editable — see "Notable
    implementation decisions" below for why there's no separate
    read-only confirmation view).
-   [x] Server-side identity resolution — every read and write resolves
    the guest strictly from the `?to=` token via
    `resolveGuestForRsvp()` (internal, never exported), cross-checked
    against the caller's own `eventId`. No function in this domain
    accepts or trusts a client-supplied `guestId`; `submitRsvpAction`'s
    signature has no `guestId` parameter at all.
-   [x] Seat-quota enforcement — `attendeeCount <= guest.seatQuota` is
    checked server-side in `submitRsvpForGuest()` (`SeatQuotaExceededError`
    on violation), never trusting the form's own `max` attribute (a UI
    nicety only). A non-ATTENDING answer's attendee count is always
    forced to `0` regardless of what was submitted
    (`resolveAttendeeCount()`, unit-tested) — matches `docs/PRD.md` §21
    ("if attending, ask number of attendees").
-   [x] Upsert semantics, one RSVP per guest — `submitRsvpForGuest()`
    upserts on the existing `eventId+guestId` unique constraint inside a
    `$transaction` alongside the `GuestInvitation.status` update, so a
    repeat submission updates the same row rather than creating a second
    one. Directly proven at the database level (a raw second `create`
    for the same pair throws Prisma's `P2002`), not just asserted at the
    application layer.
-   [x] `GuestInvitation.status` lifecycle — every submission advances
    the invitation to `RSVPED` (never downgrading an already
    `CHECKED_IN` one) — see D-026.
-   [x] Dashboard RSVP overview
    (`/dashboard/events/[eventId]/rsvp`) — VIEWER-and-above (same read
    boundary as the Phase 5 guest list, D-023): total/attending/not
    attending/maybe/pending counts, total seats invited vs. confirmed
    seats, and a paginated per-guest list with attendance badge and
    private message. Counts are computed from the full guest/RSVP set via
    `groupBy`/`aggregate`, not from the current page, so pagination never
    skews the summary numbers.
-   [x] Rate limiting — `lib/rsvp/rate-limit.ts` applies the existing
    `lib/rate-limit/` in-memory limiter (20 submissions / 10 minutes per
    IP) to `submitRsvpAction`, per `docs/ARCHITECTURE.md` §28 explicitly
    listing RSVP as a rate-limited surface. Same documented caveat as
    `lib/auth/rate-limit.ts`: in-memory, single-process only — a
    temporary stopgap, not a substitute for a shared store (e.g. Redis)
    under multi-instance/serverless concurrency. The real defense against
    token-guessing is the token's own 192-bit entropy
    (`lib/guests/token.ts`), not this limiter.
-   [x] Loading/error/empty states — `rsvp/loading.tsx` skeleton, the
    shared not-found page for unauthorized/nonexistent events, inline
    field errors on the RSVP form, a real empty state on the dashboard
    when an event has no guests yet, clear Indonesian success/error/
    pending copy throughout (`belum mengisi RSVP`, `hadir`, `tidak
    hadir`, `belum pasti`).

### Security review findings

No new gaps were found in existing Phase 0-5 code during this phase. RSVP-
specific review points, all satisfied by the design above:

-   **IDOR / cross-event access** — a token whose guest belongs to a
    different event resolves to `null` identically to an unknown token
    (`InvalidRsvpTokenError`'s doc comment), proven directly: a guest
    created under Event A cannot have their RSVP read or written by
    passing Event B's id, even attempted by that same guest's rightful
    event owner.
-   **Client-controlled identity** — `submitRsvpAction(eventId, token,
    prevState, formData)` has no `guestId` parameter; `actions.test.ts`
    proves a malicious extra `guestId` form field is ignored and never
    reaches the service layer.
-   **Token leakage** — the raw token is never introduced as new public
    surface; it's the same value already visible in the page's own `?to=`
    query string, threaded through as an ordinary prop the same way
    `eventId`/`guestId` already are for `DeleteGuestButton` et al.
    (Phase 5). Dashboard reads never return a guest's token at all — the
    RSVP overview shows name/category/seats/attendance/message only.
-   **Guest enumeration** — a malformed token, an unknown token, and a
    foreign-event token all produce the exact same UI ("gunakan tautan
    undangan pribadi Anda") and the exact same server error
    (`InvalidRsvpTokenError`), so no response distinguishes "no such
    token" from "token for another event."
-   **Raw error leakage** — `mapRsvpErrorMessage()` logs server-side only
    and returns a generic Indonesian message for anything unexpected;
    covered in `errors.test.ts`.
-   **XSS** — no `dangerouslySetInnerHTML` anywhere in
    `components/rsvp/`; the guest's own message is rendered as ordinary
    JSX text (auto-escaped) both in the RSVP form's own success banner
    context and on the dashboard.
-   **Missing validation** — every field is Zod-validated
    (`rsvpFormSchema`), with the seat-quota bound enforced separately in
    the service layer since it's guest-specific data the static schema
    can't know.
-   **Non-personalized submission** — a public visitor without a token
    never sees a form at all (`RsvpSection` renders the static message
    instead), and even if the action were called directly with an
    empty/garbage token, `resolveGuestForRsvp()` still independently
    rejects it — the UI gate is a convenience, not the actual boundary.

### Notable implementation decisions

-   **The RSVP form is always shown editable — there is no separate
    read-only "confirmation" view.** An early draft toggled between an
    edit form and a read-only summary card after a successful submit, but
    collapsing to the summary automatically required a `setState` call
    inside a `useEffect` reacting to the action's result, which this
    project's lint rule (`react-hooks/set-state-in-effect`) correctly
    flags as an anti-pattern. Redesigned instead: the form stays visible
    and editable at all times, with a green confirmation banner shown
    above it after a successful submission — simpler, avoids the
    effect entirely, and more directly satisfies "existing RSVP is
    editable by the same guest" than a view that has to be un-collapsed
    first.
-   **RSVP resolution is fully separate from `lib/invitations/`** rather
    than extending the Phase 3 guest-context type — see D-025. Phase 3's
    files and tests needed zero changes for this phase.
-   **`GuestInvitation.status` transitions to RSVPED on every
    submission** — see D-026.

### Tests Added (Phase 6)

Pure unit tests (no database):

-   `lib/rsvp/validation.test.ts` (15 tests) — `rsvpFormSchema`: valid
    ATTENDING/NOT_ATTENDING/MAYBE answers, rejects ATTENDING with 0
    attendees, rejects an unknown attendance value, message length limit
    and empty-to-null handling, attendeeCount string coercion and upper
    sanity bound; `rsvpTokenSchema` format checks; `rsvpDashboardQuerySchema`
    safe fallback for a garbage page value
-   `lib/rsvp/errors.test.ts` (4 tests) — domain error → Indonesian
    message mapping (including the seat-quota number appearing in the
    message), confirms unexpected errors never leak raw details
-   `lib/rsvp/service.test.ts` (8 tests) — the two pure business-rule
    functions in isolation: `resolveAttendeeCount()` (forces 0 for
    non-ATTENDING regardless of submitted value) and
    `resolveNextInvitationStatus()` (advances every pre-RSVPED status to
    RSVPED, never downgrades CHECKED_IN)
-   `lib/rsvp/actions.test.ts` (5 tests) — rate-limit rejection
    short-circuits before validation/service; invalid input rejected
    without calling the service layer; a client-supplied `guestId` form
    field is proven ignored; a thrown domain error never leaks its raw
    message through the action

Integration tests (real Supabase DEV Postgres, no mocks):

-   `lib/rsvp/service.integration.test.ts` (20 tests) — the authoritative
    security/persistence proof: token resolution (valid, malformed,
    unknown, cross-event — all four cases directly tested for both the
    read path and the write path); creates a new RSVP and advances
    invitation status to RSVPED; upserts rather than duplicates on a
    second submission (row-count assertion); forces attendeeCount to 0
    for non-ATTENDING; rejects an attendee count above that specific
    guest's seat quota; **cross-event guest manipulation is impossible**
    even via a technically-valid token, confirmed by asserting zero rows
    were written; never downgrades CHECKED_IN back to RSVPED; **the
    database itself** (not just application logic) rejects a second RSVP
    row for the same event+guest pair (P2002); dashboard authorization
    (owner/VIEWER-role member allowed, stranger and nonexistent event
    rejected) and event-scoped counts (a guest/RSVP from a different
    event is never counted), including a multi-guest/multi-attendance
    count-accuracy test. Every row created is deleted in `afterEach`
    regardless of outcome — verified with a follow-up query showing zero
    leftover rows.

E2E (real Supabase DEV database, fixtures seeded directly via Prisma —
same rationale as `e2e/invitation.spec.ts`: the guest-facing RSVP flow is
public and unauthenticated, so no login is involved on this side at all):

-   `e2e/rsvp.spec.ts` (3 tests) — a non-personalized invitation (no
    token) shows the "use your personal link" message, never a form; a
    token belonging to a different event produces the identical message
    (not the form, not an error page); and one comprehensive scenario
    covering personalized guest opens the invitation → sees the RSVP
    form with their real name and seat quota → submits ATTENDING with an
    attendee count → sees the success banner → **reloads the page and
    confirms the answer persisted server-side** → changes their answer to
    NOT_ATTENDING → submits again → sees the updated confirmation →
    reloads again and confirms the update persisted. (Deliberately one
    test rather than several separate ones, since each step depends on
    the previous step's mutation and this project's Playwright config
    runs with `fullyParallel: true`.)
-   `e2e/invitation.spec.ts`'s existing "personalizes the greeting for a
    valid guest token" test was adjusted to `.first()` — a personalized
    guest's name now legitimately appears twice on the page (the
    existing greeting section, and the new RSVP section's own "Halo
    ..." prompt), the same class of strict-mode selector fix Phase 4
    already applied once for its own new markup. This is a selector
    disambiguation, not a weakened assertion — the test still requires
    the guest's real name to be visible on the page.
-   Confirmed via a full `npm run test:e2e` run: all pre-existing Phase
    0-5 E2E specs (auth, events, editor, guests, invitation, homepage)
    continue passing unmodified except for that one selector fix.

### Known Limitations

-   The in-memory rate limiter is a single-process stopgap (see "Rate
    limiting" above) — acceptable for the current single-instance
    deployment target, but would need a shared store (Redis or similar)
    before running multiple server instances in production.
-   No owner-initiated RSVP override (recording a guest's response on
    their behalf from the dashboard) — the brief scoped this phase to the
    guest-facing submission flow plus a read-only dashboard overview;
    "manage RSVP on behalf of a guest" would be new mutation surface
    beyond what was requested.
-   No RSVP charts/timeline (`docs/PRD.md` §22 mentions "RSVP
    distribution," "RSVP timeline," "RSVP by category" charts) — the
    phase brief explicitly said not to build a large analytics system
    yet; the counts table covers the same numbers without a charting
    library.
-   Wishes/guestbook (Roadmap Phase 10) and check-in (Roadmap Phase 14,
    `CHECKED_IN`) remain unimplemented — `RSVP.message` is a private note
    to the organizer shown only on the dashboard, deliberately distinct
    from the separate, moderated, publicly-displayed `Wish` model.

## Phase 7 --- Guest Personalization & Invitation Delivery Foundation

**Status:** Implemented and verified against the real Supabase DEV
Postgres database, including a real browser E2E flow. No fake/mocked
delivery, no simulated provider sends, no schema migration required —
`GuestInvitation`'s existing `token`/`status`/`sentAt`/`openedAt` columns
(Phase 0) already fully support this phase's lifecycle needs, and no new
delivery-state values were invented that nothing can actually verify.

-   [x] Shared invitation URL helper (`lib/guests/invitation-url.ts`) —
    `buildGuestInvitationUrl(eventSlug, token)` is now the single place
    that formats `/invite/[slug]?to=[token]`; the dashboard guest list
    page previously built this string inline and has been switched over.
    Defense-in-depth against a misconfigured `NEXT_PUBLIC_APP_URL`:
    rejects (throws) if the constructed URL isn't a safe http(s) URL via
    the existing `lib/invitations/url-safety.ts`, since the env schema's
    `.url()` check alone accepts any scheme.
-   [x] Per-guest "Invitation" dashboard view
    (`/dashboard/events/[eventId]/guests/[guestId]/invitation`) — shows
    guest name/category, invitation status badge, RSVP status badge (and
    the guest's actual answer/message when present), personalized-link
    availability, and — EDITOR/OWNER only — the real link with copy/
    regenerate controls plus a message preview. Linked from a new
    "Undangan" action on every guest-list row, visible to all roles
    (VIEWER included, since viewing invitation/RSVP metadata is a read
    permission per D-023's precedent).
-   [x] Token privacy hardened at the service layer — see D-027.
    `GuestListItem`/`GuestInvitationDetail` now type `invitationToken` as
    `string | null`, masked to `null` server-side for a VIEWER-resolved
    role rather than relying only on the page's rendering choice.
-   [x] Safe token regeneration — see D-028.
    `regenerateGuestInvitationToken()` (EDITOR/OWNER, IDOR-scoped,
    rate-limited) issues a fresh cryptographically random token, the old
    one stops resolving immediately, and it's never returned/logged
    again. Delivery-progress status (NOT_SENT/SENT/OPENED) resets to
    NOT_SENT; guest-action status (RSVPED/CHECKED_IN) is preserved.
    `RegenerateTokenButton` requires an explicit two-step confirmation
    with a clear warning that old shared links stop working.
-   [x] Invitation delivery abstraction (`lib/invitation-delivery/`) —
    see D-029. `InvitationDeliveryProvider` interface,
    `composeInvitationMessage()` (the real, working message
    personalization — guest name, event title, invitation URL, exact
    copy structure from `docs/PRD.md` §32), `buildWhatsAppShareUrl()` (a
    `wa.me` deep link, not a provider send), and `attemptDelivery()`
    (fully wired against the provider registry, always honestly reports
    "not configured" today since no real provider is registered). No
    "Send" action exists in the UI — there's nothing configured to send
    with, and a button whose only possible outcome is "not configured"
    would be exactly the "dead button" this product avoids.
-   [x] Message preview/compose (`components/guests/message-preview.tsx`)
    — a real, personalized message preview with "Salin Pesan" (clipboard
    copy) and "Buka WhatsApp" (opens the *operator's own* WhatsApp with
    the message pre-filled; hidden with an explanatory note when the
    guest has no phone number). Neither action is a Server Action or
    touches `GuestInvitation.status`/`sentAt` — copying or previewing a
    message is a client-side convenience, never recorded as a delivery.
-   [x] Rate limiting — `lib/guests/rate-limit.ts` applies the existing
    in-memory limiter to token regeneration (10 per 10 minutes, keyed by
    `userId` since this is an authenticated mutation, unlike RSVP's
    IP-keyed public limiter). Same documented single-process caveat as
    every other limiter in this codebase.
-   [x] Loading/error/empty states — `invitation/loading.tsx` skeleton,
    the shared not-found page for unauthorized/nonexistent
    events/guests, inline success/error feedback on the regenerate
    button, an honest "Nomor telepon belum diisi" note instead of a
    broken WhatsApp link.

### Security review findings (fixed in this phase)

-   **Guest invitation tokens were only VIEWER-safe by page-rendering
    convention, not by data-layer guarantee.** `lib/guests/service.ts`'s
    `getGuestPageData()` always returned the real token in
    `GuestListItem`; nothing prevented a future page/component from
    passing that object to a client component without re-checking the
    role first. Fixed by masking the token to `null` inside the service
    functions themselves for a VIEWER-resolved role — see D-027. Directly
    proven via a live-DB integration test (not just a page-level check)
    and an E2E test asserting the raw token string never appears
    anywhere in a VIEWER's rendered page.
-   No other new gaps were found. Existing Phase 3/4/5/6 protections
    (safe-URL filtering, IDOR-safe nested lookups, generic not-found
    responses, no `dangerouslySetInnerHTML`, rate limiting on public
    mutations) were reviewed and confirmed to already cover this phase's
    new surfaces without modification, except where noted above.

### Notable implementation decisions

-   **RSVP data stays out of `lib/invitations/`, and now so does delivery
    data** — see D-025 (Phase 6) and this phase's design: the per-guest
    Invitation page independently calls `lib/guests/service.ts`,
    `lib/rsvp/service.ts`, and `lib/invitation-delivery/`, composing
    their results at the page level rather than widening any shared DTO.
    Phase 3's `lib/invitations/*` files needed zero changes for this
    phase, same as Phase 6.
-   **Token regeneration status/timestamp semantics** — see D-028.
-   **No real delivery provider, `wa.me` is a deep link not a send** —
    see D-029. Read this before assuming "WhatsApp sharing" means the
    app can send messages — it cannot, by design, until a real provider
    is configured.
-   **Login rate limit raised from 10 to 30 per 10 minutes** — see D-030.
    Found while running the full E2E suite: the combined authenticated
    E2E login volume across phases had already reached the previous
    limit by Phase 6, and this phase's additional legitimate tests
    tripped it, breaking unrelated Phase 5/6 specs through a shared
    rate-limit bucket. Not a Phase 7 product feature, but a genuine fix
    required to keep the full regression suite green.

### Tests Added (Phase 7)

Pure unit tests (no database):

-   `lib/guests/invitation-url.test.ts` (5 tests) — correct URL shape,
    trailing-slash stripping, token URL-encoding, production https
    passthrough, throws on a misconfigured non-http(s) app URL
-   `lib/guests/service.test.ts` (5 tests) — `resolveInvitationAfterRegeneration()`:
    NOT_SENT/SENT/OPENED all reset to NOT_SENT with timestamps cleared;
    RSVPED/CHECKED_IN both preserved
-   `lib/guests/actions.test.ts` (+3 tests) — `regenerateInvitationTokenAction`:
    rate-limit rejection short-circuits before calling the service layer;
    the authenticated user's id (never a client-supplied field) reaches
    the service layer; a thrown domain error never leaks its raw message
-   `lib/invitation-delivery/message.test.ts` (2 tests) — the composed
    message includes the personalized guest name, event title, and URL,
    with no stray `undefined`/`null` artifacts
-   `lib/invitation-delivery/whatsapp.test.ts` (4 tests) — `wa.me` link
    construction with Indonesian phone normalization, message
    URL-encoding, and a `null` result for a missing/too-short phone
    number
-   `lib/invitation-delivery/providers.test.ts` (4 tests) — no provider
    is registered for any channel; `attemptDelivery()` always fails
    honestly and never throws; a fake provider proves the interface is
    genuinely implementable by something outside this module
-   `lib/invitation-delivery/errors.test.ts` (2 tests) — domain error →
    Indonesian message mapping; confirms unexpected errors never leak
    raw details

Integration tests (real Supabase DEV Postgres, no mocks):

-   `lib/guests/service.integration.test.ts` (+12 tests) —
    `getGuestPageData()` now directly asserts `invitationToken: null` for
    a VIEWER and the real token for EDITOR/OWNER (not just a page-level
    check); `getGuestInvitationDetail()`: token masking, cross-event IDOR,
    stranger rejection; `regenerateGuestInvitationToken()`: issues a new
    token and the old one stops resolving (row-level proof, not just a
    return-value check), status/timestamp reset vs. preservation rules,
    EDITOR-and-above role gating, cross-event IDOR (with a follow-up
    query proving the original token is untouched by the rejected
    attempt)
-   `lib/rsvp/service.integration.test.ts` (+5 tests) — `getRsvpForGuest()`:
    null before responding, the real answer after responding,
    VIEWER-and-above read access, stranger rejection, and never returning
    another event's RSVP for a guestId that happens to exist under a
    different event too

E2E (real Supabase DEV database and a real authenticated session — see
D-022):

-   `e2e/guest-invitation.spec.ts` (5 tests) — an owner sees the copy
    link/regenerate/message-preview controls and a correctly personalized
    message (guest name + event title) with a working WhatsApp link; an
    editor sees the identical controls; **a VIEWER sees status/metadata
    but the raw token string is absent from the entire rendered page**,
    and the copy-link/regenerate/message-preview controls don't exist in
    the DOM at all (not just visually hidden); regenerating the token
    makes the old personalized link stop working and the new one work
    correctly; a stranger gets the shared not-found page.
-   `e2e/invitation.spec.ts`'s existing "personalizes the greeting for a
    valid guest token" test needed a `.first()` selector fix — unrelated
    to this phase's logic, caused purely by the pre-existing RSVP section
    (Phase 6) also greeting the guest by name on the same page. Same
    class of fix already applied once before (Phase 6 for the same
    reason); not a weakened assertion.
-   Confirmed via a full `npm run test:e2e` run: all pre-existing Phase
    0-6 E2E specs continue passing (after the login rate-limit fix,
    D-030, and the one selector fix above).

### Provider Integrations Actually Implemented

**None.** No real WhatsApp Business API, SMS, or email provider is
configured or called. The only outbound-facing behavior is a `wa.me` deep
link that opens the dashboard operator's own WhatsApp client — this app
never transmits a message itself. See D-029.

### Known Limitations

-   No real automated message sending — by design (see D-029). Adding a
    real provider is future work requiring actual credentials/config,
    which this environment does not have.
-   No invitation open-tracking wiring (`GuestInvitationStatus.OPENED`,
    `openedAt`) on the public `/invite/[slug]?to=[token]` route — the
    columns and enum value exist and are fully supported by this phase's
    dashboard/regeneration logic, but nothing sets them yet. This
    preserves Phase 3's original reasoning (writing to the database on
    every public page view has real abuse-surface and load implications)
    now reinforced by the fact that this phase gives that write an actual
    consumer (the dashboard) for the first time — a deliberate scope
    boundary, revisit if/when open-tracking becomes a real product
    priority rather than expanding it opportunistically here.
    **Reconciled (post-Phase 15, re-audited as its own task):** this
    revisit happened, and the conclusion is that `OPENED`/`openedAt`
    should remain **intentionally, permanently unused** rather than
    implemented — not because it was never revisited, but because Phase
    15's `InvitationView` (with its own `guestId` association) now
    already represents this exact concept, and a per-guest write here
    would duplicate it with strictly worse characteristics (see D-052 for
    the full rationale, including a concrete bot/link-preview
    contamination risk specific to a per-guest dashboard indicator that
    doesn't apply the same way to an aggregate analytics count). No code
    change was made; this is a closed, documented architectural decision.
-   `SENT` similarly has no real setter — it's reserved for a future real
    provider confirming an actual send (D-029); nothing in this phase
    (copy link, copy message, open WhatsApp) is allowed to set it, by
    design, so in practice most guests will show NOT_SENT or
    RSVPED/CHECKED_IN today. **Reconciled (same re-audit):** this remains
    correct and unchanged — still blocked purely on a real delivery
    provider existing, not on any engineering gap. See D-052.
-   The in-memory rate limiter (used for both RSVP submission, Phase 6,
    and token regeneration, Phase 7) remains a single-process stopgap —
    see "Rate limiting" above.
-   The login rate-limit fix (D-030) addresses the *current* combined
    E2E login volume with headroom, not an unbounded amount — a future
    phase adding many more authenticated E2E logins could still need a
    proper per-test-run-isolated fix rather than another bump.

## Phase 8 --- RSVP Dashboard & Guest Response Management

**Status:** Implemented and verified against the real Supabase DEV
Postgres database, including a real browser E2E flow that submits a real
RSVP through the actual public invitation and confirms it appears on the
dashboard. No fake/mocked dashboard numbers, no schema migration required
— `RSVP` and `Guest` already had every field this phase needed (Phase 0),
and no new RSVP status/state machine was introduced (see "RSVP status
model" below).

-   [x] RSVP dashboard depth
    (`/dashboard/events/[eventId]/rsvp`) — now shows, in addition to
    Phase 6's existing counts: **response rate** (`Tingkat Respons`,
    a new rounded 0-100% metric), each guest's **invitation status**
    alongside their RSVP status, and each guest's **response timestamp**
    when they've answered. Server-side **search** (name/phone/email),
    **status filter** (Akan hadir / Tidak hadir / Belum pasti / Belum
    merespons / Semua — "Belum merespons" is a dashboard-only filter
    concept, not a new `RSVPAttendance` value, see "RSVP status model"
    below), **category filter**, and **name sort** were added, mirroring
    `lib/guests/`'s already-established query pattern. All event-scoped,
    all server-side (no client-side filtering of an unbounded fetch).
-   [x] Summary counts stay whole-event, the table is what filters — see
    D-031. A search/filter/sort that narrows the table to zero rows still
    correctly reports the real event-wide guest count in the summary
    cards, and is visually distinguished from "no guests at all" (see
    "Empty states" below).
-   [x] RSVP CSV export
    (`/dashboard/events/[eventId]/rsvp/export`) — a new authenticated,
    VIEWER-and-above, event-scoped Route Handler. Columns: name,
    category, RSVP status, attendee count, response timestamp (ISO 8601),
    guest message. Reuses `lib/guests/csv.ts`'s `toCsv()` (the same
    formula-injection-safe serializer Phase 5 already built and
    unit-tested) rather than a second CSV implementation. Never includes
    invitation tokens — same principle as `lib/guests/service.ts`'s
    `exportGuestsToCsv`.
-   [x] RSVP status surfaced on the guest management list
    (`/dashboard/events/[eventId]/guests`) — each guest row now shows an
    `RsvpStatusBadge` alongside their category and invitation-status
    badges, so an owner/editor/viewer doesn't need to open the RSVP
    dashboard just to see whether a specific guest has responded.
    Fetched in the same query as the rest of the guest list (`GUEST_SELECT`
    gained a `rsvps: { select: { attendance: true } } }` relation select)
    — no extra round trip, no N+1.
-   [x] Per-guest RSVP detail — extended the existing Phase 7 invitation
    page rather than adding a new route; see D-033. Now shows the
    response's submitted timestamp and an explicit "Tamu ini belum
    mengisi RSVP." message when there's no response yet, in addition to
    the attendance/attendee-count/message it already showed.
-   [x] One authoritative normalization path — `calculateResponseRate()`
    and `normalizeConfirmedSeats()` (`lib/rsvp/service.ts`, both pure and
    unit-tested) are the only places the dashboard computes a response
    rate or a confirmed-seats total; nothing duplicates this logic
    elsewhere. `resolveAttendeeCount()` (Phase 6) remains the sole
    attendee-count normalization path — the dashboard reads its already-
    normalized output, it doesn't re-derive attendee counts itself.
-   [x] Defensive floor on confirmed seats for "malformed/impossible
    persisted values" — see D-032.
-   [x] Empty states distinguish three cases, per the phase brief: (1) no
    guests at all → the existing "Belum ada tamu" empty state with a
    "Tambah Tamu" call to action; (2) guests exist but nobody has
    responded yet → the guest list still renders (every row correctly
    shows "Belum Mengisi RSVP"), with a contextual banner above the
    filter form explaining why the counts are all zero, rather than
    presenting bare zeroes with no explanation; (3) a search/filter
    matches nothing → "Tidak ada tamu yang cocok dengan pencarian/filter
    ini.", distinct from case 1's copy.
-   [x] Loading/error states — `rsvp/loading.tsx` skeleton (already
    existed from Phase 6, unchanged), the shared not-found page for
    unauthorized/nonexistent events, no new error states needed since
    this phase added no new mutation surface.

### Security review findings

No new gaps were found — this phase is read-side only (dashboard queries
and a CSV export), and the review below confirms it doesn't reopen
anything Phase 5-7 already closed:

-   **IDOR** — every new/changed query (`getRsvpDashboardData`,
    `exportRsvpToCsv`, the extended `getRsvpForGuest`) still requires
    `getAuthorizedEvent(eventId, userId, minRole)` before touching any
    data, and the guest-list `rsvps` relation select can only ever return
    rows for that guest's own event (a `Guest` belongs to exactly one
    event; see the comment on `GUEST_SELECT`). Proven directly: an
    integration test creates two events for the same owner and confirms
    a search/filter/sort call against event B never returns or counts
    event A's guests.
-   **Token leakage** — grepped: no new or changed file in
    `lib/rsvp/`, the RSVP dashboard page, or the RSVP export route
    references `invitationToken`/`.token` at all. The CSV export
    integration tests assert the exported text never contains the raw
    token string.
-   **Client-controlled identity** — `getRsvpDashboardData`/
    `exportRsvpToCsv` derive `userId` from `requireAppUser()` exclusively
    (never a client-supplied value); `eventId` always comes from the
    route segment and is re-validated by `getAuthorizedEvent()` on every
    call, never trusted from a query string.
-   **CSV formula injection** — inherited for free by reusing
    `lib/guests/csv.ts`'s `toCsv()`, which already neutralizes a leading
    `=`/`+`/`-`/`@` in any cell (Phase 5's existing, already-unit-tested
    defense). No new CSV serialization logic was written for this phase.
-   **No fake/hardcoded dashboard numbers** — every number on the
    dashboard is a real Prisma aggregate/count against the live database;
    nothing is computed from a placeholder or a client-supplied value.

### RSVP status model (unchanged, not reinterpreted)

Phase 8 introduces **no new RSVP state machine**. `RSVPAttendance`
(`ATTENDING`/`NOT_ATTENDING`/`MAYBE`) and `GuestInvitationStatus`
(`NOT_SENT`/`SENT`/`OPENED`/`RSVPED`/`CHECKED_IN`) remain exactly as
Phase 0 defined them and Phase 6/7 already used them. The dashboard's
`"PENDING"`/`"ALL"` status-filter values (`rsvpStatusFilterSchema` in
`lib/rsvp/validation.ts`) are explicitly **not** additional
`RSVPAttendance` values — they're query-parameter-only concepts meaning
"no RSVP row exists yet" and "no filter applied," respectively, and are
never written to the database. `RsvpGuestRow.invitationStatus` (new this
phase) reads the existing `GuestInvitationStatus` column as-is; nothing
about its meaning was changed.

### Tests Added (Phase 8)

Pure unit tests (no database):

-   `lib/rsvp/service.test.ts` (+10 tests) — `calculateResponseRate()`:
    no-guests-yet returns 0 (never divides by zero), 0%/100%/rounded
    fractional cases; `normalizeConfirmedSeats()`: normal sum, `null` →
    0, a defensively-floored negative sum → 0
-   `lib/rsvp/validation.test.ts` (+14 tests) — `rsvpDashboardQuerySchema`:
    every real status/category value accepted, the dashboard-only
    `PENDING` filter accepted, safe fallback to `ALL`/`name_asc` for
    garbage status/category/sort values, search-term trimming and
    empty-to-undefined handling
-   `lib/invitations/format.test.ts` (+3 tests) — `formatIndonesianDateTime()`:
    correct short-month formatting, zero-padded hours/minutes, no
    timezone-shift artifacts (explicit UTC, matching
    `formatIndonesianDate()`'s existing convention)

Integration tests (real Supabase DEV Postgres, no mocks):

-   `lib/rsvp/service.integration.test.ts` (+11 tests) — dashboard search/
    status(including PENDING)/category filtering and name sort, each
    proven to leave the whole-event summary counts unchanged (D-031); a
    combined filter that matches nothing returns an empty table with the
    real guest count still shown; invitation status correctly joined
    alongside RSVP status; a full new `exportRsvpToCsv` suite (VIEWER
    access, stranger rejection, token exclusion, a not-yet-responded
    guest exported as "Belum merespons", cross-event isolation)
-   `lib/guests/service.integration.test.ts` (+2 tests) — `getGuestPageData()`
    correctly surfaces `null` for a guest with no RSVP and the real
    `RSVPAttendance` value once one exists, proven against live data (not
    just the page's rendering choice)

E2E (real Supabase DEV database and a real authenticated session — see
D-022):

-   `e2e/rsvp-dashboard.spec.ts` (5 tests) — a **real public RSVP
    submission** through the actual `/invite/[slug]?to=[token]` flow
    (proving Phase 6 hasn't regressed) appears correctly on the
    authenticated dashboard; search filtering narrows the table while the
    "Total Tamu" summary card stays at the true event-wide count; CSV
    export is authenticated (fetched via the same browser session,
    `page.request`), event-scoped, and excludes the invitation token; a
    VIEWER-role member can open the dashboard read-only; a stranger gets
    the shared not-found page.
-   `e2e/guest-invitation.spec.ts` — two pre-existing assertions needed a
    `.first()` fix after this phase added a second, legitimate occurrence
    of "belum mengisi RSVP" text (the new explicit no-response message)
    to the same page the existing "Belum Mengisi RSVP" status badge was
    already on — the same class of strict-mode selector fix Phase 6/7
    already applied twice for the same underlying reason (new, correct
    UI content legitimately repeating text an older test's selector
    wasn't written to expect twice). Not a weakened assertion.
-   Confirmed via a full `npm run test:e2e` run: all pre-existing Phase
    0-7 E2E specs continue passing.

### Known Limitations

-   No RSVP charts/timeline (`docs/PRD.md` §22 also mentions "RSVP
    distribution," "RSVP timeline," "RSVP by category" charts) — same
    scope trim Phase 6 already documented; the counts/table cover the
    same numbers without a charting library, and the phase brief warned
    against "excessive dashboard complexity."
-   Sorting is name-only (A-Z / Z-A) — sorting by response timestamp was
    considered and deliberately not implemented: `submittedAt` lives on
    the `RSVP` relation, and Prisma doesn't support ordering a
    `Guest.findMany()` by an arbitrary field of a to-many relation
    without either excluding guests with no RSVP row (breaking
    completeness) or fetching the entire unpaginated guest set to sort in
    memory (defeating server-side pagination for large guest lists).
    Name sort was already the existing guest-list convention.
-   No event-capacity handling — `docs/DATABASE.md`'s `Event` model has
    no capacity/venue-limit field, so "event capacity where applicable"
    genuinely does not apply yet; nothing was invented to simulate one.
-   No owner-initiated RSVP mutation (recording/editing a response on a
    guest's behalf) — the phase brief was explicit that this is a
    read-side phase; no such control was added.

Follow `docs/ROADMAP.md`. Do not mark later phases complete here without
implementation and verification evidence.

## Phase 9 --- Digital Gift / Angpao Foundation

**Status:** Implemented and verified against the real Supabase DEV
Postgres database, including a real browser E2E flow. No schema
migration required — `GiftMethod` (Phase 0) already had every field this
phase needed. No fake payment processing, transaction settlement, or
payment verification of any kind was added.

-   [x] Gift method dashboard (`/dashboard/events/[eventId]/gifts`) —
    list, create, edit, delete. Reuses `GiftMethod`'s existing four
    conceptual types (`BANK`/`EWALLET`/`QR`/`OTHER`) and its existing
    fixed column set (`providerName`/`accountName`/`accountNumber`/
    `qrImageUrl`/`instructions`) for every type, including the brief's
    "physical gift/address" concept, mapped onto `OTHER` — see D-034 for
    why no new type/column was added.
-   [x] Authorization — OWNER/EDITOR can create/edit/delete, VIEWER is
    read-only, matching the guest list's established read boundary
    (D-023). Every mutation re-verifies `{ id: giftMethodId, eventId }`
    before touching a row (never `giftMethod.update({ where: { id } })`
    alone) — proven directly by IDOR integration tests (cross-event
    update/delete rejected, the target row provably untouched
    afterward).
-   [x] Server-side validation (`lib/gifts/validation.ts`) — a
    cross-field `superRefine` enforces the fields each type actually
    needs (`BANK`/`EWALLET` require a provider name + account number,
    `QR` requires an image URL, `OTHER` requires a title + instructions)
    without forcing irrelevant fields on the other types. `qrImageUrl`
    reuses the existing `isSafeHttpUrl()` guard (http/https only, no
    `javascript:`) that `lib/editor/validation.ts` already established
    for every other owner-supplied image/link field. Account
    number/identifier fields only bound length — no format forced, per
    the brief's explicit instruction not to over-restrict legitimate
    Indonesian bank/e-wallet formats.
-   [x] `sanitizeGiftMethodInput()` (`lib/gifts/service.ts`, pure,
    unit-tested) nulls out whichever columns don't apply to the
    submitted `type` before every create/update, so a method that was
    switched from QR to BANK (for example) never keeps a stray
    `qrImageUrl` value in storage.
-   [x] Public "Kirim Hadiah" section
    (`components/invitation/sections/gift-section.tsx`) — added to
    `MinimalElegantTemplate` through the existing `InvitationRenderer` →
    template → sections pipeline, no second rendering path. Reads
    `invitation.giftMethods` directly off the same `PublicInvitation`
    object every other section reads from (see D-035, contrasting with
    how RSVP data is deliberately resolved separately, D-025) — zero
    changes needed to `app/invite/[slug]/page.tsx`. Hidden entirely
    (returns `null`) when no active gift method is configured — no
    placeholder/empty-state content, per CLAUDE.md §9E and §1.5.
-   [x] Copy-to-clipboard (`components/gifts/copy-value-button.tsx`) —
    used for the account number and, for a physical-gift (`OTHER`)
    method, the address. Never reports success unless
    `navigator.clipboard.writeText` actually resolves; never sends the
    copied value anywhere (no analytics, no network call) — same
    contract as the existing `CopyInviteLinkButton`/`MessagePreview`.
-   [x] Account numbers are shown in full, not masked — see D-036 for
    why this differs from how `GuestInvitation.token` is treated.
-   [x] Indonesian dashboard UX — "Hadiah", "Metode Hadiah", "Tambah
    Metode", "Bank Transfer" → "Transfer Bank", labels adapted per type
    (`lib/gifts/labels.ts`'s `GIFT_METHOD_FIELD_LABELS`), a two-step
    inline delete confirmation (same pattern as
    `DeleteGuestButton`/`DeleteGiftMethodButton`), and an empty state
    ("Belum ada metode hadiah.") with its own call to action.
-   [x] Loading/error states — `gifts/loading.tsx` skeleton, the shared
    `not-found.tsx` for unauthorized/nonexistent events, inline field
    errors + a pending "Menyimpan..." state on the form (same
    `useActionState` pattern as every other form in the app).

### Security review findings

-   **IDOR** — every gift-method query/mutation requires
    `getAuthorizedEvent(eventId, userId, minRole)`, and every mutation
    additionally re-verifies `{ id: giftMethodId, eventId }` before
    acting. Proven directly: creating a method under Event A and then
    calling update/delete against it via Event B's id is rejected with
    `GiftMethodNotFoundError`, and the row is confirmed unchanged/still
    present afterward.
-   **Public projection scoping** — `PUBLIC_EVENT_INCLUDE`'s
    `giftMethods` relation is filtered to `isActive: true` and selects
    only display columns (never `eventId`/`isActive`/timestamps);
    proven by both a unit test (fabricated input asserting the excluded
    properties) and an integration test creating a gift method on a
    *different* event and confirming it never appears in the first
    event's public invitation.
-   **No secret/token exposure** — grepped: no file under `lib/gifts/`,
    `components/gifts/`, the gifts dashboard routes, or the gift section
    component references `invitationToken`/`.token` at all; this domain
    has no relationship to the guest-token system.
-   **URL safety** — `qrImageUrl` is validated as http/https-only at
    the write boundary (`isSafeHttpUrl`) and re-filtered again at the
    public-read boundary (`toSafeHttpUrl`, same defense-in-depth pattern
    every other public image/link field already uses) — proven by a
    unit test asserting a `javascript:` QR image URL is rejected on
    write and, separately, stripped on read even if one somehow reached
    the database.
-   **No sensitive-value logging** — grepped: no `console.*` call in
    `lib/gifts/` includes an account number, instructions, or any other
    submitted field value; `mapGiftErrorMessage()` logs the raw `Error`
    object only, matching every other domain's error-mapping
    convention.
-   **No fake functionality** — grepped and manually reviewed: no code
    in this phase marks a transfer as paid, generates a fake
    transaction id, or fabricates any provider response. `GiftTransaction`
    is untouched.

### `GiftRegistry`/`GiftTransaction` status

Both remain fully deferred — see D-037. No service, no UI, no schema
change. `GiftTransaction` in particular needs a real payment-provider
integration (webhook signature verification, provider credentials) that
does not exist yet and which CLAUDE.md §7.4/§1.4 forbid faking;
`GiftRegistry`/`GiftItem`/`GiftReservation` need their own
concurrency-safe availability/duplicate-reservation logic
(`docs/PRD.md` §29) that would be a guess if bolted onto this phase
rather than built as its own roadmap item (`docs/ROADMAP.md` Phase 17).

### Tests Added (Phase 9)

Pure unit tests (no database):

-   `lib/gifts/errors.test.ts` (3 tests) — Indonesian error-message
    mapping, confirms an unexpected error's raw message (containing a
    fake account number) never leaks into the returned string
-   `lib/gifts/validation.test.ts` (14 tests) — per-type required-field
    enforcement (BANK/EWALLET need provider+account number, QR needs an
    image URL, OTHER needs a title+instructions), unsafe `javascript:`
    QR URL rejection, FormData empty-string-to-null handling, checkbox
    (`isActive`) semantics, max-length enforcement
-   `lib/gifts/service.test.ts` (5 tests) — `sanitizeGiftMethodInput()`:
    correct column nulling for every type, confirms the input object
    itself is never mutated
-   `lib/gifts/actions.test.ts` (6 tests) — server-side validation
    short-circuits before the service layer runs, a client-supplied
    `userId` form field is ignored, `notFound()` on
    `EventNotFoundError`/`GiftMethodNotFoundError`
-   `lib/invitations/projection.test.ts` (+3 tests) — a configured gift
    method's display fields map correctly, an unsafe QR image URL is
    stripped, `eventId`/`isActive`/timestamps are never present on the
    public DTO

Integration tests (real Supabase DEV Postgres, no mocks):

-   `lib/gifts/service.integration.test.ts` (18 tests) — full CRUD
    authorization matrix (owner/editor can mutate, viewer cannot,
    stranger cannot, nonexistent event rejected), cross-event IDOR
    protection on read/update/delete with the target row proven
    unchanged, `sanitizeGiftMethodInput()`'s effect verified against
    actually-persisted rows, deletion proven event-scoped (deleting one
    event's method never removes another's)
-   `lib/invitations/service.integration.test.ts` (+4 tests) — an active
    gift method renders on the public invitation, an inactive one is
    excluded, another event's gift method never leaks across, an event
    with none configured returns an empty array (not an error)

E2E (real Supabase DEV database; dashboard tests drive a real
authenticated session — D-022):

-   `e2e/gifts-dashboard.spec.ts` (7 tests) — an owner can create, edit,
    and delete a gift method end-to-end through the real UI; an editor
    can create an `OTHER` (manual/physical-gift) method with its
    type-specific field labels; a viewer sees the list with no
    create/edit/delete controls; a stranger gets the shared not-found
    page; the public invitation displays a configured active method
    with a visible copy button; the gift section is completely absent
    when no method is configured; an inactive method never appears
    publicly
-   Confirmed via a full `npm run test:e2e` run: all 39 pre-existing
    Phase 0-8 E2E tests continue passing (46/46 total)

### Known Limitations

-   The invitation editor's live preview (`lib/editor/preview.ts`) does
    not reflect gift methods — they're managed on their own dedicated
    dashboard page, not the editor, so there's no unsaved/in-progress
    gift state for the preview to show. The real published invitation
    still renders whatever is actually configured; this only affects
    what the editor's preview panel specifically shows.
-   No reorder/sort-order control for gift methods — `GiftMethod` has no
    `sortOrder` column (unlike `Gallery`/`LoveStory`, which do), so
    methods are listed in creation order. Adding one would be a schema
    change not otherwise required by this phase's scope; the brief
    itself made reordering conditional on "if schema/UI supports
    ordering."
-   `GiftRegistry`/`GiftItem`/`GiftReservation`/`GiftTransaction` are
    fully deferred — see "Status" above and D-037.
-   No editor-panel integration — gift methods are a dedicated dashboard
    section (`/dashboard/events/[eventId]/gifts`), not part of the
    Phase 4 editor shell, following the brief's own fallback ("if the
    editor architecture is not appropriate ... keep gift management as
    a dedicated dashboard section"). The public invitation still reads
    real, live gift data regardless of where it's managed.

## Phase 10 --- Wishes / Guestbook Foundation

**Status:** Implemented and verified against the real Supabase DEV
Postgres database, including full authenticated + guest-facing browser
E2E coverage (see D-022). No fake/mocked authorization, persistence, or
moderation logic. No schema migration was required — the Phase 0 `Wish`
model (`id`, `eventId`, `guestId`, `name`, `message`, `status`,
`createdAt`, `updatedAt`, indexed on `eventId, status`) and `WishStatus`
enum (`PENDING`/`APPROVED`/`HIDDEN`/`DELETED`) already covered everything
this phase needs, exactly as specified in `docs/DATABASE.md` §17.

-   [x] Guest-facing submission (`components/wishes/wish-form.tsx`,
    `lib/wishes/actions.ts`'s `submitWishAction`) — name + message, only
    reachable from a personalized invitation (`?to=` token). Guest
    identity is **always** resolved server-side from the token
    (`lib/wishes/service.ts`'s `resolveGuestForWish()`, private/never
    exported) — the Server Action never accepts or trusts a client-supplied
    `guestId`. A malformed, unknown, or cross-event token all resolve
    identically to `InvalidWishTokenError` (IDOR-safe: a caller can't
    distinguish "no such token" from "token for another event"), matching
    `lib/rsvp/service.ts`'s established `resolveGuestForRsvp()` pattern.
-   [x] Public rendering (`components/invitation/sections/wishes-section.tsx`)
    — renders every submitted `message`/`name` as plain JSX text
    interpolation only; no `dangerouslySetInnerHTML` anywhere in this
    phase's code. Mirrors `RsvpSection`'s always-render behavior: a
    personalized visitor sees a real, working form; an anonymous visitor
    sees a truthful explanatory note instead ("Ucapan hanya dapat dikirim
    melalui tautan undangan pribadi Anda") — never a blank/fake section,
    since the note is genuine information, not a placeholder.
-   [x] Rate limiting + per-guest submission cap (see D-038) —
    `lib/wishes/rate-limit.ts` (10 submissions per 10 minutes per IP,
    using the existing `lib/rate-limit/` infrastructure, same pattern as
    RSVP) plus `WISH_PER_GUEST_LIMIT = 3` (a plain `prisma.wish.count()`
    check against the existing schema — no migration). No CAPTCHA or
    external moderation provider was added; none is required by the
    canonical docs and the brief explicitly ruled them out absent that
    requirement.
-   [x] Moderation dashboard (`/dashboard/events/[eventId]/wishes`,
    `lib/wishes/service.ts`'s `getWishesForModeration()`/
    `approveWishForUser()`/`hideWishForUser()`/`deleteWishForUser()`) —
    list is VIEWER-and-above readable (matching the guest list's/RSVP
    dashboard's established D-023 read boundary); approve/hide/delete all
    require EDITOR-and-above. Every mutation re-verifies `{ id: wishId,
    eventId }` via `findFirst` before acting — never `wish.update({
    where: { id } })` alone — the same IDOR pattern established for gift
    methods and nested editor entities.
-   [x] Soft delete (see D-038) — "Delete" sets `WishStatus.DELETED`
    rather than removing the row; the dashboard's default "ALL" filter
    excludes deleted wishes, with an explicit `DELETED` filter option to
    view them. A `HIDDEN` wish can be re-approved.
-   [x] Public projection extension (see D-039) — `lib/invitations/
    projection.ts`'s `PUBLIC_EVENT_INCLUDE` gained a `wishes` relation
    (`where: { status: APPROVED }`, select `id`/`name`/`message`/
    `createdAt` only — never `guestId`/`eventId`/`status`/moderation
    history), mapped onto a new `PublicInvitation.wishes` field. The
    submission-identity context a template needs (`wishGuest`) reuses the
    guest display name already resolved for `invitation.guest` — **zero
    new database queries** were added to `app/invite/[slug]/page.tsx`.
-   [x] Loading/error/empty/unauthorized states — `wishes/loading.tsx`
    skeleton, the shared not-found page for unauthorized/nonexistent
    events, a real empty state ("Belum ada ucapan."), inline Indonesian
    field errors on the submission form, an honest "Gagal mengirim ucapan"
    class of message (never a raw Prisma error) on every failure path.

### Security review findings

No new gaps were found in existing code during this phase (Phase 4/7/9
already closed the `javascript:`/`data:` URL, token-masking, and IDOR
classes of issue this phase's surfaces could otherwise repeat). Wish-specific
review points, all satisfied by the design above:

-   **IDOR** — every wish query/mutation requires `getAuthorizedEvent(eventId,
    userId, minRole)`, and every mutation additionally re-verifies
    `{ id: wishId, eventId }` before acting. Proven directly: creating a
    wish under Event A and then calling approve/hide/delete against it via
    Event B's id is rejected with `WishNotFoundError`, and the row is
    confirmed unchanged/still `PENDING` afterward
    (`lib/wishes/service.integration.test.ts`).
-   **`guestId` never trusted from the client** — `submitWishAction`
    (`lib/wishes/actions.ts`) only ever accepts `eventId`/`token` as
    server-bound parameters (from the already-resolved invitation page)
    and `name`/`message` from the form; a malicious extra `guestId` form
    field is proven ignored (`lib/wishes/actions.test.ts`).
-   **No token leakage** — wish moderation/public code paths never
    reference `GuestInvitation.token`; grepped, confirmed no overlap with
    the guest-token domain at all (a wish only ever stores the resolved
    `guestId`, not the token used to resolve it).
-   **Public projection scoping** — proven by both a unit test
    (`lib/invitations/projection.test.ts`, fabricated input asserting the
    excluded properties) and an integration test
    (`lib/invitations/service.integration.test.ts`) creating a wish on a
    *different* event and confirming it never appears in the first
    event's public invitation, plus confirming `PENDING`/`HIDDEN`/
    `DELETED` wishes never appear regardless of event.
-   **Unauthorized moderation** — a VIEWER-role member and a stranger are
    both proven rejected (`EventNotFoundError`, IDOR-safe — identical to
    "event doesn't exist") for every moderation action, at both the
    integration-test and E2E level.
-   **No unsafe URL/content handling** — wishes carry no URL field at
    all (just `name`/`message` plain text), so `lib/invitations/
    url-safety.ts` doesn't apply here; every rendered value goes through
    ordinary JSX text interpolation (React's automatic escaping), never
    `dangerouslySetInnerHTML` — grepped and confirmed absent from every
    file this phase touches.
-   **No raw database errors exposed** — `mapWishErrorMessage()`
    (`lib/wishes/errors.ts`) logs the raw `Error` server-side only and
    returns a generic Indonesian message for anything unexpected, matching
    every other domain's established error-mapping convention. Tested
    directly: an error containing a fake wish message never leaks into
    the returned string.
-   **Missing rate limits** — closed by `lib/wishes/rate-limit.ts` (IP)
    plus the per-guest submission cap (D-038); both are exercised in the
    integration suite.

### Tests Added (Phase 10)

Pure unit tests (no database):

-   `lib/wishes/validation.test.ts` (14 tests) — `wishFormSchema`:
    trimming, empty/over-length name and message rejection, the 500-char
    boundary; `wishStatusFilterSchema`/`wishModerationQuerySchema`: every
    `WishStatus` value + `ALL` accepted, malformed query input always
    falls back to safe defaults rather than erroring
-   `lib/wishes/errors.test.ts` (5 tests) — Indonesian error-message
    mapping for every domain error, confirms an unexpected error's raw
    message never leaks into the returned string
-   `lib/wishes/actions.test.ts` (8 tests) — rate-limit short-circuit
    (service layer never called when rate-limited), server-side validation
    short-circuits before the service layer runs, a client-supplied
    `guestId`/`userId` form field is proven ignored, `notFound()` on
    `EventNotFoundError`/`WishNotFoundError` for every moderation action
-   `lib/invitations/projection.test.ts` (+2 tests) — a wish's display
    fields map correctly; `guestId`/`eventId`/`status`/`updatedAt` are
    never present on the public DTO

Integration tests (real Supabase DEV Postgres, no mocks):

-   `lib/wishes/service.integration.test.ts` (18 tests) — token resolution
    (valid/malformed/unknown/cross-event, all IDOR-safe), the per-guest
    submission cap (enforced, deleted wishes excluded from the count,
    independent per guest), full moderation authorization matrix
    (owner/editor can moderate, viewer cannot, stranger cannot),
    cross-event IDOR protection on every moderation action with the
    target row proven unchanged, the default-`ALL`-excludes-`DELETED`
    filter behavior, soft-delete row survival, HIDDEN→APPROVED
    re-approval
-   `lib/invitations/service.integration.test.ts` (+4 tests) — an
    APPROVED wish renders on the public invitation; PENDING/HIDDEN/DELETED
    wishes never appear; another event's wish never leaks (including a
    direct check that its `guestId`/`eventId`/`status` never appear in the
    serialized payload); an event with none approved returns an empty
    array (not an error)

E2E (real Supabase DEV database; dashboard tests drive a real
authenticated session — D-022; guest-facing tests are public/
unauthenticated, Prisma-seeded — same pattern as `e2e/rsvp.spec.ts`):

-   `e2e/wishes.spec.ts` (5 tests) — a non-personalized invitation cannot
    submit a wish (shows the explanatory note, no form); a token
    belonging to a different event cannot submit for this event; **the
    full acceptance flow in one test** (a guest submits a wish through
    the real public form → it is not yet publicly visible → it appears as
    `PENDING` in the authenticated dashboard → the owner approves it → it
    becomes visible on the public invitation → the owner hides it → it
    disappears from the public invitation again); a viewer sees the
    moderation list with no approve/hide/delete controls; a stranger gets
    the shared not-found page for another owner's wishes dashboard
-   Confirmed via a full E2E run: all 46 pre-existing Phase 0-9 E2E tests
    continue passing (51/51 total)

### Known Limitations

-   The invitation editor's live preview (`lib/editor/preview.ts`) does
    not reflect wishes — same rationale as gift methods (D-034): wishes
    are moderated on their own dedicated dashboard page, not the editor,
    so there is no unsaved/in-progress wish state for the preview to
    show. The real published invitation still renders whatever is
    actually approved.
-   No search/sort on the moderation list beyond the status filter — the
    brief scoped this to approve/hide/delete plus PRD §23's explicit
    requirements; a guest list-style search was not requested and would
    be scope beyond what's needed for a first moderation pass.
-   No owner-initiated wish creation (posting a wish on a guest's behalf)
    — out of scope; the brief and PRD both describe wishes as
    guest-submitted content only.
-   The per-guest submission cap (`WISH_PER_GUEST_LIMIT = 3`, D-038) is a
    plain count check, not a database-enforced constraint (the schema has
    no `@@unique([eventId, guestId])` on `Wish`, unlike RSVP) — this is a
    deliberate, documented choice per the brief's explicit instruction not
    to invent a migration for it.

## Phase 11 --- Gallery Foundation

**Status:** Implemented and verified against the real Supabase DEV
Postgres database *and* real Supabase Storage (the connected project's
actual configured bucket — see "Bucket note" below), including full
authenticated browser E2E coverage (D-022) exercising genuine file
uploads. No fake/mocked authorization, persistence, upload, or storage
logic. No schema migration was required — `Gallery`/`GalleryItem`'s
existing columns (`sortOrder` on both, `type`/`url`/`thumbnailUrl`/
`caption` on `GalleryItem`) already covered everything this phase needs,
confirmed rather than assumed (see D-041 for the specific case the brief
asked to verify before skipping a migration: whether a dedicated
storage-object-path column was needed for reliable deletion — it wasn't).

-   [x] Storage provider abstraction (`lib/storage/`) — `types.ts`'s
    `StorageProvider` interface (`upload`/`remove`), `supabase-provider.ts`
    (the only module that touches `createSupabaseServiceClient()` for
    gallery uploads — the service-role key never reaches the browser),
    `provider.ts` (the factory seam business logic depends on, per
    ARCHITECTURE.md §23's provider-abstraction convention, matching
    `lib/invitation-delivery/`'s existing shape).
-   [x] Real image upload (`lib/editor/service.ts`'s `uploadGalleryImage()`,
    `lib/editor/actions.ts`'s `uploadGalleryImageAction`,
    `components/editor/sections/gallery-form.tsx`) — a real
    `<input type="file">` + FormData flow (not JSON, since a `File` can't
    be represented as the plain object every other editor action accepts).
    EDITOR-and-above only (the editor route already gates VIEWER out
    entirely — D-021), rate-limited (`lib/editor/gallery-rate-limit.ts`,
    20 uploads/10min per user, userId-keyed since this is an authenticated
    mutation — same pattern as D-028's token-regeneration limiter).
-   [x] Server-side file validation (`lib/storage/validation.ts`,
    `lib/storage/image-format.ts`) — size (≤5MB, `GALLERY_UPLOAD_MAX_BYTES`
    in `lib/storage/limits.ts`), claimed MIME type + extension checked
    against an allowlist, **and, the actual authenticity gate, real
    magic-byte content sniffing** (PNG/GIF/JPEG/WebP) that must match the
    claimed MIME type — a mislabeled or executable file is rejected
    regardless of what filename/Content-Type the client sent (see D-043).
    Decoded pixel dimensions are bounded at 8000px
    (`GALLERY_MAX_DIMENSION_PX`) where the format's header exposes them.
-   [x] Safe, deterministic, event-scoped object paths
    (`lib/storage/paths.ts`'s `buildGalleryObjectPath()`) —
    `events/{eventId}/gallery/{128-bit-random-hex}.{ext}`; the random
    filename component is never derived from the client-supplied filename
    (defense against collision, path traversal, and information leakage),
    and `eventId`/extension are defensively pattern-validated before
    being interpolated into a path at all.
-   [x] Persistent reorder (`lib/editor/service.ts`'s
    `moveGalleryItem()`/`resolveGalleryMoveSwap()`) — up/down move-by-one
    buttons (not drag-and-drop — simpler, fully keyboard/mobile
    accessible, no new dependency), swapping the two affected items'
    `sortOrder` values in a single `$transaction`. `sortOrder` existed
    since Phase 0 but was previously write-once (set at creation, never
    updated) — this phase is what actually makes it a real, user-facing
    reorder feature.
-   [x] Delete with real storage cleanup (`lib/editor/service.ts`'s
    `deleteGalleryItem()`, extended) — removes the live Supabase Storage
    object before the DB row, storage-first and fail-closed: if storage
    removal fails, the row is left in place and the owner sees a clear,
    retryable Indonesian error rather than a false "deleted" success that
    would silently orphan the object (see D-040 for the full compensation
    strategy and the alternatives considered and rejected).
-   [x] Two-step delete confirmation, caption-only editing
    (`updateGalleryItemCaptionAction`, valid for both IMAGE and VIDEO
    items), and the existing video-by-URL add/edit flow, all preserved —
    the gallery editor was extended, not rebuilt (`addGalleryItemAction`/
    `updateGalleryItemAction` still exist, now scoped to `type: "VIDEO"`
    only via `galleryVideoItemSchema`'s literal type).
-   [x] In-page lightbox (`components/invitation/gallery-lightbox.tsx`,
    `components/invitation/sections/gallery-grid.tsx`) — replaces the
    previous `target="_blank"` new-tab behavior. Real `role="dialog"
    aria-modal="true"`, Escape-to-close, a labeled close button, focus
    moved into the dialog on open and restored on close, click-outside-
    to-close, and keyboard-accessible prev/next navigation between items.
    Only ever renders the already-safe-URL-filtered `PublicGalleryItem`
    fields (`caption` is the event owner's own text) — no internal id,
    storage path, or any other metadata beyond what was already public.
-   [x] `GallerySection` split into a Server Component (heading, per-
    gallery titles — unchanged) and a new Client Component
    (`GalleryGrid`, the only part that needs interactivity), per CLAUDE.md
    §6.1 — the public route needed zero new data-fetching changes.
-   [x] Real `VIDEO` rendering — a `<video controls>` element (muted/
    `preload="metadata"` for the grid thumbnail, full `controls autoPlay`
    in the lightbox) replaces the pre-existing bug where a `VIDEO` item
    rendered through a plain `<img>` tag (which would show a broken image
    for any video with no manually-supplied `thumbnailUrl`). Video remains
    URL-based only, unchanged from Phase 4 — no upload/hosting system was
    added for it (see the "VIDEO note" above and D-042's related
    reasoning).
-   [x] Image delivery — `loading="lazy"` (already present) plus
    `decoding="async"` (new) on every gallery `<img>`; layout shift is
    prevented structurally via the existing fixed `aspect-square`
    container, not new stored dimensions. `next/image` was deliberately
    not adopted — see D-042 for the full reasoning (mixed same-origin/
    external URL sources, unconfirmed Supabase Storage transform
    availability).
-   [x] Honest dashboard UX — real "Mengunggah..."/"Menyimpan..."/
    "Menghapus..." pending states, inline field errors (including the
    server's actual rejection reason — file too large, unsupported type,
    dimensions exceeded), a real empty state ("Belum ada foto atau
    video."), two-step delete confirmation, and the shared not-found page
    for unauthorized/nonexistent events. The previous "Unggah berkas belum
    didukung" ("file upload not yet supported") copy is gone — upload is
    now real.

### Bucket note (manual Supabase step)

The connected Supabase DEV project's actual storage bucket is named
`invitation-assets` (from this environment's `.env.local`
`SUPABASE_STORAGE_BUCKET` value — **not** `invitation-media`, the
illustrative default `.env.example` documents; `.env.example` was left
as-is since it's just a placeholder name, not a claim about what any real
environment uses). This bucket did not exist yet when this phase's live
Storage integration tests were first run (`StorageApiError: Bucket not
found`). It was created directly against the connected Supabase DEV
project (public bucket, 6MB object size ceiling, MIME allowlist restricted
to `image/jpeg`/`image/png`/`image/webp`/`image/gif`) so the integration
suite could genuinely exercise upload/delete rather than being skipped or
mocked. **Any other environment (staging, production) needs the same
bucket created — with the same public-read + MIME-allowlist configuration
— before this feature will work there; the application code reads the
bucket name from `SUPABASE_STORAGE_BUCKET` and does not create it
automatically.**

### Security review findings

No new gaps were found in existing code during this phase (the
`javascript:`/`data:` URL, IDOR, and token-masking classes of issue were
already closed in Phase 4/7/9/10). Upload/storage-specific review points,
all satisfied by the design above:

-   **IDOR** — every gallery mutation (upload, caption edit, video
    add/edit, delete, move) requires `requireEditorAccess()`
    (`getAuthorizedEvent(eventId, userId, EDITOR)`), and every mutation
    targeting an existing item additionally re-verifies
    `{ id: itemId, gallery: { eventId } }` before acting — the same
    pattern already established for schedules/love-story items in this
    same file. Proven directly: creating an item under Event A and then
    calling update/delete/move against it via Event B's id is rejected
    with `EventNotFoundError`, with the row confirmed unchanged.
-   **Cross-event storage access** — object paths are always
    `events/{eventId}/gallery/...`, built server-side from the
    *authorized* `eventId`, never a client-supplied path; two uploads for
    two different events are proven to never collide
    (`lib/editor/service.integration.test.ts`).
-   **Service-role exposure** — grepped: `createSupabaseServiceClient()`
    is only ever called from `lib/storage/supabase-provider.ts`, which is
    only ever called from `lib/storage/provider.ts`, which is only ever
    called from server-side `lib/editor/service.ts` — no client component
    imports any of these three files (confirmed indirectly by the
    production build's server/client module-graph separation catching a
    real violation of this during development — see the "Notable
    implementation decision" below).
-   **Arbitrary storage path manipulation** — `buildGalleryObjectPath()`
    defensively pattern-validates both `eventId` and `extension` before
    interpolating them into a path, and the random filename component is
    never client-influenced; `derivePathFromPublicUrl()` (used for
    deletion) rejects any candidate path containing `..` or a leading `/`
    even though a well-formed self-generated path can never contain
    either.
-   **Executable upload / MIME spoofing** — the actual gate is
    `lib/storage/image-format.ts`'s magic-byte sniff: a Windows PE/`.exe`
    renamed to `photo.png` with `Content-Type: image/png` is rejected
    (proven in `lib/storage/validation.test.ts`), as is a genuine PNG
    mislabeled as `image/jpeg` (content must match the claimed type, not
    just look plausible).
-   **Oversized uploads** — enforced both on the claimed `size` field and
    the real received buffer length (a spoofed `size` field smaller than
    the actual payload is still rejected); `next.config.ts`'s Server
    Actions `bodySizeLimit` (6MB) is a transport-level backstop above the
    5MB application limit, not the actual enforcement point.
-   **Orphaned Storage objects** — addressed by D-040's storage-first,
    fail-closed delete ordering; proven directly via a real upload → real
    delete → real re-download-attempt-fails round trip.
-   **Unsafe public URLs** — gallery item URLs (including newly-uploaded
    ones) still pass through the existing `toSafeHttpUrl()` filter in
    `lib/invitations/projection.ts`, unchanged by this phase; a Supabase
    Storage public URL is `https://...` and passes through normally.
-   **Unauthorized mutations** — a VIEWER-role member cannot reach the
    editor at all (D-021, unchanged), proven for gallery specifically via
    both a live-DB integration test and an E2E test asserting the shared
    not-found page.
-   **Raw storage/database error leakage** — `mapStorageErrorMessage()`
    logs the raw Supabase/Prisma error server-side only and returns a
    generic or specific-but-safe Indonesian message; grepped, no
    `console.*` call anywhere in `lib/storage/`/`lib/editor/` includes a
    raw provider error object in a client-facing return value.
-   **Token/guest data leakage** — gallery items carry no guest/token
    data at all; N/A to this phase's surfaces.

### Notable implementation decision

**`lib/storage/limits.ts` was split out from `lib/storage/validation.ts`**
after the production build caught a real Server/Client Component boundary
violation: `components/editor/sections/gallery-form.tsx` (a Client
Component, since it needs `useState`/`useTransition` for the upload
form) originally imported `GALLERY_UPLOAD_MAX_BYTES` directly from
`lib/storage/validation.ts`, which has a top-level `import "server-only"`
— Turbopack correctly refused to bundle it for the browser. The two
numeric limits (`GALLERY_UPLOAD_MAX_BYTES`, `GALLERY_MAX_DIMENSION_PX`)
were moved to a new `lib/storage/limits.ts` with no `server-only` import,
re-exported from `validation.ts` for server-side callers, so the "max
5MB" copy shown in the upload form and the actual server-side limit stay
the exact same constant with no duplication. A concrete example of the
production build catching a real architectural boundary issue that
`next dev` alone did not surface.

### Tests Added (Phase 11)

Pure unit tests (no database, no network):

-   `lib/storage/image-format.test.ts` (12 tests) — real/hand-built
    fixture buffers per format (a genuine tiny PNG plus hand-constructed
    GIF/JPEG/WebP-VP8X headers): correct format detection + dimension
    extraction; a plain-text file, a Windows PE/executable signature, an
    empty buffer, a truncated PNG signature, and a SOF-less JPEG all
    correctly rejected (return `null`)
-   `lib/storage/validation.test.ts` (12 tests) — the full
    `validateGalleryImageUpload()` pipeline: valid PNG accepted;
    over-size, zero-byte, and claimed-size-mismatching-real-buffer-length
    all rejected; disallowed MIME type rejected; mismatched
    extension-for-MIME rejected; a renamed executable rejected even with
    a matching claimed MIME+extension (content sniff catches it); content
    whose real format doesn't match its claimed MIME type rejected;
    oversized/at-the-limit dimension bounds
-   `lib/storage/paths.test.ts` (11 tests) — `buildGalleryObjectPath()`:
    correct event-scoped shape, no collision across calls, different
    events get different prefixes, unsafe `eventId`/extension rejected;
    `derivePathFromPublicUrl()`: correct recovery for a genuine own-bucket
    URL, `null` for a different host/different-project/different-bucket/
    traversal-shaped/empty-suffix URL
-   `lib/storage/errors.test.ts` (5 tests) — Indonesian error-message
    mapping for every domain error, confirms a raw provider error's
    detail never leaks into the returned string
-   `lib/editor/service.test.ts` (6 tests, new file) —
    `resolveGalleryMoveSwap()`: correct up/down swap targets, both-edges
    no-ops, an id not in the list, a single-item list
-   `lib/editor/validation.test.ts` (+6 tests) — `galleryVideoItemSchema`
    (rejects `type: "IMAGE"` — image items only ever come from upload),
    `galleryCaptionSchema` (length bounds)
-   `lib/editor/actions.test.ts` (+12 tests) — every new/changed gallery
    action: rate-limit short-circuit, missing-file rejection, caption
    length validation, a thrown validation error mapped safely, the
    authenticated user's id (never client-supplied) passed to the service
    layer for upload/caption/move

Integration tests (real Supabase DEV Postgres **and real Supabase
Storage**, no mocks):

-   `lib/editor/service.integration.test.ts` (+17 gallery tests, using a
    real 1×1 PNG fixture) — video-item mutations re-scoped from IMAGE to
    VIDEO fixtures; caption-only update leaves the URL untouched;
    cross-event IDOR now covers caption/move alongside the pre-existing
    update/delete; reorder no-ops at both edges and persists across a
    fresh independent read; a nonexistent/foreign move target is
    rejected; a **real upload** creates a correct DB record whose URL
    resolves to a real object path; EDITOR-role can upload, VIEWER/
    stranger cannot; two events' uploads never collide on path; **a real
    delete removes both the DB row and the live Storage object** (proven
    via a follow-up download attempt failing); a legacy/external-URL
    video item's delete never attempts a storage call; a VIEWER's
    rejected delete leaves both the row and the real object intact
    (with real cleanup performed by the test itself afterward)

E2E (real Supabase DEV database and a real authenticated session — D-022;
real Supabase Storage uploads, not mocked):

-   `e2e/gallery.spec.ts` (5 tests) — **one combined flow**: an owner
    uploads two real image files through the actual file input, sees them
    persist after a full page reload, reorders them via the up button
    (persisting after another reload), opens the public invitation's
    lightbox (`role="dialog"`, closes on Escape), deletes one image from
    the dashboard, and confirms it's gone from both the dashboard and the
    public invitation; existing video-by-URL add still works alongside
    real upload; a VIEWER-role member cannot open the editor at all
    (shared not-found page, D-021); a stranger cannot access another
    owner's editor; an empty gallery renders no "Galeri" heading publicly
    (never a placeholder section)
-   Confirmed via a full E2E run against a clean environment: all 51
    pre-existing Phase 0-10 E2E tests continue passing alongside all 5 new
    gallery tests (56/56 total) — see "Known dev-server caveat" below for
    what "clean environment" required discovering

### Known dev-server caveat (not a product limitation)

Running `next build` and then `next dev` on top of the *same* `.next`
directory without clearing it in between was found, during this phase's
own verification, to intermittently and sometimes consistently break
Turbopack's dev-mode route resolution for one specific nested dynamic
route (`/dashboard/events/[eventId]/editor`), serving a framework-level
404 with no server-side error logged, even though `next build` itself
always compiled that same route successfully. This is a local
development-workflow artifact of mixing build/dev `.next` state, not an
application defect — confirmed by: the production build always succeeding
throughout; every other route working normally in the same dev session;
and the failure disappearing completely once `.next` was deleted before
starting `next dev` fresh. No code change was made for this — it's a
"clear `.next` before switching between `next build` and `next dev`"
operational note for future work in this repository, not a bug fix.

### Known Limitations

-   **Editing/replacing an uploaded image's file is not supported** — an
    owner can edit an image's caption or delete it and upload a
    replacement, but there is no in-place "swap the file" action. This
    matches the phase brief's explicit scope list (upload, delete,
    caption editing, reorder) and keeps the upload validation/storage-path
    logic from needing a second "replace" code path.
-   **No server-side thumbnail generation** — `thumbnailUrl` stays `null`
    for every uploaded image; the grid/lightbox show the original
    uploaded file, scaled by CSS (`object-cover`/`object-contain`) within
    a fixed-size container. Generating true resized thumbnails would need
    an image-processing dependency (e.g. `sharp`) or a Supabase Storage
    transform feature not confirmed available on the connected project —
    out of scope per the brief's "do not build unnecessary custom
    image-processing infrastructure" instruction.
-   **WebP dimension bounds only enforced for the VP8X (extended)
    sub-format** — see D-043. Format authenticity and the size/MIME
    checks still fully apply to plain `VP8 `/`VP8L` WebP files; only the
    pixel-dimension ceiling specifically isn't decoded/enforced for those
    two subtypes.
-   **Reorder is single-step move-up/move-down, not drag-and-drop** — a
    deliberate simplicity/accessibility/no-new-dependency tradeoff, not a
    stand-in for a "real" reorder feature to be replaced later; it fully
    satisfies "persistent reorder" as specified.
-   **`next/image` was not adopted** — see D-042. Responsive
    multi-resolution/WebP-AVIF-on-the-fly delivery is not implemented;
    only `loading="lazy"`/`decoding="async"` and structural
    (CSS-aspect-ratio) layout-shift prevention are.

## Phase 13 --- QR Invitation

**Status:** Implemented and verified against the real Supabase DEV
Postgres database, including full authenticated browser E2E coverage
(D-022) with a genuine downloaded-file assertion. No fake/mocked
authorization, token, or QR logic. No schema migration was required —
confirmed by inspection, not assumed: the QR feature adds no new
persisted state at all, reusing `GuestInvitation.token` and the existing
`buildGuestInvitationUrl()` output exactly as-is.

-   [x] QR display (`components/guests/guest-qr-code.tsx`, new) — renders
    on the existing per-guest invitation page
    (`/dashboard/events/[eventId]/guests/[guestId]/invitation`), receiving
    only the already-server-authorized `inviteLink` string the page
    already computes for the "Tautan Undangan Pribadi"/copy-link feature
    — `{inviteLink && <GuestQrCode ... />}`. No new data-fetching path, no
    new authorization check: this component structurally cannot render
    for a VIEWER, since `inviteLink` is already `null` for that role (the
    same `getGuestInvitationDetail()` token-masking behavior D-027
    established, unchanged by this phase).
-   [x] QR download ("Unduh QR") — entirely client-side. The `QRCodeSVG`
    component forwards a ref to the real rendered `<svg>` DOM node;
    download serializes it (`XMLSerializer`) into a `Blob`
    (`image/svg+xml`) and triggers a save via a temporary anchor element.
    No Route Handler, no Server Action, no network round trip for the
    download itself.
-   [x] Safe filename (`lib/guests/qr-filename.ts`, new, pure) — derives
    the downloaded file's name only from the guest's own display name via
    the existing `lib/events/slug.ts` `slugify()` (e.g.
    `qr-undangan-ayu-lestari.svg`); the function's signature makes it
    structurally impossible to include the token, since it never receives
    one as input.
-   [x] Token-regeneration consequence — no new logic needed or added.
    Regenerating a guest's token (D-028, unchanged) makes the *URL* the
    QR encodes stop personalizing, exactly the same way it already
    invalidates a copied link; a freshly-rendered QR (the page reloads
    with the new `inviteLink` after regeneration) automatically encodes
    the new URL. The QR section's own copy states this plainly in one
    sentence, matching the existing `RegenerateTokenButton` warning's
    tone without duplicating its full explanation.
-   [x] Honest states — no QR renders at all when there's no invitation
    token or the caller can't edit (same truthy-check the existing invite
    link block already uses); a VIEWER sees neither a QR nor a download
    control, matching every other OWNER/EDITOR-only affordance on this
    page.

### Dependency added

`qrcode.react` (`^4.2.0`) — see D-044 for the full selection rationale.
Zero runtime dependencies of its own (`npm view qrcode.react dependencies`
returns empty), declares `react@^19.0.0` as a peer, no native binary
compilation. `npm install` reported "added 1 package," confirming no new
transitive dependencies were pulled in.

### Security review findings

No new gaps were found in existing code during this phase — QR reuses the
per-guest invitation page's already-reviewed authorization/masking
boundary (D-027) without modification. Review points specific to this
phase's own new code:

-   **eventId/guestId scoping** — N/A to the new code itself: `GuestQrCode`
    never queries anything; it only renders a string it's given. The
    scoping guarantee lives entirely in the unchanged
    `getGuestInvitationDetail()` call the page already made.
-   **IDOR** — no new risk surface; no new id-bearing lookup was
    introduced.
-   **VIEWER token privacy** — proven directly in
    `e2e/guest-invitation.spec.ts`: a VIEWER's rendered page contains
    neither the "QR Undangan" heading, an `svg[role="img"]` element, nor
    an "Unduh QR" button, in addition to the pre-existing "raw token never
    appears" assertion (unchanged).
-   **Cross-event isolation** — inherited from the unchanged
    `getGuestInvitationDetail()`/`getAuthorizedEvent()` IDOR checks; no
    new test was needed here since no new query was added (the one gap
    found — EDITOR role was never explicitly asserted for this function
    — was closed as a small, targeted addition; see "Tests Added" below).
-   **XSS** — the QR component renders no guest-controlled HTML; `title`
    is passed as a React prop (auto-escaped), not `dangerouslySetInnerHTML`.
-   **Unsafe URL handling** — the encoded value is always
    `buildGuestInvitationUrl()`'s own output, which already independently
    validates itself as a safe http(s) URL before returning (throws
    otherwise) — `GuestQrCode` cannot be reached with an unsafe/arbitrary
    URL because it never accepts one from the browser or any external
    input.
-   **Accidental token logging/exposure** — grepped: no file under
    `components/guests/guest-qr-code.tsx` or `lib/guests/qr-filename.ts`
    references `.token`/`invitationToken` at all; the token never reaches
    either module, only the already-built URL string does. The downloaded
    filename, verified directly in `e2e/guest-invitation.spec.ts`, is
    guest-name-derived only.
-   **Client/server boundary** — `GuestQrCode` is a `"use client"`
    component importing only `qrcode.react` and the pure
    `lib/guests/qr-filename.ts` (no `server-only` import anywhere in that
    chain) — confirmed by a clean production build (the exact class of
    boundary violation Phase 11 hit and fixed did not recur here).
-   **Dependency security** — `qrcode.react` has no dependencies of its
    own, so it introduces no new transitive-dependency surface; `npm
    audit`'s existing devDependency-only advisories (documented under
    "Known Issues" below) are unaffected.

### Tests Added (Phase 13)

Pure unit tests (no database):

-   `lib/guests/qr-filename.test.ts` (4 tests, new file) —
    `buildGuestQrFileName()`: correct slugified `.svg` filename from a
    guest name, diacritics/punctuation stripped (reusing `slugify()`'s
    existing, already-tested behavior rather than duplicating its test
    coverage), a safe fallback for a name with no valid characters, and
    the fixed `qr-undangan-`/`.svg` prefix/suffix shape.

Integration tests (real Supabase DEV Postgres, no mocks):

-   `lib/guests/service.integration.test.ts` (+1 test) — closes a small,
    genuinely pre-existing gap directly relevant to this phase:
    `getGuestInvitationDetail()` had OWNER and VIEWER role cases tested
    but never an explicit EDITOR case, even though the service's own
    `includeToken = role === OWNER || role === EDITOR` logic (unchanged)
    already covered it. Since the QR feature's entire authorization
    boundary *is* this function, this one addition was worth closing
    rather than leaving implicit. No other new integration tests were
    added — the full OWNER/VIEWER/stranger/cross-event matrix for this
    function was already covered before this phase, and duplicating it
    would contradict the instruction to reuse existing coverage rather
    than re-testing the entire suite.

E2E (real Supabase DEV database, real authenticated sessions — D-022):

-   `e2e/guest-invitation.spec.ts` (extended, +1 new test, 3 existing
    tests extended with QR assertions) — the owner and editor tests now
    also assert the "QR Undangan" heading, a real `svg[role="img"]`
    element, and the "Unduh QR" button are visible; the viewer test now
    also asserts all three are entirely absent (`toHaveCount(0)`). A new
    dedicated test drives a real download via Playwright's
    `page.waitForEvent("download")`, asserts the suggested filename
    matches the guest-name-derived pattern exactly, reads the downloaded
    file from disk and confirms it's well-formed, non-trivial SVG content
    (`<svg`...`</svg>`, over 200 characters), and — without relying on any
    `qrcode.react`-internal SVG path structure — confirms two different
    guests' rendered QR `innerHTML` differ, proving the QR is genuinely
    derived from each guest's own link rather than a static placeholder.

### Known Limitations

-   **No QR scanning, check-in, or check-in dashboard** — explicitly out
    of scope for this phase (Roadmap Phase 14) *at the time this phase
    was written*; the QR encodes a URL a phone camera can already open
    today (the existing `/invite/[slug]` route). **This is no longer
    accurate** — Roadmap Phase 14 ("Check-in"), implemented immediately
    after this phase, now consumes exactly this QR for check-in. See
    "Phase 14 — Event Check-in" below.
-   **No WhatsApp Business API sending, no analytics** — both explicitly
    out of scope for this phase, unchanged from their existing states
    (D-029; Roadmap Phase 15 not started).
-   **QR is not embedded in the composed WhatsApp message or exported
    anywhere beyond the per-guest invitation page** — matches the phase
    brief's explicit scope (this page only); a "send the QR image itself"
    flow was not requested and was not built.

## Phase 14 --- Event Check-in

**Status:** Implemented and verified against the real Supabase DEV
Postgres database, including full authenticated browser E2E coverage
(D-022). No fake/mocked authorization, token, or check-in logic. No
schema migration was required or generated — confirmed by inspection, not
assumed: `CheckIn` and `CheckInMethod` already existed in
`prisma/schema.prisma` before this phase started (`npx prisma migrate
status` reported "Database schema is up to date!" both before and after
this phase's code changes).

-   [x] QR check-in — `components/checkin/qr-code-scanner.tsx` (new,
    `"use client"`, wraps `qr-scanner`, D-045) decodes a QR client-side
    and hands the *raw* decoded string to the server unmodified; the
    server (`lib/checkin/token.ts`'s
    `extractInvitationTokenFromScannedValue()`, `import "server-only"`)
    is the only place that parses out and validates the invitation token,
    reusing the exact `guestTokenSchema` format check
    `lib/invitations/token.ts` already established. The client never
    interprets, trusts, or echoes back a guest/invitation identity of its
    own.
-   [x] Manual search — `components/checkin/manual-search.tsx` (new),
    server-backed via `searchGuestsForCheckInAction` →
    `lib/checkin/service.ts`'s `searchGuestsForCheckIn()`, event-scoped,
    matches by name/phone/email (reusing the existing guest-search
    pattern) but returns only `{ guestId, guestName, category,
    isCheckedIn }` — never phone/email/notes/token, verified directly by
    an integration test asserting the exact returned key set. Always
    available regardless of camera state — the mandatory fallback the
    phase brief required, not merely an option next to the scanner.
-   [x] Guest confirmation — `components/checkin/guest-confirmation-card.tsx`
    (new) shows exactly guest name, RSVP status, seat quota, and check-in
    status before/after a check-in decision — the same minimal field set
    the search results use, never phone/email/notes/internal ids.
-   [x] Authorization — `lib/checkin/service.ts`'s
    `requireCheckInViewerAccess()` / `requireCheckInEditorAccess()` (no
    new role/permission system, D-047): OWNER/EDITOR can view and check
    in, VIEWER can view/search/preview read-only but every mutating
    function (`confirmQrCheckIn`, `confirmManualCheckIn`) throws
    `CheckInUnauthorizedError` for a VIEWER before touching the database.
    A stranger/nonexistent event gets the same IDOR-safe `notFound()` as
    every other dashboard route (`EventNotFoundError`) — proven
    indistinguishable by test.
-   [x] Duplicate/concurrency safety — `performCheckIn()` always attempts
    the authoritative `CheckIn` write first and lets the database's own
    `@@unique([eventId, guestId])` constraint arbitrate, catching Prisma
    `P2002` and translating it into an honest `ALREADY_CHECKED_IN`
    outcome — never a check-then-act read of existing state (D-046).
    Proven under **genuine concurrency**, not sequential calls dressed up
    as concurrent: `lib/checkin/service.integration.test.ts` fires two
    real overlapping `confirmManualCheckIn()` calls via `Promise.all(...)`
    against the same guest against the live database and asserts exactly
    one `CheckIn` row and one honest `ALREADY_CHECKED_IN` loser.
-   [x] `GuestInvitation.status` sync — `performCheckIn()` writes
    `CheckIn` and updates `GuestInvitation.status = CHECKED_IN` inside one
    `prisma.$transaction([...])` (same array-form transaction pattern as
    `lib/rsvp/service.ts`'s `submitRsvpForGuest()`); a duplicate/losing
    attempt never re-touches `GuestInvitation.status` a second time,
    verified by asserting `updatedAt` is unchanged after a losing attempt
    (D-046). The pre-existing never-downgrade protections in
    `lib/rsvp/service.ts` and `lib/guests/service.ts` (both already treat
    `CHECKED_IN` as terminal) are unmodified and remain correct.
-   [x] RSVP never gates check-in — proven directly: a guest with
    `NOT_ATTENDING` or no RSVP row at all can still be checked in
    successfully (D-047); RSVP status is shown on the confirmation card
    for context only.
-   [x] Reception flow — `components/checkin/checkin-shell.tsx` (new,
    `"use client"` orchestrator) never navigates away from
    `/dashboard/events/[eventId]/check-in` after a result; a single
    "Pindai / Cari Tamu Lain" action resets straight back to
    scanning/searching. A `submittingRef` guard prevents a second
    preview/confirm request from firing while one is already in flight.
-   [x] Dashboard — `app/dashboard/events/[eventId]/check-in/page.tsx`
    (new Server Component) + `loading.tsx`, showing a server-computed
    summary (Total Diundang / Konfirmasi Hadir / Sudah Check-in / Belum
    Check-in — no charts or unrelated analytics) via
    `getCheckInDashboardData()`. Linked from the event detail page's
    action row; removed from that page's "Segera hadir" (coming soon)
    list, since it's no longer coming soon.
-   [x] Guest-list "Check-in" column (PRD §19, secondary/optional) —
    implemented cleanly rather than deferred: `lib/guests/service.ts`'s
    existing `GUEST_SELECT` now also selects `checkIns: { select: { id:
    true } }` (same one-extra-relation shape already used for `rsvps`,
    no N+1 — one query, same as before), and the guest list
    (`/dashboard/events/[eventId]/guests`) shows the existing
    `CheckInStatusBadge` next to a guest's RSVP badge when
    `isCheckedIn` is true.
-   [x] Rate limiting — `lib/checkin/rate-limit.ts`, a new
    check-in-specific limiter (`checkin:submit:{userId}`, 300 requests /
    10 minutes) reusing the existing generic `lib/rate-limit/`
    infrastructure (same shape as `lib/guests/rate-limit.ts`/
    `lib/editor/gallery-rate-limit.ts`), sized for a realistic reception
    burst (many rapid scans in a short window) rather than the tighter
    limits used for lower-frequency mutations elsewhere in the codebase.
    Applied only to the two confirm actions, not to read-only
    preview/search.

### Dependency added

`qr-scanner` (`^1.4.2`) — see D-045 for the full selection rationale.
Zero runtime dependencies of its own (one type-only dev dependency,
`@types/offscreencanvas`), no peer dependencies. `npm install` reported
"added 2 packages," confirming no unexpected transitive dependency
surface.

### Security review findings

-   **eventId/guestId scoping** — every service function re-derives
    authorization from `{ eventId, userId }` via `getAuthorizedEvent()`
    and re-verifies `{ guestId, eventId }` together for every guest
    lookup (`resolveGuestByGuestId`), never trusting a client-supplied id
    alone; proven by dedicated cross-event IDOR tests for both the QR
    token path and the manual guestId path.
-   **IDOR** — a stranger and a nonexistent event both resolve to the
    same `EventNotFoundError` → `notFound()`, consistent with every other
    domain in this codebase; proven by test.
-   **QR token security** — the server re-resolves the guest from the
    *raw* scanned value on every call (including confirm, which never
    trusts a previously-resolved guestId from its own preview step,
    matching `lib/rsvp/service.ts`'s always-re-resolve precedent); an
    unknown, malformed, or cross-event token produces the same generic
    `InvalidCheckInGuestError` → "Tamu tidak ditemukan untuk acara ini."
    regardless of which of those three it actually was.
-   **No raw token logging/exposure** — grepped: no file under
    `lib/checkin/` or `components/checkin/` logs a token or scanned
    value; `mapCheckInErrorMessage()`'s fallback branch logs the caught
    `Error` object for operators (`console.error`), never the scanned
    string itself, and never returns raw error detail to the client.
-   **Unique constraint remains authoritative, no duplicate rows
    possible** — the entire point of D-046; proven under genuine
    concurrency (see above), not assumed from the schema alone.
-   **No unnecessary PII exposure** — `CheckInGuestView` and
    `CheckInSearchResultItem` both deliberately exclude
    phone/email/notes/invitation token; verified directly by asserting
    the exact key set a search result returns.
-   **No `dangerouslySetInnerHTML`/XSS** — grepped: no occurrence
    anywhere under `lib/checkin/` or `components/checkin/`; all guest
    data is rendered as plain React children (auto-escaped).
-   **Rate limiting present** — see "Rate limiting" above; applied to
    both confirm actions before any database write is attempted.
-   **No raw DB errors exposed** — `mapCheckInErrorMessage()` never
    returns a Prisma error message or stack trace to the client; the
    `P2002` duplicate case is handled as a normal typed business outcome
    (`ALREADY_CHECKED_IN`), not surfaced as an "error" at all.
-   **Client/server boundary** — `lib/checkin/token.ts`,
    `lib/checkin/errors.ts`, `lib/checkin/rate-limit.ts`, and
    `lib/checkin/service.ts` all import `"server-only"`; a clean
    production build confirms no server-only import leaked into a client
    bundle (the exact class of issue Phase 11 hit and fixed did not
    recur here).

### Tests Added (Phase 14)

Pure unit tests (no database):

-   `lib/checkin/validation.test.ts` (9 tests, new) — QR/manual/search
    Zod schemas: trims and accepts valid input, rejects empty/oversized
    input, rejects a missing field.
-   `lib/checkin/token.test.ts` (7 tests, new) —
    `extractInvitationTokenFromScannedValue()`: extracts a valid token
    from a well-formed invitation URL regardless of other query params,
    returns `null` for a non-URL value, a URL with no `to` param, and a
    `to` value that fails token-format validation, and confirms the
    embedded slug is never read (only the token param matters).
-   `lib/checkin/errors.test.ts` (4 tests, new) — `mapCheckInErrorMessage()`
    maps each domain error to its Indonesian message and falls back to a
    generic message (logging, not leaking, an unexpected error's detail).

Integration tests (real Supabase DEV Postgres, no mocks):

-   `lib/checkin/service.integration.test.ts` (22 tests, new) — covers
    the full matrix required by the phase brief: correct guest resolution
    from a valid token, cross-event token/guestId rejection, unknown
    event membership rejection, OWNER/EDITOR check-in success (QR and
    manual, correct `checkedInBy`/`checkedInAt`/`method`), VIEWER
    rejection with zero rows created, RSVP not gating check-in, a second
    attempt returning `ALREADY_CHECKED_IN` with exactly one row,
    **genuinely concurrent** `Promise.all([...])` attempts resolving to
    exactly one row and one honest loser, transactional
    `GuestInvitation.status` sync on success, a losing attempt never
    re-mutating that status, search returning only the minimal field set
    and reflecting check-in state correctly, and dashboard summary counts
    matching seeded data exactly.

E2E (real Supabase DEV database, real authenticated sessions — D-022):

-   `e2e/check-in.spec.ts` (5 tests, new) — a stranger is rejected from
    another owner's dashboard; the QR scanner's no-camera state is
    asserted (this headless environment has no video input device, so
    `QrScanner.hasCamera()` genuinely resolves false — this is **not** a
    substitute for real hardware verification, see "Known Limitations"
    below) and manual search remains available as a working fallback; an
    owner can search, check in, and see that a repeat search reflects the
    already-checked-in state; a VIEWER can search/preview but has no
    confirm control anywhere in the UI; and a 390×844 mobile viewport
    renders the check-in page without horizontal overflow.

### Known Limitations

-   **No real-device camera verification.** All QR-scanning verification
    in this phase is automated-only: unit tests for token parsing, and an
    E2E assertion that headless Chromium (no camera hardware) correctly
    falls back to its "no camera detected" state. **Actual QR decoding on
    a real Android Chrome or iOS Safari camera was not performed** — no
    physical device or device-farm access was available in this
    environment. This is stated honestly rather than claimed: the
    scanner's *code path* (permission states, start/stop lifecycle,
    single-decode-per-session guard, manual fallback) is verified; live
    camera decoding behavior on real hardware is not.
-   **No check-in undo/reversal, no separate check-in history feed** —
    both explicitly out of scope per the phase brief; `CheckIn.checkedInAt`
    /`checkedInBy` are the only record kept, matching PRD/DATABASE
    guidance for this phase.
-   **No new `AuditLog` usage** — explicitly out of scope per the phase
    brief; not introduced.
-   **No WhatsApp Business API sending, no analytics** — explicitly out
    of scope for this phase (D-029). **Analytics is no longer accurate**
    — Roadmap Phase 15 ("Analytics Foundation"), implemented immediately
    after this phase, now reads exactly this `CheckIn` data for its own
    dashboard. See "Phase 15 — Analytics Foundation" below.

## Phase 15 --- Analytics Foundation

**Status:** Implemented and verified against the real Supabase DEV
Postgres database, including full authenticated + real unauthenticated
browser E2E coverage (D-022). No fake/mocked analytics data, no
third-party analytics provider. No schema migration was required or
generated — confirmed by inspection, not assumed: `InvitationView`
already existed in `prisma/schema.prisma` since the very first migration
(`npx prisma migrate status` reported "Database schema is up to date!"
both before and after this phase's code changes).

-   [x] Invitation view tracking — `app/invite/[slug]/page.tsx` calls
    `lib/analytics/service.ts`'s `trackPublicInvitationView()` on every
    real page render, reading a first-party anonymous session cookie
    (`di_analytics_sid`, assigned by `proxy.ts` — D-048) and the
    `User-Agent`/`Referer` headers. Never throws; a database failure,
    malformed cookie, or any other error is caught and logged internally
    without ever affecting invitation rendering, metadata generation, or
    SEO.
-   [x] `InvitationView` is the authoritative source — proven directly:
    no code anywhere infers a view from RSVP, `GuestInvitationStatus`, or
    any other signal; every dashboard "views" number comes from a real
    `count()`/`groupBy()` against `InvitationView`.
-   [x] Anonymous session identity — a `crypto.randomUUID()` value,
    HttpOnly, `SameSite=Lax`, `Secure` when served over HTTPS, scoped to
    `path: "/invite"` only (never sent to `/dashboard` or any other
    route), 90-day expiry. Never a guest id, never an invitation token,
    never exposed to client-side JavaScript or to the dashboard UI
    itself (D-048).
-   [x] Personalized-guest association — a valid, event-scoped `?to=`
    token resolves the real `guestId` server-side
    (`resolveGuestIdForAnalyticsTracking()`, reusing the same
    token-validation + cross-event-check pattern every other domain
    already uses); a malformed, unknown, or cross-event token always
    resolves to `guestId: null`, proven by dedicated integration tests —
    the same IDOR-safe treatment every other domain gives an invalid
    token.
-   [x] View deduplication — the same `eventId`+`sessionId` within a
    30-minute window counts as one tracked view (a plain existence check,
    not a unique constraint — an accepted, documented approximation, not
    a `CheckIn`-grade correctness guarantee). Proven directly against the
    live database, including that a *different* session for the same
    event is correctly counted as a separate view.
-   [x] Abuse protection — `lib/analytics/rate-limit.ts`, a new
    session-id-keyed limiter (20 tracked-view attempts per 5 minutes)
    reusing the existing generic `lib/rate-limit/` infrastructure,
    deliberately keyed by session rather than IP (D-048) since many real
    guests can legitimately share one network around an event.
-   [x] Analytics dashboard —
    `app/dashboard/events/[eventId]/analytics/page.tsx` (new Server
    Component, no client-side interactivity needed since the page is
    entirely read-only): total views, unique sessions, personalized
    opens, RSVP breakdown (confirmed/declined/maybe/unanswered/response
    rate), wishes (total/approved), active gift methods, and
    authoritative check-in progress. Summary cards + simple progress
    bars only — no charting dependency was added, per the phase brief.
-   [x] Authorization — OWNER/EDITOR/VIEWER can all read
    (`getAuthorizedEvent(eventId, userId, EventMemberRole.VIEWER)`, the
    same read boundary as the RSVP/wishes/check-in dashboards); a
    stranger/nonexistent event gets the same IDOR-safe `notFound()` every
    other dashboard route already produces; an unauthenticated visitor is
    redirected to `/login` by the existing, unmodified
    `isProtectedPath()`/proxy.ts logic (`/dashboard` was already a
    protected prefix — no change needed there).
-   [x] Metric correctness — RSVP metrics reuse
    `lib/rsvp/service.ts`'s own `calculateResponseRate()` directly rather
    than re-deriving it; wishes reuse the existing "non-DELETED" `ALL`
    convention (D-038); check-in uses `CheckIn` counts, never
    `GuestInvitationStatus`; gifts report only `activeMethods` — no
    fabricated transaction/revenue figure exists anywhere, since Phase
    9/16 never implemented real gift transactions (D-037, D-049).
    `calculateCheckInProgress()` clamps at 100% to correctly handle a
    walk-in guest who checks in without ever RSVPing `ATTENDING` (D-047's
    "RSVP never gates check-in" made real by this exact scenario).
-   [x] Empty/zero-safe states — a brand-new event's dashboard shows
    "Belum ada tayangan.", "Belum ada respons RSVP.", "Belum ada
    ucapan.", "Belum ada tamu yang check-in." and never `NaN`/`Infinity`
    — verified directly by both a unit test (`calculateCheckInProgress`
    zero-denominator cases) and an E2E assertion that neither string
    literally appears on the rendered page.

### Dependency added

None. This phase introduces zero new npm packages — deliberately, per
the phase brief's explicit "a chart library is NOT required for Phase
15" and "do not over-engineer" instructions. All new code uses
`@prisma/client`, `zod`, `next/headers`, and `crypto.randomUUID()`
(Node/Edge built-in), all already present in this project.

### Security review findings

-   **Authorization/event scoping** — every dashboard read re-derives
    the caller's role from `getAuthorizedEvent()`; no query anywhere
    trusts a client-supplied `eventId` as sufficient authorization on its
    own. Proven by dedicated OWNER/EDITOR/VIEWER/stranger/cross-event
    tests (integration and E2E).
-   **Guest identity** — resolved strictly server-side from a validated,
    event-scoped token; a malformed/unknown/cross-event token always
    yields `guestId: null`, never a client-supplied value, never an
    error that could distinguish "wrong event" from "invalid token."
-   **Privacy** — no raw IP address, no raw `User-Agent` string, no
    invitation token, and no email/phone is stored anywhere in
    `InvitationView`. Grepped: no file under `lib/analytics/` references
    `.token`, `x-forwarded-for`, or `x-real-ip` at all — this domain
    never touches IP, unlike `lib/rsvp/rate-limit.ts`'s IP-keyed limiter,
    a deliberate difference (D-048).
-   **Database** — every query is a parameterized Prisma call; no raw
    SQL was introduced anywhere in this domain.
-   **Client/server boundary** — `lib/analytics/service.ts`,
    `lib/analytics/errors.ts`, and `lib/analytics/rate-limit.ts` all
    import `"server-only"`; the dashboard page and its one presentational
    component (`components/analytics/progress-bar.tsx`) never import
    Prisma or a Supabase service-role client; confirmed by a clean
    production build.
-   **Errors** — `mapAnalyticsErrorMessage()` never returns a raw Prisma
    error or stack trace; `trackPublicInvitationView()` never surfaces
    any failure to the guest at all (see "Resilience" below).
-   **Abuse** — public tracking is rate-limited (session-keyed, see
    above); the same documented in-memory/single-process limitation as
    every other limiter in this codebase applies (Phase 20 concern, not
    new to this phase).
-   **Input validation** — `lib/analytics/validation.ts`'s Zod schema
    bounds every field (`eventId`/`guestId` ≤ 64 chars, `referrer` ≤ 200
    chars, `sessionId` must match the UUID shape this app always
    generates, `deviceType` restricted to a 4-value enum) — a forged or
    oversized cookie/header value is rejected before it ever reaches a
    query.
-   **Rendering** — no `dangerouslySetInnerHTML` anywhere in this
    domain; all values are plain React children.
-   **Resilience** — `trackPublicInvitationView()` is wrapped in its own
    try/catch and never throws; proven directly by an integration test
    that tracks against a nonexistent `eventId` (a real foreign-key
    violation) and asserts the call still resolves without throwing.

### Tests Added (Phase 15)

Pure unit tests (no database):

-   `lib/analytics/session.test.ts` (11 tests, new) —
    `isPublicInvitationPath()`, `classifyDeviceType()` (mobile/tablet/
    desktop/unknown classification from real user-agent strings),
    `normalizeReferrer()` (reduces a URL to its origin, rejects
    unparseable input), and the cookie option shape
    (HttpOnly/Lax/Secure/path).
-   `lib/analytics/validation.test.ts` (7 tests, new) — accepts valid
    input, rejects a malformed sessionId, an empty/oversized eventId, an
    oversized referrer, and an unknown deviceType value.
-   `lib/analytics/service.test.ts` (5 tests, new) —
    `calculateCheckInProgress()`: zero-confirmed-guests safety, normal
    rounding, exact 100%, and the walk-in-exceeds-confirmed clamp.
-   `lib/analytics/errors.test.ts` (2 tests, new) — error-to-Indonesian-
    message mapping and the generic-fallback/logging behavior.
-   `lib/analytics/rate-limit.test.ts` (2 tests, new) — allows up to the
    limit and blocks beyond it; tracks distinct sessions independently.

Integration tests (real Supabase DEV Postgres, no mocks):

-   `lib/analytics/service.integration.test.ts` (12 tests, new) — an
    anonymous view creates a row with the correct fields; a valid
    personalized token resolves the correct `guestId`; a cross-event
    token never leaks a guest id; a malformed/unknown token leaves
    `guestId` null; a missing session id skips tracking without
    throwing; a nonexistent `eventId` (real FK violation) is swallowed
    without throwing; the dedup window correctly collapses repeated
    views from the same session and correctly treats a different session
    as a separate view; dashboard read access is proven for
    OWNER/EDITOR/VIEWER and rejected for a stranger; cross-event
    isolation is proven for the dashboard; a brand-new event returns
    safe zero values; and a full aggregation test seeds real RSVP/Wish/
    GiftMethod/CheckIn data (including a walk-in check-in exceeding
    `confirmed`) and asserts every field of the returned DTO.

E2E (real Supabase DEV database, real authenticated sessions — D-022):

-   `e2e/analytics.spec.ts` (5 tests, new) — a **real, unauthenticated
    browser navigation** to a published public invitation (exercising
    `proxy.ts`'s cookie assignment and the page's tracking call for
    real, not a seeded row) is later visible on the owner's dashboard as
    exactly one total view and one unique visitor; a VIEWER-role member
    can read the dashboard; a stranger is rejected; an unauthenticated
    direct dashboard URL redirects to `/login`; and a brand-new event
    shows the correct empty-state copy with no `NaN`/`Infinity` anywhere
    on the page.

### Known Limitations

-   **No third-party analytics provider** — deliberately out of scope
    per the phase brief; `ANALYTICS_PROVIDER`/`ANALYTICS_API_KEY` remain
    unset in `.env.example`. Every metric this phase's actual PRD §35/
    ARCHITECTURE §25 scope requires is first-party and already
    implemented without one.
-   **No date-range filtering/historical trend charts** — not required
    by PRD §35 for this phase; the dashboard shows current-state
    aggregates only, matching the phase brief's explicit "if date
    filtering is not required, do not build an advanced date-range
    analytics system in this phase."
-   **The view-tracking rate limiter is in-memory/single-process** —
    same pre-existing, already-documented limitation as every other
    limiter in this codebase (Phase 20 production-hardening concern, not
    new to or worsened by this phase).
-   **View deduplication is approximate, not a correctness guarantee** —
    a plain recency check, not a unique constraint; two requests racing
    within milliseconds could in rare cases both insert a row. This is
    an accepted characteristic of an analytics counter (D-048), not the
    same class of guarantee `CheckIn`'s unique constraint provides for
    check-in state.
-   **No WhatsApp/Email real sending, no Gift Registry/Payment/
    Subscription** — unchanged, explicitly out of scope for this phase
    (D-029, D-037).

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
Unit tests:                 PASS (753/753 — lib/utils, lib/env, lib/auth/*, lib/rate-limit,
                             lib/supabase, lib/events/*, lib/invitations/*, lib/editor/*,
                             lib/guests/*, lib/rsvp/*, lib/invitation-delivery/*,
                             lib/gifts/*, lib/wishes/*, lib/storage/*, lib/checkin/*,
                             lib/analytics/*; +76 new this update — 11
                             lib/invitations/color-contrast.test.ts, 6
                             lib/invitations/templates/default-themes.test.ts (incl. a
                             real WCAG-AA contrast-ratio check per template, not
                             eyeballed), +2 registry.test.ts, +3 projection.test.ts
                             (per-template default-theme merge), 16 across 5 new
                             per-template render-smoke test files (first use of
                             @testing-library/react in this codebase), 36
                             cross-template.test.tsx (describe.each across all 6
                             registered templates — non-wedding events, 150-char
                             titles, 120-char guest names, 500-char addresses/wishes,
                             anonymous visitors), +2 lib/editor/service.integration.test.ts;
                             229 of the 753 are live-DB integration tests — 15 events, 22
                             invitations, 43+2 editor, 41 guests, 36 rsvp, 18 gifts, 18
                             wishes, 22 check-in, 12 analytics — 0 leftover DB rows and 0
                             leftover Storage objects verified after each run)
Build:                      PASS (next build; proxy.ts recognized as Proxy/Middleware; all
                             existing dynamic routes unchanged and correctly dynamic; no
                             server/client boundary issue from the 5 new template
                             components or the extended theme-vars.ts/projection.ts import
                             chain; production build stayed clean)
E2E:                        PASS (73/73 — homepage smoke test, auth foundation suite,
                             event-route protection suite, public invitation suite, editor
                             suite, guest management suite, RSVP suite, guest invitation
                             delivery suite, RSVP dashboard suite, gift method dashboard
                             suite, wishes suite, gallery suite, check-in suite, analytics
                             suite, and template system suite (new, 6 tests — editor
                             template picker offers and persists all 6 templates; each of
                             the 5 new templates renders real event data including a
                             personalized guest, with zero console errors and no
                             horizontal overflow at 390×844, verified via
                             document.documentElement.scrollWidth/clientWidth, not just
                             visual inspection); all database-backed suites exercise the
                             real Supabase DEV database directly, no mocks. Re-ran
                             e2e/templates.spec.ts, e2e/editor.spec.ts,
                             e2e/invitation.spec.ts, e2e/rsvp.spec.ts, e2e/wishes.spec.ts,
                             and e2e/guest-invitation.spec.ts together (25 tests,
                             2 workers) specifically to check for regressions from the
                             shared RsvpForm/WishForm theme-token change — all 25 passed
                             cleanly, confirming the shared behavior these forms depend on
                             (seat-quota validation, wish moderation, guest-token
                             handling) is genuinely unaffected, only their visual styling
                             changed. The pre-existing, already-documented D-030 "stuck on
                             /login" full-parallel-load characteristic (see Phase 15's own
                             entry above) was not re-triggered by this update's own
                             targeted runs)
Prisma validate:            PASS
Prisma migrate status:      PASS ("Database schema is up to date!" — 2 migrations total,
                             unchanged by this update; no schema/migration change was
                             needed or made — this was rendering-layer and
                             theme-resolution work only)
Vercel deployment:          NOT YET ATTEMPTED
Supabase connectivity:      PASS (DB via Prisma — including live cross-tenant event,
                             invitation-token, editor/IDOR, guest/IDOR, RSVP token/
                             seat-quota/IDOR, guest-invitation token-masking/regeneration
                             IDOR, RSVP dashboard filter/export/cross-event authorization,
                             gift-method CRUD/cross-event/public-projection authorization,
                             wish submission/moderation/cross-event/public-projection
                             authorization, gallery upload/reorder/delete/cross-event
                             authorization, check-in authorization/duplicate-prevention/
                             transactional-sync/concurrency proofs, analytics
                             tracking/guest-resolution/cross-event-isolation/dashboard-
                             authorization/aggregation proofs, AND template
                             selection/default-theme-resolution proofs (new); Storage via
                             the real, connected Supabase project's `invitation-assets`
                             bucket; Auth via a real authenticated login in
                             e2e/editor.spec.ts, e2e/guests.spec.ts,
                             e2e/guest-invitation.spec.ts, e2e/rsvp-dashboard.spec.ts,
                             e2e/gifts-dashboard.spec.ts, e2e/wishes.spec.ts,
                             e2e/gallery.spec.ts, e2e/check-in.spec.ts,
                             e2e/analytics.spec.ts, and e2e/templates.spec.ts (new, plus a
                             real unauthenticated public-invitation navigation exercising
                             proxy.ts's cookie assignment end-to-end))
```

## Phase 20 (Batch 1) --- CI Reliability & Security Headers / CSP

**Status:** Implemented and verified. This is the first of several planned
Phase 20 batches (see `docs/ROADMAP.md`'s Phase 20 task list) — scoped
narrowly to the two items an audit (see `docs/DECISIONS.md`'s Phase 20
entry) identified as the highest-value, lowest-risk repository-only fixes.
Event/gift mutation rate limiting, rate-limiter eviction, `AuditLog`
writes, structured logging, and every other audit finding remain
deliberately unimplemented — see "Remaining Phase 20 Work" below.

-   [x] CI E2E Supabase configuration corrected —
    `.github/workflows/ci.yml`'s `e2e` job previously hardcoded
    `NEXT_PUBLIC_SUPABASE_URL: https://example.supabase.co` and
    `SUPABASE_SERVICE_ROLE_KEY: ci-placeholder` even though
    `e2e/*.spec.ts` fixtures make real Supabase Auth Admin API calls
    (`admin.auth.admin.createUser`) — those calls could not have been
    succeeding against a fake project. Now sourced from
    `secrets.CI_SUPABASE_URL` / `secrets.CI_SUPABASE_ANON_KEY` /
    `secrets.CI_SUPABASE_SERVICE_ROLE_KEY`. **These three GitHub Actions
    secrets do not exist yet in this repository configuration — that is
    external, manual configuration this batch cannot perform (see
    "External/Manual Actions Still Required" below).**
-   [x] Both jobs now fail clearly, before installing dependencies, when a
    required secret is missing — a "Verify required CI secrets are
    configured" step checks presence (never value) and exits with a clear
    `::error::` message, replacing the `validate` job's previous silent
    fallback to an unreachable `postgresql://postgres:postgres@localhost:
    5432/...` when `CI_DATABASE_URL` was unset.
-   [x] Security response headers + Content-Security-Policy — new
    `lib/security/headers.ts` (pure, unit-tested), applied in `proxy.ts`
    to every request. Nonce-based `script-src` (`'strict-dynamic'` +
    per-request nonce, following the exact pattern in Next.js 16.3.5's own
    bundled CSP guide at `node_modules/next/dist/docs/01-app/02-guides/
    content-security-policy.md` — not invented). `style-src` deliberately
    keeps `'unsafe-inline'` (6 templates + 3 shared components use React's
    `style={{...}}` for per-theme CSS variables — no practical nonce/hash
    strategy exists for that). `img-src` stays broad
    (`'self' https: http: data: blob:`) to match `lib/invitations/
    url-safety.ts`'s existing scheme-only validation (D-041/D-042) exactly
    — narrower would break real owner-pasted invitation/gift-QR images.
    `worker-src 'self'` preserves `qr-scanner`'s same-origin Web Worker
    fallback (iOS Safari, which lacks the native `BarcodeDetector` API).
    `connect-src 'self'` (no client-side Supabase/`fetch()` usage exists).
    `object-src 'none'`, `base-uri 'self'`, `form-action 'self'`,
    `frame-ancestors 'self'` + `X-Frame-Options: SAMEORIGIN`,
    `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-
    when-cross-origin`, `Permissions-Policy` (explicitly allows
    `camera=(self)` for QR check-in scanning; denies microphone/
    geolocation/payment, all confirmed unused). `Strict-Transport-Security`
    sent only when the request itself was HTTPS (never on local HTTP dev);
    `includeSubDomains`/`preload` deliberately omitted this batch —
    preload registration is a manual, largely irreversible external step
    outside this batch's scope.
-   [x] Nonce-compatibility fix — nonce-based CSP requires dynamic
    rendering (confirmed directly from Next's own docs: a statically
    generated page has no per-request nonce, so Next's own hydration
    script on it would be blocked). Every real route already reads
    cookies/headers/searchParams somewhere in its render tree except two:
    the root landing stub (`app/page.tsx`) and the default not-found
    fallback. Both now carry `export const dynamic = "force-dynamic"`
    (the latter via a new minimal `app/not-found.tsx`, styled to match the
    existing `app/invite/[slug]/not-found.tsx`). Confirmed via `next
    build` output: every route is now `ƒ` (dynamic); none are `○`
    (static) any longer.

**Verification (this update):**

```text
TypeScript:      PASS
Lint:             PASS
Format check:     PASS
Unit tests:       PASS (773/773 — 763 pre-existing + 10 new in the new
                  lib/security/headers.test.ts, covering every CSP
                  directive, the camera-allowed/microphone-denied
                  Permissions-Policy split, HTTPS-only HSTS, nonce
                  uniqueness, and that no token/guestId/eventId/userId
                  ever appears in these headers)
Prisma validate:  PASS (no schema change)
Production build: PASS (next build — every route now dynamically
                  rendered (ƒ); confirmed via build output, not assumed)
E2E:              PASS (68/68 across all 15 spec files — templates,
                  homepage, auth, rsvp, check-in (including the QR
                  camera-permission/no-camera-fallback path and mobile
                  viewport), gallery, wishes, gifts-dashboard, analytics,
                  editor, events, guest-invitation, guests, invitation —
                  run against a real running dev server with the new CSP
                  headers live and verified present via curl beforehand.
                  One transient batch of 6 e2e/guests.spec.ts failures
                  during verification was diagnosed as a pre-existing,
                  already-documented artifact (see lib/auth/rate-limit.ts's
                  own comment): reusing one long-lived dev server process
                  across three sequential full-suite Playwright
                  invocations exhausted the single shared, IP-collapsed,
                  in-memory login rate-limit bucket (30 logins / 10 min) —
                  not a CSP regression. Re-ran e2e/guests.spec.ts alone
                  against a freshly started server and all 7 passed
                  cleanly, confirming the diagnosis.)
CI workflow YAML: Syntax-validated locally (js-yaml parser) — actual
                  GitHub Actions execution requires the external secrets
                  below and could not be verified from this environment.
```

**Remaining Phase 20 Work (explicitly not implemented this batch):**

-   Event mutation rate limiting (`lib/events/actions.ts` — create,
    update, publish, unpublish, delete all currently unlimited)
-   Gift mutation rate limiting (`lib/gifts/actions.ts` — create, update,
    delete all currently unlimited)
-   Rate-limiter eviction (`lib/rate-limit/index.ts`'s `Map` never removes
    expired entries — unbounded growth risk for high-cardinality keys)
-   `AuditLog` writes (the model exists in `prisma/schema.prisma` but is
    never written to anywhere — no durable trail for destructive
    mutations like event/gift-method deletion)
-   Optional structured logging (the existing `console.error("[domain]
    ...")` convention across every `lib/**/errors.ts` file is consistent
    but unstructured, uncorrelated, and only as durable as Vercel's
    default function log retention)
-   CI `validate` job's `DATABASE_URL`/`DIRECT_URL` still depend entirely
    on `secrets.CI_DATABASE_URL`/`secrets.CI_DIRECT_URL` existing and
    pointing at a real, reachable Postgres — this batch made that
    dependency fail clearly instead of silently, but did not add a
    Postgres service container as an alternative (out of scope; would be
    a new service)
-   External Vercel Preview environment-variable configuration (separate
    system from GitHub Actions secrets — unverified from this
    environment)
-   The remaining Phase 20 roadmap items not covered by this batch:
    upload security review, error-monitoring integration, performance
    optimization, SEO, accessibility, mobile QA, and the "verify
    Vercel/Supabase production connectivity" checklist

## Update Rules

1.  Do not claim completion without evidence.
2.  Keep the current phase accurate.
3.  Record meaningful blockers.
4.  Record verification results.
5.  Remove resolved blockers.
6.  Keep this file concise.
