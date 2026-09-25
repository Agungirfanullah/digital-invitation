# Architecture & Engineering Decisions

This document records finalized decisions. Do not casually reverse them.

## D-001 --- Architecture

**Decision:** Use a modular monolith.

**Rationale:** One repository keeps development and deployment simple
while allowing clear domain boundaries.

**Impact:** Business domains live in `features/`; shared infrastructure
lives in `lib/`; Next.js is the primary runtime.

## D-002 --- Framework

**Decision:** Next.js + TypeScript + App Router.

**Impact:** Prefer Server Components; use Server Actions/Route Handlers
for server operations; use Client Components only where interactivity
requires them.

## D-003 --- Hosting

**Decision:** Vercel is the primary application hosting/deployment
platform.

**Impact:** The app must be compatible with server/serverless execution,
must not depend on local filesystem persistence, and must use
environment variables for secrets.

## D-004 --- Database

**Decision:** PostgreSQL hosted by Supabase.

**Impact:** PostgreSQL is the relational source of truth; local
PostgreSQL is not required; destructive production database operations
require human approval.

## D-005 --- ORM

**Decision:** Prisma.

**Impact:** `prisma/schema.prisma` and Prisma migrations define database
changes; application database access should use Prisma unless an
exception is documented.

## D-006 --- Storage

**Decision:** Supabase Storage for application-managed media.

**Impact:** Relational data stays in PostgreSQL; media stays in object
storage; uploads require validation and authorization.

## D-007 --- Authentication

**Decision:** Supabase Auth is the default authentication platform,
subject to the implementation defined by the architecture.

**Impact:** Authentication state must map consistently to application
users; authorization remains an application responsibility.

## D-008 --- Core Database Is Not Firebase/Firestore

**Decision:** Do not replace PostgreSQL + Prisma with Firebase/Firestore
for the core relational system without an explicit architecture
decision.

## D-009 --- No Local PostgreSQL/Docker Requirement

**Decision:** Normal development must not require local PostgreSQL or
Docker.

**Impact:** Development connects to the configured development Supabase
environment.

## D-010 --- Secrets

**Decision:** Never commit real secrets.

**Impact:** `.env.example` contains safe placeholders only. Private keys
must never be exposed to client-side code.

## D-011 --- Provider Abstractions

**Decision:** External services should use provider interfaces where
practical.

**Examples:** payment, email, WhatsApp, maps, storage, analytics.

## D-012 --- Server-Side Business Rules

**Decision:** Critical business rules are enforced server-side.

**Examples:** event ownership, guest access, RSVP limits, publishing,
check-in, subscription limits, payment state, admin authorization.

## D-013 --- Event Scoping

**Decision:** Event-owned data must be scoped by the owning event and
authorization context.

**Impact:** Never trust client-provided ownership identifiers.

## D-014 --- Public Invitation Privacy

**Decision:** Public invitation content may be public; guest-specific
information requires a valid secure guest token.

## D-015 --- No Fake Core Functionality

**Decision:** Core features must not ship as fake success flows or
hardcoded mock data. Mocks are allowed in automated tests.

## D-016 --- Agentic Development

**Decision:** Claude Code is the primary autonomous engineering agent.

**Impact:** `CLAUDE.md` defines rules; `docs/AGENT_EXECUTION.md` defines
execution; `docs/ROADMAP.md` defines sequence.

## D-017 --- Automated Verification

**Decision:** Typecheck, lint, tests, production build, and critical E2E
tests are part of definition of done.

## D-018 --- Production Safety

**Decision:** Agent autonomy applies to normal development work, not
destructive production operations.

Human approval is required for destructive production data changes,
irreversible production database operations, major irreversible
architecture changes, and actions carrying serious data-loss/security
risk.

## D-019 --- Decision Change Protocol

When a finalized decision must change:

1.  identify the decision
2.  explain why it no longer fits
3.  assess migration/compatibility impact
4.  update this document
5.  update affected architecture/database/roadmap documentation
6.  implement the change

Never silently reverse a documented decision.

## D-020 --- GuestInvitation.eventId Is Now a Real Foreign Key

**Decision:** `GuestInvitation.eventId` gained an enforced
`@relation` to `Event` (`onDelete: Cascade`) plus an index, instead of
remaining a bare scalar column.

**Rationale:** The Phase 0 schema declared `GuestInvitation.eventId` as a
plain field with no Prisma relation — only `guestId` was FK-backed to
`Guest`. Discovered while implementing Phase 3 personalized-invitation
lookup (`/invite/[slug]?to=[token]`), where a guest token's event scope is
a security boundary (a token for Event A must never personalize Event B).
An unenforced `eventId` column is exactly the kind of gap that could let a
future bug insert a `GuestInvitation` row with a mismatched `eventId` and
have nothing catch it at the database level.

**Impact:** Migration
`20260918161434_add_guest_invitation_event_relation` adds the FK and
index. Applied cleanly against Supabase DEV with zero data impact — no
`Guest`/`GuestInvitation` rows exist yet (guest management ships in a
later roadmap phase). Application code additionally never trusts
`GuestInvitation.eventId` directly for authorization — token resolution
derives the event from the FK-enforced `GuestInvitation → Guest → Event`
chain and cross-checks it against the event resolved from the URL slug
(see `lib/invitations/token.ts`), so correctness doesn't depend on this
column alone even though it's now constrained.

## D-021 --- Editor Access Requires EDITOR Role; No Read-Only Viewer Mode Yet

**Decision:** `/dashboard/events/[eventId]/editor` is gated at
`EventMemberRole.EDITOR` for both viewing and mutating — a `VIEWER`-role
`EventMember` cannot open the editor at all (gets the same not-found
behavior as a nonexistent event), not a read-only version of it.

**Rationale:** There is no product surface yet that grants VIEWER
membership (team collaboration/invites don't exist), so this only affects
a hypothetical future case. Building a genuinely read-only editor mode now
(disabling every input, hiding every mutation control) would be
speculative work for a role nothing can currently assign. Gating the
whole route at EDITOR keeps the authorization surface simple and correct
today; a read-only mode can be added when VIEWER membership becomes
reachable, without changing the authorization boundary itself
(`getAuthorizedEvent` already supports arbitrary role thresholds).

**Impact:** `lib/editor/service.ts`'s `requireEditorAccess()` always
checks `EventMemberRole.EDITOR`. Covered by an integration test
(`lib/editor/service.integration.test.ts`) and an E2E test
(`e2e/editor.spec.ts`) proving a VIEWER member is rejected.

## D-022 --- Supabase Admin `createUser` Unblocks Authenticated E2E Testing

**Decision:** Use `supabase.auth.admin.createUser({ email_confirm: true })`
(service-role only, test code only) to provision confirmed auth accounts
for E2E fixtures that need a real authenticated session, instead of the
public `auth.signUp()` flow.

**Rationale:** Phase 2 and Phase 3 documented a "known limitation": the
Supabase DEV project's Auth configuration rejects `auth.signUp()` from
synthetic email domains (verified directly against the Auth API), so no
fully-authenticated browser E2E flow could be automated — E2E coverage
for authenticated routes was limited to unauthenticated-redirect checks
plus DB-level integration tests. While building Phase 4's editor E2E
tests, the same restriction was hit again and re-investigated: the
*admin* `createUser` endpoint (available via the service-role key, which
test code already uses for direct Prisma fixture setup) is not subject to
that signup-time restriction and produces an account that authenticates
through the real `/login` page exactly like any other user. This means
the Phase 2/3 limitation was narrower than it was framed — it blocks
scripting the public *registration* flow specifically, not authenticated
E2E testing in general.

**Impact:** `e2e/editor.spec.ts` uses this to drive real login → editor →
persistence → public-page-reflects-the-change flows with no cookie
injection or mocking. This pattern is available to any future phase
needing an authenticated E2E flow (guest management, RSVP, check-in,
etc.) — the Phase 2/3 STATUS.md limitation notes have been updated to
point here rather than reasserting the narrower framing. Phase 2/3's
existing tests were left as-is (not reworked retroactively — out of scope
for Phase 4, and they already pass); this decision only governs new work
going forward. The service role key must never leave test/server code —
this pattern is not, and must never become, something client code touches.
Phase 5's `e2e/guests.spec.ts` reuses this exact pattern, confirming it
generalizes as intended.

## D-023 --- Guest List Is VIEWER-Readable, Not EDITOR-Only

**Decision:** `/dashboard/events/[eventId]/guests` (the list, search,
export) is gated at `EventMemberRole.VIEWER` — a VIEWER-role member can
see the guest list read-only. Create/edit/delete/import all still require
`EventMemberRole.EDITOR`.

**Rationale:** This deliberately differs from D-021 (the Phase 4 editor,
gated at EDITOR for both reading and writing). The two surfaces carry
different risk: the invitation editor's read view *is* essentially its
write view (the same form fields, prefilled) with no product reason yet
to view it read-only, whereas a guest list is genuinely useful to browse
without being able to change anything — e.g. a family member helping track
RSVPs by eye, or a future read-only "coordinator" role. `getAuthorizedEvent`
already supports arbitrary role thresholds per-call, so this is a plain
choice of threshold per operation, not a new authorization mechanism.

**Impact:** `lib/guests/service.ts`'s `getGuestPageData` and
`exportGuestsToCsv` check `EventMemberRole.VIEWER`; every mutation
(`createGuestForUser`, `updateGuestForUser`, `deleteGuestForUser`,
`previewGuestImport`, `confirmGuestImport`) and the `/guests/new`,
`/guests/[guestId]/edit`, `/guests/import` pages check
`EventMemberRole.EDITOR`. The list page computes the caller's role once
(`resolveRole()`) to decide what to render — this is UX only; the real
enforcement is the per-operation server check above, proven directly by
`lib/guests/service.integration.test.ts` and `e2e/guests.spec.ts` (a
VIEWER can read the list but every mutation attempt is rejected
server-side regardless of what the UI shows).

**Explicit permission matrix** (`app/dashboard/events/[eventId]/guests/page.tsx`):

| Action                                    | VIEWER | EDITOR | OWNER |
| ------------------------------------------ | :----: | :----: | :---: |
| View list, search, filter, sort, paginate |   ✓    |   ✓    |   ✓   |
| Export CSV                                |   ✓    |   ✓    |   ✓   |
| Copy personalized invitation link          |        |   ✓    |   ✓   |
| Add / edit / delete a guest                |        |   ✓    |   ✓   |
| Import CSV                                 |        |   ✓    |   ✓   |

Invitation tokens are a personalization secret, not guest-list data — the
same principle that already excludes them from CSV export excludes the
"Salin Tautan" (copy link) control from a VIEWER's view. A VIEWER's page
render never passes a guest's `invitationToken` to any client component,
so the token does not reach the browser at all for that role, not merely
"is hidden by CSS." This was corrected after a Phase 5 review found the
copy-link button had been rendered unconditionally (a UI oversight, not a
server-authorization gap) and the export button had been incorrectly
nested inside the EDITOR-only control group.

## D-024 --- Every Guest Gets Its Invitation Token at Creation, in the Same Transaction

**Decision:** `Guest` and `GuestInvitation` are always created together,
inside one Prisma transaction (`createGuestWithInvitation` in
`lib/guests/service.ts`) — there is no code path that creates a guest
without also creating its invitation token, and no separate "generate
link" step.

**Rationale:** `docs/ROADMAP.md`'s Phase 7 acceptance criteria states
"Each guest receives a unique invitation token" as a flat requirement, not
a follow-up action the owner has to remember to trigger. Making token
issuance atomic with guest creation means the application can rely on the
invariant "every `Guest` row has exactly one `GuestInvitation`" everywhere
downstream (`lib/guests/service.ts`'s `toListItem()` depends on this
directly) instead of defensively handling a guest with no token yet.

**Impact:** Tokens are generated with `crypto.randomBytes(24)` (192 bits)
base64url-encoded (`lib/guests/token.ts`) — format-compatible with the
existing Phase 3 `guestTokenSchema`/`resolveGuestContext()`
(`lib/invitations/token.ts`), which needed no changes. On the
astronomically unlikely event of a token collision, the transaction is
retried with a freshly generated token (up to 5 attempts) rather than
failing the guest creation outright. CSV import reuses the same function
per row, so every imported guest also gets its own token atomically.

## D-025 --- RSVP Data Is Resolved Separately From `PublicInvitation`, Not Merged Into It

**Decision:** The RSVP section's guest-specific data (seat quota, existing
answer) is resolved by `lib/rsvp/service.ts`'s own `getRsvpGuestView()` —
a completely separate function and query from `lib/invitations/token.ts`'s
`resolveGuestContext()` — rather than extending `PublicGuestContext` or
`PublicInvitation` (`lib/invitations/types.ts`) with RSVP fields. The
result is threaded through the render tree as a new, separate `rsvp` prop
on `InvitationTemplateProps` (`lib/invitations/templates/registry.ts` →
`InvitationRenderer` → the template → `components/rsvp/rsvp-section.tsx`),
not as part of the `invitation` object itself.

**Rationale:** `PublicInvitation` is Phase 3's deliberately narrow,
heavily-tested public projection — its tests specifically assert what it
does *not* contain, and every existing consumer (metadata generation,
templates, other tests) assumes its current shape. Folding RSVP state
into it would mean either widening an already carefully-scoped type for
a single new feature, or accepting an extra field that most call sites
(anything not rendering the RSVP section) never use. Keeping RSVP
resolution in its own module, called separately by the page, means:
Phase 3's files, types, and tests needed zero changes for Phase 6 to
ship, and the RSVP domain owns its own read/write logic end-to-end
(matching `lib/guests/`'s and `lib/editor/`'s existing self-contained
module shape). The tradeoff is one extra lightweight, indexed lookup on a
personalized page load (never on an anonymous visit, since it's skipped
entirely when `invitation.guest` is already null) — an acceptable,
bounded cost against the alternative of coupling two domains' data models
together.

**Impact:** `lib/invitations/*` (types, token resolution, projection) has
no RSVP-awareness at all. `app/invite/[slug]/page.tsx` calls
`getPublicInvitationBySlug()` (unchanged) and, only when a token
resolved a real guest, separately calls `getRsvpGuestView()` and passes
`{ token, view }` down as `InvitationRenderer`'s `rsvp` prop. A future
second template only needs to render `<RsvpSection eventId={...}
rsvp={rsvp} />` the same way `MinimalElegantTemplate` does — no change to
the data-fetching layer.

## D-026 --- RSVP Submission Always Advances `GuestInvitation.status` to RSVPED

**Decision:** Every successful RSVP submission (regardless of
ATTENDING/NOT_ATTENDING/MAYBE) updates the guest's `GuestInvitation.status`
to `RSVPED`, atomically with the `RSVP` upsert — except when the
invitation is already `CHECKED_IN`, which is never downgraded back to
RSVPED.

**Rationale:** `docs/DATABASE.md` §9 already defines
`GuestInvitationStatus` as a lifecycle (`NOT_SENT → SENT → OPENED →
RSVPED → CHECKED_IN`), and RSVPED clearly means "the guest responded,"
not "the guest is attending" (that distinction lives in `RSVP.attendance`
instead). Leaving this column stuck at `NOT_SENT`/`SENT`/`OPENED` forever
even after a real response would make the column meaningless and would
under-report "who has responded" anywhere the invitation status is used
instead of a `RSVP` join (e.g. a future guest-list "invitation status"
column). No check-in feature exists yet to produce `CHECKED_IN`, but the
never-downgrade rule costs nothing to implement now and avoids a future
regression when it does.

**Impact:** `lib/rsvp/service.ts`'s `resolveNextInvitationStatus()` (a
pure, unit-tested function) implements the rule; `submitRsvpForGuest()`
applies it inside the same `$transaction` as the RSVP upsert. Covered by
both the unit test (`service.test.ts`) and an integration test that
manually sets `CHECKED_IN` first and confirms a subsequent RSVP
submission doesn't revert it (`service.integration.test.ts`).

## D-027 --- Guest Invitation Token Masking Hardened at the Service Layer

**Decision:** `lib/guests/service.ts`'s `GuestListItem`/`GuestInvitationDetail`
now carry `invitationToken: string | null` — `null` whenever the caller's
resolved role is `VIEWER`, decided inside the service functions
themselves (`getGuestPageData()`, `getGuestInvitationDetail()`), not left
to the page component's choice of what to render.

**Rationale:** Before this phase, the token was always present in the
data `lib/guests/service.ts` returned; a VIEWER never actually received
it in practice only because `app/dashboard/events/[eventId]/guests/page.tsx`
happened to gate the `<CopyInviteLinkButton>` behind `canEdit`. That was
correct today, but fragile: any future change to that page (or a new page
built against the same service function) could pass the guest object to
a client component for an unrelated reason and silently leak the token
to a VIEWER, with nothing at the data layer to catch it. Phase 7's
explicit security review requirement ("never leak tokens through...
generic dashboard loaders") is exactly this class of risk. Moving the
mask into the service layer means the token simply isn't *present* in
data returned to a VIEWER-resolved caller, regardless of what any current
or future page does with it.

**Impact:** `toListItem()` takes an `includeToken` flag (default `true`
— every EDITOR/OWNER-gated caller keeps the default); the two
VIEWER-reachable read paths (`getGuestPageData()`,
`getGuestInvitationDetail()`) compute the caller's role first and pass
`false` when it's `VIEWER`. `invitationTokenAvailable: boolean` was added
alongside the masked field so a VIEWER can still see "a personalized link
exists" without ever receiving its value (used by the new per-guest
Invitation page). Proven directly: `lib/guests/service.integration.test.ts`
asserts a VIEWER's `GuestListItem`/`GuestInvitationDetail` both have
`invitationToken: null` from real live-DB calls (not just a page-level
rendering check), and `e2e/guest-invitation.spec.ts` asserts the raw
token string never appears anywhere in a VIEWER's rendered page.

## D-028 --- Token Regeneration Semantics

**Decision:** `/dashboard/events/[eventId]/guests/[guestId]/invitation`
lets an EDITOR/OWNER regenerate a guest's invitation token
(`lib/guests/service.ts`'s `regenerateGuestInvitationToken()`). The old
token is invalidated immediately (the next lookup by it simply matches no
row) and is never returned, displayed, or logged again once the new one
is issued. `GuestInvitationStatus` is reset to `NOT_SENT` (clearing
`sentAt`/`openedAt`) when it was `NOT_SENT`/`SENT`/`OPENED` — those
describe the *link that's about to stop existing* — but `RSVPED`/
`CHECKED_IN` are preserved unchanged, since those describe something the
guest actually *did*, independent of which token value they used to do
it.

**Rationale:** This was implemented (rather than skipped as
"technically easy but unrequested") because `docs/PRD.md`/`docs/ROADMAP.md`
treat personalized links as bearer secrets that can leak (shared to the
wrong person, posted somewhere public, etc.), and a product with no way
to revoke a compromised link would leave the owner with no remedy short
of deleting and recreating the guest entirely (which would also destroy
their real RSVP history). The status-preservation rule specifically
avoids a bad side effect: without it, regenerating a token for a guest
who already RSVPed would make the dashboard show "belum mengisi RSVP"
for someone who very much did, which is a straightforwardly false
statement about the product's own data.

**Impact:** `resolveInvitationAfterRegeneration()` (pure, unit-tested in
`service.test.ts`) encodes the rule; `regenerateGuestInvitationToken()`
applies it in the same update as the new token, EDITOR-and-above,
re-verifying `{ eventId, guestId }` via the `GuestInvitation` row itself
(IDOR-safe — a guest belonging to a different event is indistinguishable
from a nonexistent one). Rate-limited per-user via
`lib/guests/rate-limit.ts` (10 per 10 minutes) per Phase 7's abuse-review
requirement. The UI (`RegenerateTokenButton`) requires an explicit
two-step confirmation with copy warning that old shared links stop
working, matching `DeleteGuestButton`'s established pattern for
destructive-ish actions. Covered end-to-end by
`lib/guests/service.integration.test.ts` (status/timestamp reset vs.
preservation, IDOR, role gating) and `e2e/guest-invitation.spec.ts`
(the old link stops personalizing, the new one works).

## D-029 --- Invitation Delivery Abstraction: No Real Provider, `wa.me` Is Not "Delivery"

**Decision:** `lib/invitation-delivery/` defines a provider-agnostic
interface (`InvitationDeliveryProvider`, `DeliveryRequest`/`DeliveryResult`)
and a message composer (`composeInvitationMessage()`), but **no real
WhatsApp Business API or email provider is registered or implemented** —
`getDeliveryProvider()` returns `null` for every channel, and
`attemptDelivery()` always resolves to a clear "not configured" failure.
The dashboard's "Buka WhatsApp" action is a `wa.me` deep link
(`buildWhatsAppShareUrl()`) that opens the *operator's own* WhatsApp
client with the message pre-filled — this app never transmits anything;
the human operating the dashboard does, by tapping "Send" inside their
own WhatsApp app, exactly as `docs/PRD.md` §32 describes ("Copy message",
"Open WhatsApp").

**Rationale:** The phase brief was explicit: no real provider
integration without configured credentials, no fake/simulated successful
sends, unsupported channels must fail clearly. Building the full
interface now (rather than skipping it) means a future real provider —
once credentials exist — implements `InvitationDeliveryProvider` and
registers itself, with zero change to guest/invitation business logic or
the dashboard UI's message-composition flow. Critically, copying the
composed message or opening the `wa.me` link **never** touches
`GuestInvitation.status`/`sentAt` — per the phase brief, "a copied
invitation link is NOT the same thing as a provider-delivered
invitation." Those columns are reserved for a real future provider
confirming an actual send.

**Impact:** `components/guests/message-preview.tsx` only offers
client-side actions (clipboard copy, a `wa.me` link) — no Server Action
in this domain ever marks anything as sent. `attemptDelivery()` is fully
implemented and unit-tested (including a fake provider proving the
interface is genuinely implementable) but is not wired to any UI in this
phase, since there is nothing configured to call it against.
`docs/STATUS.md` records this explicitly so it's never mistaken for a
working send feature later.

## D-030 --- Login Rate Limit Raised to Accommodate Growing E2E Test Volume

**Decision:** `lib/auth/rate-limit.ts`'s `login` bucket was raised from
10 to 30 attempts per 10 minutes.

**Rationale:** D-022 established that every phase needing an
authenticated E2E flow would reuse the admin-provisioned real-login
pattern, and phases have done exactly that (editor, guests, RSVP-adjacent
guest-invitation). By the end of Phase 6 the combined suite already
submitted exactly 10 real `/login` attempts in a single `npm run
test:e2e` run — precisely at the limit — because `getRequestIp()` falls
back to a single shared `"unknown"` key when `x-forwarded-for`/
`x-real-ip` are absent, which they are for local Playwright runs against
`next dev`. Phase 7's additional legitimate login-based tests
(`e2e/guest-invitation.spec.ts`) pushed the combined total to 15,
tripping the limit and causing unrelated Phase 5/6 specs to fail via this
shared bucket — a real, reproducible regression, not a flaky test. 30
still meaningfully throttles credential-stuffing in production (Supabase
Auth's own server-side abuse protections are the primary defense against
password-guessing; this app-level limiter is defense-in-depth, not the
only line of defense) while leaving headroom for the E2E strategy this
project has already committed to.

**Impact:** `register`/`password-reset` limits are unchanged (not
exercised at this volume by any current E2E suite). If a future phase's
E2E growth approaches this ceiling again, the underlying fix is a
per-test-run-isolated rate-limit store or a test-environment exemption,
not another arbitrary increase — noted here so that's the next
escalation, not a repeat of this one.

## D-031 --- RSVP Dashboard Filtering Is Table-Scoped; Summary Counts Always Reflect the Whole Event

**Decision:** `lib/rsvp/service.ts`'s `getRsvpDashboardData()` applies the
dashboard's search/status/category filters only to the paginated guest
list (`guests`/`total`/`page`). The summary numbers (`counts` —
total/attending/not attending/maybe/pending/seats/response rate) are
always computed from the full, unfiltered event guest/RSVP set,
regardless of what the table below is currently showing.

**Rationale:** Phase 8's brief explicitly warns against "misleading
zeroes without context." Applying an active filter (e.g. "status =
ATTENDING") to the summary cards too would make "Total Tamu" read as the
filtered subset count, which is both confusing (a card literally labeled
"Total Tamu" showing a partial number) and redundant with the table
itself, which already shows exactly those rows. Keeping the two concerns
separate — "how is the whole event doing" vs. "show me this subset" — is
also how the pre-existing guest list (`lib/guests/service.ts`) already
behaves, since its filters only ever affected its own paginated result,
never a separate summary block (it doesn't have one).

**Impact:** `getRsvpDashboardData()` runs two independent guest counts —
one unfiltered (`totalGuests`, feeding `counts`) and one filtered
(`filteredTotal`, feeding pagination) — plus the existing unfiltered
`groupBy`/`aggregate` calls for the attendance breakdown and seat sums.
Proven directly: an integration test creates a search that matches one of
two guests and asserts the table narrows to one row while
`counts.totalGuests` still reports 2; an E2E test does the same with a
real browser filter interaction.

## D-032 --- Defensive Floor on the Confirmed-Seats Aggregate

**Decision:** `lib/rsvp/service.ts`'s `normalizeConfirmedSeats()` clamps
the summed `attendeeCount` across ATTENDING responses to a minimum of 0
before it's shown on the dashboard.

**Rationale:** `attendeeCount` is already validated non-negative at
submission time (`rsvpFormSchema`, `resolveAttendeeCount()` in
`lib/rsvp/service.ts`), so a negative aggregate should never occur through
the application's own write path. Phase 8's brief explicitly asks the
dashboard to "correctly handle... malformed/impossible persisted values
defensively," and a read-side floor costs nothing to add now, guarding
purely against ever displaying a nonsensical negative "orang hadir" total
if a row were ever written outside the validated path (a manual database
edit, a future migration bug, etc.). This is a display guard only — it
never mutates the underlying `RSVP` rows.

**Impact:** `getRsvpDashboardData()`'s `confirmedSeats` field is computed
through `normalizeConfirmedSeats()` rather than reading Prisma's `_sum`
aggregate directly. Unit-tested in isolation (`service.test.ts`) for the
normal, `null` (no ATTENDING rows yet), and defensively-floored negative
cases.

## D-033 --- Per-Guest RSVP Detail Lives on the Existing Invitation Page, Not a New Route

**Decision:** Phase 8's per-guest RSVP detail requirement (show the
response, submitted timestamp, attendee count, and message, or a clear
"belum mengisi RSVP" state) was implemented by extending the existing
Phase 7 page at `/dashboard/events/[eventId]/guests/[guestId]/invitation`
— adding the response's `submittedAt` and an explicit no-response message
— rather than creating a new, separate
`/dashboard/events/[eventId]/guests/[guestId]/rsvp` route.

**Rationale:** The Phase 7 page already showed the guest's RSVP status
badge, attendee count, and message right alongside their invitation
status and personalized link — a second route for "RSVP detail"
specifically would duplicate most of that page's content and split one
guest's information across two dashboard pages for no product benefit.
The Phase 8 brief itself offered this as the preferred alternative ("or
integrate into the existing guest detail/invitation page if
architecturally cleaner"). The RSVP dashboard's guest rows already link
to this same page (`/guests/[guestId]/invitation`) as their "detail" —
new dashboard summary card, one destination.

**Impact:** No new route was created for this requirement.
`getRsvpForGuest()` (`lib/rsvp/service.ts`) now returns `RsvpDetail`
(adds `submittedAt` on top of the existing `RsvpAnswer` shape) instead of
`RsvpAnswer`, and the invitation page renders it. Read access remains
VIEWER-and-above, matching the brief's explicit instruction that Viewer/
Editor/Owner all may view RSVP information with no mutation controls
added.

## D-034 --- Gift Methods Reuse `GiftMethod`'s Existing Fixed Columns for Every Conceptual Type, Including "Physical Gift"

**Decision:** Phase 9 ("Digital Gift / Angpao Foundation") uses the
`GiftMethod` model exactly as it already existed in `prisma/schema.prisma`
and `docs/DATABASE.md` §18 — `id`, `eventId`, `type` (`BANK` / `EWALLET` /
`QR` / `OTHER`), `providerName`, `accountName`, `accountNumber`,
`qrImageUrl`, `instructions`, `isActive` — with **no migration**. The task
brief additionally asked for a "physical gift / address" conceptual
method with fields like recipient name and delivery instructions; since
neither `docs/DATABASE.md` nor `docs/PRD.md` §28 defines a `PHYSICAL`
type or an `address` column (the schema's four types and columns are
final, not a partial draft), this is mapped onto the existing `OTHER`
type: `providerName` becomes a free-text title (e.g. "Alamat Pengiriman
Kado"), `accountName`/`accountNumber` become optional recipient
name/contact, and `instructions` carries the address and any delivery
notes. `lib/gifts/service.ts`'s `sanitizeGiftMethodInput()` nulls out
whichever columns don't apply to the selected `type` before persisting
(e.g. a `QR` method never stores `accountName`/`accountNumber`; `BANK`/
`EWALLET`/`OTHER` never store `qrImageUrl`), so a method's stored data
always matches what its own type actually displays.

**Rationale:** CLAUDE.md §8.1 requires relational fields over a JSON
blob when they already exist, and the roadmap/database-reconciliation
rule (CLAUDE.md §41: existing implementation → PRD → Architecture →
Database → Roadmap → judgment) puts the actual schema ahead of a task
brief's illustrative field list. Adding a fifth `GiftMethodType` value or
new columns for one conceptual variant of an already-generic "gift
method" would be schema churn for a UI-only distinction — the four
existing columns already say everything a manual/physical instruction
needs to say once given type-appropriate field labels
(`lib/gifts/labels.ts`'s `GIFT_METHOD_FIELD_LABELS`).

**Impact:** No Prisma migration in this phase. The gift method form
(`components/gifts/gift-method-form.tsx`) relabels the same four columns
per selected type rather than rendering type-specific inputs, and the
dashboard/public-projection field selection never differs by type either
— only what's shown/required does.

## D-035 --- Public Gift Methods Are Resolved Through the Shared `PublicInvitation` Projection, Not a Separate Lookup Like RSVP

**Decision:** Unlike Phase 6's RSVP data (D-025, deliberately resolved
outside `PublicInvitation` via its own `getRsvpGuestView()` call), active
gift methods are added directly to `lib/invitations/projection.ts`'s
`PUBLIC_EVENT_INCLUDE` (`where: { isActive: true }`, display columns
only) and mapped onto a new `PublicInvitation.giftMethods` field in
`toPublicInvitation()`.

**Rationale:** D-025's separation was specifically about RSVP being
per-guest, mutable, and independently domain-owned end-to-end (its own
read/write logic, matching `lib/guests/`'s shape). A gift method is
none of those things from the public renderer's point of view: it is
static, event-wide configuration configured once by the owner and read
identically by every visitor, exactly like `Schedule`/`Venue`/`Gallery`
data that already lives in this same projection. Splitting it into a
separate resolved prop would copy D-025's shape without its underlying
reason, adding an extra query and an extra prop to thread through
`InvitationRenderer` for no isolation benefit.

**Impact:** `app/invite/[slug]/page.tsx` needed zero changes for gift
methods — `getPublicInvitationBySlug()` already returns them as part of
the existing `invitation` object. `components/invitation/sections/gift-
section.tsx` reads `invitation.giftMethods` the same way
`GallerySection` reads `invitation.galleries`, and renders nothing when
the array is empty (never a placeholder — CLAUDE.md §9E, §1.5).

## D-036 --- Account Numbers Are Displayed in Full on the Public Invitation, Not Masked

**Decision:** A configured gift method's `accountNumber` (and, for the
`OTHER`/physical-gift case, the address inside `instructions`) is shown
in full on the public invitation, with a client-side "Salin" copy button
next to it (`components/gifts/copy-value-button.tsx`). Nothing is masked
behind a reveal action.

**Rationale:** The Phase 9 brief explicitly allows this ("account number
may be displayed because the explicit purpose is transfer") and
`docs/PRD.md` §28 only requires copy-to-clipboard, not masking. A bank
account or e-wallet number configured here exists for one purpose —
guests transferring a gift to it — and masking would only add friction
without protecting anything: the number is not a secret the owner is
trying to keep from the very people they're publishing the invitation
to. This intentionally differs from `GuestInvitation.token`
(D-027/D-024), which is a per-guest access-control secret and stays
masked from anyone without EDITOR/OWNER role; a gift account number has
no such access-control role to play.

**Impact:** `lib/invitations/projection.ts` passes `accountNumber`
through unmodified (only `qrImageUrl` is safety-filtered, via the same
`toSafeHttpUrl()` every other public image/link field uses). The copy
button never reports success unless `navigator.clipboard.writeText`
actually resolves, and never sends the copied value anywhere (no
analytics, no network call) — same contract as the existing
`CopyInviteLinkButton`/`MessagePreview` copy actions.

## D-037 --- `GiftRegistry`/`GiftItem`/`GiftReservation` and `GiftTransaction` Remain Deferred

**Decision:** Phase 9 implements gift *methods* only (configuration +
public display + copy-to-clipboard). The already-existing
`GiftRegistry`/`GiftItem`/`GiftReservation` models are left completely
untouched (no service, no UI), and `GiftTransaction` is left untouched
as well — no code in this phase reads, writes, or references any of the
four.

**Rationale:** `docs/ROADMAP.md` scopes these to its own later phases
(Phase 16 "Digital Gift" — what this phase actually implements, despite
being requested under the label "Roadmap Phase 9" — vs. Phase 17 "Gift
Registry", P2 priority, a distinct acceptance-criteria set about
inventory/reservation/duplicate-prevention that gift *methods* don't
need). The Phase 9 brief itself instructed exactly this: implement the
registry "only if the existing schema/PRD clearly support a basic
registry foundation" and explicitly "do not force registry
implementation" or "implement fake payment processing." A real
reservation flow needs its own concurrency-safe
available-quantity/duplicate-reservation logic (docs/PRD.md §29) that
would be a half-implemented guess if bolted onto this phase; a real
`GiftTransaction` needs an actual payment provider integration, which
CLAUDE.md §7.4/§1.4 forbid faking.

**Impact:** No new code touches these four models. This is noted here,
alongside the phase-numbering mismatch pattern already documented in
`docs/STATUS.md`, so the deferral is a recorded decision rather than a
silent omission.

## D-038 --- Wish Moderation Is a Soft Delete; Submission Is Capped Per Guest via a Plain Count Check

**Decision:** Roadmap Phase 10 ("Wishes") implements "Delete" as a status
transition (`lib/wishes/service.ts`'s `deleteWishForUser()` sets
`Wish.status` to `DELETED`), never a `prisma.wish.delete()` row removal.
Separately, `submitWishForGuest()` rejects a submission once a guest
already has `WISH_PER_GUEST_LIMIT` (3) non-deleted wishes for the event,
computed with a plain `prisma.wish.count()` — no schema change.

**Rationale:** `WishStatus` (docs/DATABASE.md §17,
`prisma/schema.prisma`) already defines four values — `PENDING`,
`APPROVED`, `HIDDEN`, `DELETED` — as one enum on one column. A `DELETED`
value only makes sense as a state a row can be *in*; if hard deletion were
intended, the schema would have no reason to distinguish it from `HIDDEN`
at all (both would just be "not shown"). Per CLAUDE.md §41's ambiguity
order (existing implementation first), the schema's own shape is treated
as the authoritative signal here, since neither `docs/PRD.md` §23 nor
`docs/DATABASE.md` §17 explicitly states delete semantics beyond "Owner
can: Approve / Hide / Delete." Soft delete also keeps an audit trail a
hard delete would destroy, at no extra cost.

Separately, `Wish` has no `@@unique([eventId, guestId])` (docs/DATABASE.md
§17 deliberately allows more than one message per guest, unlike RSVP's
`eventId_guestId` unique index) — so there is no database-level constraint
available to prevent a guest from submitting many wishes the way RSVP's
upsert prevents duplicate RSVPs. The task brief explicitly asked for
"repeated abuse" prevention "if this can be done cleanly with the existing
schema," and explicitly prohibited inventing a migration for it. A count
check against the existing `eventId`/`guestId` columns is exactly that:
clean, requires no schema change, and still allows a guest 1-2 genuine
corrections (a typo, a follow-up thought) before being blocked. A deleted
wish doesn't count toward the cap, since only an EDITOR/OWNER can delete
one — a guest cannot use deletion to reset their own quota, so excluding
`DELETED` from the count creates no abuse loophole; it only means a
moderator removing a spam/duplicate entry frees up room for a genuine one.

**Impact:** `lib/wishes/service.ts`'s `WISH_PER_GUEST_LIMIT = 3` and
`buildWishFilter()` (`ALL` = every non-`DELETED` row; `DELETED` is its own
explicit dashboard filter). No IP-only rate limiting was treated as
sufficient on its own — `lib/wishes/rate-limit.ts` (10 submissions per 10
minutes per IP, tighter than RSVP's 20) is a first line of defense against
scripted abuse, while the per-guest cap is what actually bounds one real
guest's submission count regardless of IP. No CAPTCHA, external moderation
provider, or other new infrastructure was added — the brief explicitly
ruled these out absent a canonical-docs requirement, and none exists.
Covered by `lib/wishes/service.integration.test.ts` (cap enforcement,
deleted-wish exclusion, per-guest independence, soft-delete row survival).

## D-039 --- Public Wishes List Lives in the Shared Projection; Guest Submission Identity Reuses the Already-Resolved Guest Context

**Decision:** Approved wishes are added directly to
`lib/invitations/projection.ts`'s `PUBLIC_EVENT_INCLUDE`
(`where: { status: APPROVED }`, display columns only) and mapped onto a
new `PublicInvitation.wishes` field — the same shape gift methods already
use (D-034/D-035), not RSVP's separately-resolved-lookup shape (D-025).
Separately, the *submission* identity context a template needs (which
guest, via which token, is allowed to submit) is threaded as a new
`wishGuest?: { token: string; guestName: string } | null` prop alongside
`rsvp`, but is built in `app/invite/[slug]/page.tsx` **without a second
database query** — it reuses `invitation.guest.displayName`, which the
page already resolved once via `resolveGuestContext()` for the base
invitation.

**Rationale:** An approved wish is static, event-wide content read
identically by every visitor once published — exactly the gift-method
case D-034/D-035 already reasoned through, not the per-guest mutable-state
case RSVP's D-025 addresses. Splitting it into a separately-resolved
lookup would copy D-025's isolation pattern without its underlying reason
(RSVP needed its own query because it needed `seatQuota`/existing-answer
data the base projection doesn't carry). For the submission-identity half,
RSVP's D-025 lookup (`getRsvpGuestView()`) exists specifically to fetch
`seatQuota` and an existing answer that aren't in `PublicInvitation` —
wishes need neither; the only thing a wish submission form displays is the
guest's name, which `invitation.guest.displayName` already provides from
the query the page runs regardless. Adding a second, RSVP-shaped lookup
here would be an unnecessary database round trip on every personalized
page load with no data it would return that isn't already in hand.

**Impact:** `lib/invitations/types.ts`'s `PublicWish` (`id`, `name`,
`message`, `createdAt` — never `guestId`/`eventId`/`status`) and
`PublicInvitation.wishes`. `lib/invitations/templates/registry.ts`'s
`InvitationTemplateProps.wishGuest` and
`components/invitation/invitation-renderer.tsx` thread it through exactly
like `rsvp`, but `app/invite/[slug]/page.tsx` needed zero new queries for
either half of this feature. Covered by
`lib/invitations/projection.test.ts` (fabricated-input mapping, no
guestId/eventId/status leak), `lib/invitations/service.integration.test.ts`
(approved-only visibility, cross-event isolation, real DB round trip), and
`e2e/wishes.spec.ts` (the full submit → PENDING → approve → public,
hide → not-public flow).

## D-040 --- Gallery Image Deletion Is Storage-First, Non-Atomic, Fail-Closed

**Decision:** `lib/editor/service.ts`'s `deleteGalleryItem()` removes the
underlying Supabase Storage object (when the item's `url` resolves to one —
see D-041) *before* deleting the `GalleryItem` row, inside a plain
try/catch, not a database transaction. If the storage removal call throws,
the function re-throws `GalleryStorageDeletionError` immediately and the
`GalleryItem` row is left completely untouched — the operation either
fully succeeds (object gone AND row gone) or the caller sees a clear,
retryable error with both still intact. There is no path that deletes the
DB row while the storage object survives.

**Rationale:** A Prisma `$transaction` cannot span an external HTTP call
to Supabase Storage, so an all-or-nothing guarantee isn't available for
free — the task brief explicitly asked for a documented compensation
strategy instead. Two alternatives were considered and rejected:
(a) delete the DB row first, then best-effort delete storage and swallow
a failure — rejected because it reports a false "fully deleted" success
to the owner while silently leaking a storage object forever (an ongoing
cost with no way for the owner to ever discover or retry it), which is
exactly what the brief's "do not leave the system falsely reporting a
successful complete deletion" instruction rules out; (b) delete storage
first but keep the DB row on failure while *also* marking it as
"deletion pending" for a background retry — rejected as unnecessary
complexity for this product's scale (no queue/worker infrastructure
exists or is otherwise needed elsewhere in this codebase). Storage-first
with a hard abort on failure is the simplest strategy that never orphans
a storage object and never lies about the outcome; its cost is that a
transient Storage outage blocks deletion entirely until it recovers,
which is an acceptable, honest tradeoff (the owner sees "gagal
menghapus... coba lagi" and can retry) rather than a silent leak.

**Impact:** `lib/storage/errors.ts`'s `GalleryStorageDeletionError` /
`mapStorageErrorMessage()` produce the Indonesian retry message; no raw
Supabase error ever reaches the client. Proven directly in
`lib/editor/service.integration.test.ts`: deleting a real uploaded image
removes both the DB row and the live Storage object (confirmed via a
follow-up download attempt that fails); a VIEWER's rejected delete
attempt leaves both the row and the object provably intact.

## D-041 --- No New Storage-Object-Path Column; the Path Is Recovered From the Stored Public URL

**Decision:** `GalleryItem` gained no new column for Phase 11.
`lib/storage/paths.ts`'s `derivePathFromPublicUrl()` recovers a bucket-
relative object path purely by string-prefix-stripping the item's already-
stored `url` against `{NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/
{SUPABASE_STORAGE_BUCKET}/`, returning `null` (never a guess) when the URL
doesn't match that exact prefix.

**Rationale:** The task brief explicitly required stopping to report
before adding a schema column for this, rather than assuming the existing
`url` column is enough. It genuinely is enough, for a reason specific to
this feature's own design: every object this codebase ever uploads is
placed at a path *we* generate (`lib/storage/paths.ts`'s
`buildGalleryObjectPath()`) and immediately store the resulting Supabase-
issued public URL — a deterministic, well-known format
(`.../object/public/<bucket>/<path>`) — as `GalleryItem.url`. Deletion
never needs to derive a path for an object it didn't itself create with a
known, parseable URL shape. The one case this could fail — a `GalleryItem`
whose `url` is an arbitrary externally-pasted address (every gallery item
created before this phase, via the old URL-paste flow, plus every `VIDEO`
item going forward, which remains URL-based — see the "VIDEO" note in
`docs/STATUS.md`) — is handled correctly by design: `derivePathFromPublicUrl`
returns `null` for it, and `deleteGalleryItem` correctly treats `null` as
"no storage object to remove," not an error, since no such object was ever
created by this application. Adding a dedicated `storagePath` column would
duplicate information already fully recoverable from `url` for every case
that matters, for no behavioral benefit.

**Impact:** No Prisma migration. Covered directly by
`lib/storage/paths.test.ts` (own-bucket URL → correct path; a different
host, a different bucket name, or a traversal-shaped suffix → `null`) and
`lib/editor/service.integration.test.ts` (a legacy/external-URL video item
deletes its row without ever attempting a storage call).

## D-042 --- `next/image` Not Adopted for the Gallery; Plain `<img>` Retained

**Decision:** The gallery grid, lightbox, and editor preview all continue
using plain `<img>` (with `loading="lazy"` and `decoding="async"` added in
this phase), not `next/image`.

**Rationale:** Every other section that renders event-owner-supplied
media in this codebase (Hero, Couple, LoveStory, Gift) already made this
exact choice deliberately, each with its own `eslint-disable
@next/next/no-img-element` comment recorded at the time — switching only
Gallery to `next/image` would be an inconsistent one-off, not a
architecture-wide improvement. More concretely: `next/image` requires a
fixed, known allowlist of remote origins (`images.remotePatterns`) to
optimize a URL, but this codebase's gallery items come from a genuine mix
of origins even after this phase — newly-uploaded images live on this
project's own Supabase Storage bucket (a stable, allowlist-able origin),
but pre-existing/legacy URL-pasted images and every `VIDEO` item's
`thumbnailUrl` remain arbitrary external URLs by design (D-041's "VIDEO
stays URL-based" point). A per-URL-origin branch (Supabase-hosted →
`next/image`, everything else → plain `<img>`) was considered and
rejected as exactly the "unnecessary custom image-processing
infrastructure" the task brief warns against, for a benefit — the Next.js
built-in optimizer's resize/reformat pipeline — that Supabase Storage's
own `invitation-assets` bucket has no confirmed image-transformation
add-on for anyway (that's a separate, paid Supabase feature this project
has not verified or enabled).

**Impact:** `components/invitation/sections/gallery-grid.tsx`'s and
`components/editor/sections/gallery-form.tsx`'s `<img>` usage keeps the
same `eslint-disable-next-line @next/next/no-img-element` pattern as every
other media-rendering component in this codebase. Layout shift is already
prevented structurally (a fixed `aspect-square` CSS container the image
fills via `object-cover`/`object-contain`), not via reserved intrinsic
`width`/`height` attributes, so no new `GalleryItem` columns were needed
for this either. If a real product need for responsive multi-resolution
delivery emerges later, the narrow fix is enabling and verifying Supabase
Storage's image transformation for the specific bucket in use, then
introducing `next/image` scoped only to that one confirmed-safe origin —
not before.

## D-043 --- Image Format/Dimension Validation Is Hand-Rolled Magic-Byte Sniffing, Not a New Dependency

**Decision:** `lib/storage/image-format.ts` implements PNG/GIF/JPEG/WebP
signature detection and dimension extraction directly (a few dozen lines
of buffer parsing), rather than adding a package such as `image-size` for
the same purpose.

**Rationale:** This is the actual security check behind "reject
executable/non-image content even if a client claims an image MIME type"
— a client can set `Content-Type: image/png` on any byte stream, so the
real authenticity gate has to read the file's own magic bytes, which
requires *some* implementation either way. A dedicated npm package would
do this more completely (full WebP VP8/VP8L bit-packed dimension decode,
more formats), but the task brief explicitly warns against building
"unnecessary custom image-processing infrastructure," and this module
deliberately stays on the validation side of that line: it never decodes,
resizes, or transcodes pixel data, only reads a handful of fixed-offset
header bytes per format to confirm authenticity and bounds. Avoiding a new
runtime dependency for a server-only validation utility this size also
sidesteps supply-chain surface for no real functionality loss for this
product's actual needs (JPEG/PNG/GIF/WebP from phone cameras and standard
image editors).

**Impact:** WebP's simpler `VP8 `/`VP8L` sub-formats are authenticated by
signature but their dimensions aren't decoded (documented directly in
`lib/storage/image-format.ts`'s own comments); only the `VP8X` (extended)
sub-format returns decoded dimensions, which is what modern export
tooling most commonly produces. This is a narrower, explicitly-scoped
limitation, not a silent gap — dimension *bounds* simply aren't enforced
for that one sub-format, while every other validation (size, MIME,
extension, and the authenticity check itself) still fully applies.
Covered by `lib/storage/image-format.test.ts` (real/hand-built fixtures
per format, including a genuine PNG and a rejected Windows PE/executable
signature) and `lib/storage/validation.test.ts` (the full validation
pipeline, including a mismatched-content-vs-claimed-MIME rejection).

## D-044 --- QR Codes Use `qrcode.react` (Client-Side SVG), No New Token, No Persistence

**Decision:** Roadmap Phase 13 ("QR Invitation") adds `qrcode.react`
(`QRCodeSVG`) as the only new dependency, rendered entirely client-side.
The QR encodes the exact same personalized invitation URL
`buildGuestInvitationUrl(eventSlug, token)` already produces for the
existing copy-link/WhatsApp-share features — no second token, no QR-
specific identifier, and no persisted QR image (file or database row).
"Unduh QR" downloads a client-generated `.svg` Blob via a temporary
anchor element; there is no Route Handler or Server Action for either
generating or downloading the QR.

**Rationale:** `qrcode.react` was selected after checking `package.json`
(no existing QR capability) and evaluating the smallest viable option per
AGENT_EXECUTION.md §18's dependency discipline: it has **zero runtime
dependencies of its own** (`npm view qrcode.react dependencies` returns
empty), declares `react@^19.0.0` as a peer (matching this project's React
19), is a long-established, widely-used package purpose-built for exactly
this need, and requires no native binary compilation — unlike server-side
QR-image libraries that typically shell out to or bind against a native
rasterizer. Rendering client-side (rather than a server-generated image)
keeps the feature fully static/stateless: the browser already has the
authorized `inviteLink` string (passed down from the Server Component
page, per the existing pattern `CopyInviteLinkButton`/`MessagePreview`
already use), so encoding it into a QR needs no additional server round
trip, no new authorization check, and no new data-fetching path — the
existing OWNER/EDITOR-only, VIEWER-masked `inviteLink` computation in
`app/dashboard/events/[eventId]/guests/[guestId]/invitation/page.tsx`
(unchanged) is the entire authorization boundary this feature relies on.
SVG (over PNG/canvas) was chosen because a real personalized-invitation
QR only needs to be crisp and printable, `qrcode.react`'s `QRCodeSVG`
forwards a ref directly to the rendered `<svg>` DOM node (making a
client-side download trivial via `XMLSerializer`), and it avoids the
extra `<canvas>`-to-Blob conversion step a PNG download would need. No
new token/model/migration was introduced because none is needed: the QR
is a different visual encoding of data that already exists and is already
correctly authorized — inventing a parallel "QR token" would duplicate
`GuestInvitation.token` for no security or product benefit, and would
also mean a QR could outlive a token regeneration, defeating the point of
D-028's revocation guarantee.

**Impact:** `components/guests/guest-qr-code.tsx` (new, client-only,
receives only the already-authorized `link`/`guestName` strings — never a
token, never independent data access) and `lib/guests/qr-filename.ts`
(pure, reuses the existing `lib/events/slug.ts` `slugify()` rather than
duplicating slug logic — the download filename is derived only from the
guest's own display name, never the token). Regenerating a guest's
invitation token (D-028, unchanged) automatically invalidates any
previously-downloaded/printed QR the same way it already invalidates a
copied link, since both encode the same now-superseded URL — no QR-
specific invalidation logic was needed. Covered by
`lib/guests/qr-filename.test.ts` (pure filename logic) and
`e2e/guest-invitation.spec.ts` (OWNER/EDITOR see the QR and download
control, VIEWER sees neither, a real downloaded file is valid SVG, and
two different guests produce visibly different QR content — proving the
QR is genuinely link-derived without depending on `qrcode.react`'s
internal SVG structure).

## D-045 --- Check-in Scanning Uses `qr-scanner` (Nimiq), Camera Requested Only on Explicit Action

**Decision:** Roadmap Phase 14 ("Check-in") adds `qr-scanner` (`^1.4.2`)
as the only new dependency for decoding a QR code from the device camera.
`components/checkin/qr-code-scanner.tsx` wraps its plain `QrScanner`
class: a `<video>` element plus `new QrScanner(video, onDecode, options)`,
started/stopped imperatively. Camera access (`getUserMedia`, via the
library's `.start()`) is requested only when the staff member explicitly
taps "Mulai Pindai" — never automatically on mount or tab switch — and
`QrScanner.hasCamera()` is checked first so a device with no camera shows
an honest "Tidak ada kamera yang terdeteksi" state rather than a raw
permission prompt or a silent failure. A denied/unavailable camera never
blocks the feature: manual search (`components/checkin/manual-search.tsx`,
server-backed via `searchGuestsForCheckInAction`) is a mandatory, always-
visible fallback, not something gated behind a failed camera attempt.

**Rationale:** Evaluated against `jsqr` (decode-only, would need hand-
written camera/canvas capture glue — more code to secure and maintain),
`@zxing/library`/`@zxing/browser` (heavier, broader multi-format barcode
surface than this feature needs), `html5-qrcode` (bundles more UI/behavior
than this feature's custom reception flow wants to inherit), and React-
specific wrapper packages (extra indirection and version-lag risk against
React 19). `qr-scanner` was selected per AGENT_EXECUTION.md §18's
dependency discipline after checking `npm view qr-scanner`: **zero runtime
dependencies of its own** (one type-only dev dependency,
`@types/offscreencanvas`), **no peer dependencies** (framework-agnostic
plain JS, so it composes cleanly with a thin React wrapper rather than
fighting one), MIT-licensed, and a cohesive camera+decode API purpose-
built for exactly this "scan with the device camera, get a decoded
string" need — `npm install` reported "added 2 packages" (the package
itself plus its one type-only dependency), confirming no unexpected
transitive dependency surface.

**Impact:** `components/checkin/qr-code-scanner.tsx` is a `"use client"`
component; it never resolves what a scanned value *means* — it only
reports the raw decoded string to its parent via `onDecode`. All token
extraction and validation happens server-side (see D-046) — the client
never interprets, echoes back, or trusts its own decode result as an
identity. The component pauses (`.stop()`) rather than tearing down while
a preview/result is showing (parent-controlled via an `active` prop), and
guards against firing `onDecode` more than once per active scanning
session, preventing duplicate decode events for a single physical scan.

## D-046 --- `CheckIn` Is the Authoritative Source of Check-in State; `GuestInvitationStatus.CHECKED_IN` Is a Transactionally-Synchronized Projection

**Decision:** `CheckIn` is the authoritative source of check-in state.
`GuestInvitationStatus.CHECKED_IN` is synchronized transactionally as a
denormalized invitation-lifecycle projection. Duplicate prevention relies
on the database unique constraint `[eventId, guestId]` on `CheckIn` — not
on reading `GuestInvitation.status` as a check-then-act guard. A
check-in attempt (`lib/checkin/service.ts`'s `performCheckIn()`) always
goes straight to the authoritative write:
`prisma.$transaction([checkIn.create(...), guestInvitation.update({ status: CHECKED_IN })])`.
If the guest is already checked in, `checkIn.create()` itself fails the
unique constraint (Prisma error code `P2002`); that failure is caught and
translated into an honest `ALREADY_CHECKED_IN` outcome, and the losing
request never touches `GuestInvitation.status` again — the transaction
that actually created the `CheckIn` row is the only writer of that status
transition, ever.

**Rationale:** A "read `GuestInvitation.status`, then create `CheckIn` if
it isn't already `CHECKED_IN`" sequence is a classic check-then-act race:
two concurrent requests can both read a not-yet-`CHECKED_IN` status,
decide independently to proceed, and (absent the constraint doing the
real work) either produce two `CheckIn` rows or leave the second write
silently racing the first. Postgres's own unique index is the only thing
in this system that can atomically arbitrate "who got here first" under
real concurrency — no application-level advisory lock or `SERIALIZABLE`
isolation level was introduced, because the unique constraint already
gives the correctness guarantee needed (proven directly in
`lib/checkin/service.integration.test.ts`'s genuinely concurrent
`Promise.all([...])` test: exactly one `CheckIn` row, one `SUCCESS`, one
honest `ALREADY_CHECKED_IN`). Keeping `GuestInvitationStatus.CHECKED_IN`
as a *projection* (rather than the source of truth) also avoids
duplicating the one thing a unique index already guarantees; the status
column exists for lifecycle display (matching `NOT_SENT`/`SENT`/`OPENED`/
`RSVPED`'s existing meaning, per `docs/DATABASE.md` §9), not for
concurrency control.

**Impact:** `lib/checkin/service.ts`'s `performCheckIn()` is the only
writer of a `CheckIn` row anywhere in the codebase. The pre-existing
never-downgrade protections in `lib/rsvp/service.ts`'s
`resolveNextInvitationStatus()` and `lib/guests/service.ts`'s
`resolveInvitationAfterRegeneration()` (both already treat `CHECKED_IN`
as a terminal, later-than-`RSVPED` lifecycle stage) are unmodified and
remain correct under this decision, since check-in only ever moves status
*into* `CHECKED_IN`, never out of it. Every read path that needs to know
"is this guest checked in" (dashboard summary, search results, guest-list
column, preview) queries `CheckIn` existence directly
(`checkIn.findUnique`/`count`), never `GuestInvitationStatus` — the status
column is shown as supplementary lifecycle information only (e.g. the
existing guest-list "Sudah Check-in" label), never as the thing a
duplicate check-in decision is made from.

## D-047 --- Check-in Authorization Reuses `EventMemberRole`; RSVP Status Never Gates Check-in; "Reception Mode" Means a Fast Repeated-Scan Loop, Not a Separate Concept

**Decision:** Check-in introduces no new role or permission system.
OWNER and EDITOR may view and perform check-ins; VIEWER may view
(dashboard summary, search, guest preview) but cannot mutate — enforced
server-side in `lib/checkin/service.ts` by re-deriving the caller's role
from `getAuthorizedEvent(eventId, userId, minRole)` on every call, exactly
like every other domain in this codebase (never trusting a client-supplied
role or id). A guest's RSVP status (`ATTENDING`/`NOT_ATTENDING`/`MAYBE`/no
response) is display-only on the check-in screen and never blocks
check-in — nothing in `docs/PRD.md`, `docs/DATABASE.md`, or the existing
RSVP/check-in relationship implies otherwise, and walk-in/plus-one
attendance at a real event is common enough that hard-gating check-in on a
prior RSVP would actively work against the feature's purpose. "Reception
mode" was interpreted as a UX requirement, not a new domain concept: after
any check-in result (success, already-checked-in, invalid, error), the
operator stays on `/dashboard/events/[eventId]/check-in`
(`components/checkin/checkin-shell.tsx` never navigates away) and one
obvious action resets straight back to scanning/searching, so a queue of
arriving guests can be processed back-to-back without re-navigating
through the dashboard each time.

**Rationale:** Introducing a separate STAFF role or a check-in-specific
permission table would duplicate `EventMemberRole`'s existing
OWNER/EDITOR/VIEWER semantics for no product benefit this phase's brief
asked for — every other domain in this codebase already treats EDITOR as
"can perform the domain's write operations" and VIEWER as "read-only",
and check-in fits that pattern exactly. Gating check-in on RSVP status
was considered and rejected: `CheckIn`'s own unique constraint (D-046)
already makes duplicate check-in impossible regardless of RSVP state, and
nothing in the product requirements ties physical attendance to a prior
RSVP answer.

**Impact:** `lib/checkin/service.ts`'s `requireCheckInViewerAccess()` /
`requireCheckInEditorAccess()` are the only authorization entry points;
every service function calls one of them before touching the database.
`CheckInGuestView.rsvpAttendance` is surfaced for display only — no
function in `lib/checkin/service.ts` branches on its value before
allowing a check-in. `components/checkin/checkin-shell.tsx` implements
the reception loop as a small client-side state machine
(`idle → loading → preview → result → idle`) with no server-side "session"
concept — each scan/search is an independent, freshly-authorized request,
consistent with every other Server Action in this codebase.

## D-048 --- Analytics Session Tracking: First-Party Anonymous Cookie, `InvitationView` as Source of Truth, Never Blocks Rendering

**Decision:** Roadmap Phase 15 ("Analytics") tracks invitation views using
a first-party, opaque, HttpOnly analytics session cookie
(`di_analytics_sid`, `lib/analytics/session.ts`) assigned by `proxy.ts`
the first time a visitor hits `/invite/*` — never a guest id, never an
invitation token, never derived from IP. `InvitationView` (already
present in the schema before this phase) is the sole source of truth for
view counts; nothing infers a view from RSVP, `GuestInvitationStatus`,
page-count client state, or dashboard visits. The same `eventId` +
`sessionId` pair within a 30-minute window counts as one tracked view
(`lib/analytics/service.ts`'s `recordInvitationView()`), a plain
"does a recent row already exist" check rather than a database
uniqueness constraint — an accepted, approximate dedup, not a
correctness guarantee like `CheckIn`'s. Tracking a view
(`trackPublicInvitationView()`) never throws: it validates input, checks
a session-keyed rate limit (`lib/analytics/rate-limit.ts`, reusing
`lib/rate-limit/`), performs the dedup check, and writes — catching and
logging any failure internally — so a database outage or malformed
cookie can never prevent the invitation itself from rendering. Device
type is a lightweight, controlled classification
(`MOBILE`/`TABLET`/`DESKTOP`/`UNKNOWN`) computed from the `User-Agent`
header and stored instead of it; `Referer` is reduced to just its origin
before storage. Raw IP, raw user-agent strings, and invitation tokens are
never stored or logged anywhere in this domain.

**Rationale:** A Server Component (`app/invite/[slug]/page.tsx`) cannot
set a cookie itself in the Next.js App Router — only a Server
Action/Route Handler/Middleware response can — so cookie assignment had
to live in `proxy.ts`, which already runs on every request and already
manages the Supabase auth cookie the same way (mutate `request.cookies`,
rebuild `response` from the mutated request, then set the cookie on that
response — the exact pattern the existing Supabase block uses, reused
rather than reinvented). Session-based (not IP-based) identification and
rate limiting were chosen deliberately, unlike `lib/rsvp/rate-limit.ts`'s
IP-keyed limiter: an invitation link is often opened by many distinct
guests behind the same shared network (a family's WiFi, a venue's
network around the event date), and IP-keying would risk conflating
distinct real visitors or throttling them unfairly. "Unique visitors" is
therefore always reported as unique anonymous sessions, never a claim
about unique humans — one person using two browsers/devices counts
twice, documented directly in `AnalyticsDashboardData`'s own field
comments. Analytics tracking is deliberately unable to fail loudly: this
is a secondary, best-effort metric, and CLAUDE.md's product-priority
ordering (correctness/security/reliability of the *invitation itself*
outranks analytics) means a tracking failure must degrade silently, not
visibly.

**Impact:** `proxy.ts` gained one additional, narrowly-scoped block
(guarded by `isPublicInvitationPath()`, matching
`lib/supabase/route-protection.ts`'s `isProtectedPath()` pattern) —
dashboard/API requests never receive or need this cookie
(`path: "/invite"` scoping enforces this at the browser level, not just
in application logic). `app/invite/[slug]/page.tsx` gained one additional
`await` sequence (cookie + header reads, then
`trackPublicInvitationView()`) that cannot affect metadata generation,
SEO, personalization, or rendering even on total failure. Covered by
`lib/analytics/session.test.ts` (pure classification/cookie-option unit
tests), `lib/analytics/validation.test.ts`,
`lib/analytics/rate-limit.test.ts`,
`lib/analytics/service.integration.test.ts` (real Supabase DEV: correct
guestId resolution/cross-event rejection, dedup window behavior, FK
failure swallowed without throwing), and `e2e/analytics.spec.ts` (a real,
unauthenticated browser navigation exercising the full
proxy-cookie-tracking-dashboard chain end-to-end).

## D-049 --- Analytics Dashboard Metrics Reuse Existing Authoritative Data; Gifts Report Active Methods Only, Never a Fabricated Transaction

**Decision:** `lib/analytics/service.ts`'s `getAnalyticsDashboardData()`
computes every metric from an existing, already-authoritative source —
never a separate, parallel calculation. RSVP counts reuse the same
`prisma.rSVP.groupBy(["attendance"])` aggregation shape
`lib/rsvp/service.ts` already established and its exported
`calculateResponseRate()` directly (not a re-implementation). Wishes use
the same "non-`DELETED`" convention wishes moderation already established
(D-038) for the "total" count, plus a separate `APPROVED` count.
Check-in uses `CheckIn` row counts directly, never
`GuestInvitationStatus`. Gifts report only `activeMethods`
(`GiftMethod.isActive` count) — Phase 9/16 never implemented real gift
*transactions*, so no amount/revenue/transaction-count metric is
computed or displayed, per D-037. A new pure function,
`calculateCheckInProgress(checkedIn, confirmed)`, defines "check-in
progress" as `checkedIn / confirmed` (confirmed = RSVP `ATTENDING`
count), clamped at 100% via `Math.min(checkedIn, confirmed)` — this is
deliberately a *different* metric from Phase 14's own reception-dashboard
"remaining" (`totalInvited - checkedIn`); the two answer different
questions ("how much of my confirmed audience has arrived" vs. "how many
people are still expected at the door") and are not meant to reconcile.
No third-party analytics provider (Google Analytics, Mixpanel, PostHog,
etc.) is used or required — `ANALYTICS_PROVIDER`/`ANALYTICS_API_KEY`
remain unset in `.env.example`; every metric this phase's PRD §35/
ARCHITECTURE §25 scope requires is computable from first-party data
already in this database.

**Rationale:** Reusing `calculateResponseRate()` and the RSVP
`groupBy` shape avoids two independently-maintained definitions of
"response rate" ever drifting apart. Defining check-in progress against
`confirmed` (not `totalInvited`) matches this phase's own explicit
product framing ("RSVP conversion... Attendance... Check-in progress" —
PRD §35) as a *conversion* metric, distinct from Phase 14's operational
"who's left to arrive" framing — clamping at 100% is required because
D-047 already established that a guest can check in without ever RSVPing
`ATTENDING` (a legitimate walk-in), so `checkedIn` can genuinely exceed
`confirmed`. Reporting only `activeMethods` for gifts (rather than
inventing a placeholder "amount raised") follows CLAUDE.md §1.4/§7.4 and
AGENT_EXECUTION.md §11 directly: never fabricate a payment/transaction
figure that doesn't exist in the database.

**Impact:** `lib/analytics/types.ts`'s `AnalyticsDashboardData` is the
one safe DTO the dashboard renders — never a raw Prisma model. Every
count is a database-side aggregate (`count`/`groupBy`), never loaded row-
by-row into JavaScript for counting, matching this codebase's existing
performance conventions. Covered by
`lib/analytics/service.test.ts` (zero-denominator and clamping cases for
`calculateCheckInProgress`) and
`lib/analytics/service.integration.test.ts`'s full aggregation test,
which seeds real RSVP/Wish/GiftMethod/CheckIn rows (including a walk-in
check-in that exceeds `confirmed`) and asserts every field of the
returned DTO against hand-computed expected values.

## D-050 --- Five Additional Invitation Templates: Each Owns Its Own Composition, No Shared "Mega-Template" Configuration

**Decision:** Roadmap Phase 3 ("Template System") is completed by adding
five genuinely distinct template components — Modern Editorial, Floral
Romance, Dark Luxury, Traditional Nusantara, Soft Romantic — registered
in `lib/invitations/templates/registry.ts` alongside the existing
`minimal-elegant`. Each template is its own self-contained React
component under `components/invitation/templates/`, hand-authoring its
own composition, spacing rhythm, typography hierarchy, decorative
language, image treatment, and section presentation — never a shared,
prop-configurable "mega-template" that toggles between visual modes.
Every template calls the exact same shared, behavior-bearing pieces
(`RsvpForm`, `WishForm`, `GalleryGrid`/its lightbox, `CopyValueButton`,
`themeToCssVars()`) Minimal Elegant already used — none of these were
forked or duplicated; only each template's own surrounding markup
differs. Traditional Nusantara's decorative motif is deliberately a
generic, abstract, repeating geometric pattern, explicitly not
attributed to any specific named ethnic group, region, or textile
tradition — a more specific, attributed motif remains an open decision
for the product owner, not assumed by this implementation.

**Rationale:** A single configurable template driven by a large prop
surface (colors, spacing tokens, decorative-element toggles, layout
mode, etc.) was considered and rejected: it would either converge all
"templates" toward visually similar output (defeating CLAUDE.md §9.2's
explicit "each template must look genuinely different" requirement) or
require an unbounded, ever-growing configuration schema to keep chasing
genuine differentiation — the "universal TemplateShell with dozens of
visual props" this phase's brief explicitly rejected. Five independently
hand-built components, by contrast, can each pursue their own design
brief without being constrained by what a shared abstraction happens to
support, at the cost of some repeated structural boilerplate (each
template's own Hero/Schedule/Gallery/etc. section functions) — an
accepted, deliberate trade-off given this is a fixed set of 6 hand-designed
templates, not a user-generated or infinitely-extensible template system.
Reusing the shared RSVP/Wishes/Gallery/Gift components unchanged was
non-negotiable regardless of this decision: those components carry real
product behavior (seat-quota validation, guest-token resolution, wish
moderation state, gallery lightbox interaction) that must never exist in
more than one place. The Traditional Nusantara motif was kept generic
specifically because inventing a claim about which specific tradition a
decorative pattern belongs to — without the product owner's own
knowledge or explicit direction — risks genuine cultural
misrepresentation; "Nusantara-inspired," used only as the roadmap's own
template name already frames it, is the only claim this implementation
makes.

**Impact:** `lib/invitations/templates/registry.ts`'s `TEMPLATE_REGISTRY`
now maps all 6 seeded `Template` slugs (`prisma/seed.ts`) to real
components; the editor's `listTemplateOptions()`/`selectTemplate()`
(`lib/editor/service.ts`, unchanged) automatically treat all 6 as
selectable, since both already derived "implemented" from
`isKnownTemplateKey()` rather than hardcoding a slug list. Adding a
future 7th template remains additive: one new component, one new
registry entry, zero changes to the editor, the public route, or any
shared section/behavior component. Covered by
`lib/invitations/templates/registry.test.ts` (every seeded slug resolves
to its own distinct component), five per-template render-smoke test
files and `cross-template.test.tsx` (36 tests across all 6 templates:
non-wedding events, long content, anonymous visitors — see
`docs/STATUS.md`), `lib/editor/service.integration.test.ts` (real
selection through the authorized service layer), `e2e/templates.spec.ts`
(real browser rendering, zero console errors, no mobile overflow at
390×844), and a real screenshot-based visual review (desktop + mobile,
all 5 new templates) confirming each is genuinely, immediately
distinguishable from the others and from Minimal Elegant.

## D-051 --- Invitation Forms Become Theme-Aware by Rescoping Shared Design Tokens; Each Template Gets Its Own Default Palette via a `parseTheme()` Fallback Parameter

**Decision:** Two related, pre-existing gaps were fixed as a prerequisite
for the new templates (Dark Luxury especially): (1) `RsvpForm`/
`WishForm`/`CopyValueButton` rendered with the dashboard's default
shadcn color tokens (`--primary`, `--background`, `--border`, etc. from
`app/globals.css`) instead of the invitation's own theme, because those
shared UI components read those global CSS custom properties directly
and nothing previously overrode them inside the invitation subtree. (2)
`Theme.backgroundColor`/etc. always fell back to one single global
`DEFAULT_THEME` when an event had no explicit `Theme` row, regardless of
which template was selected — meaning selecting Dark Luxury without
manually configuring all 5 colors would render its dark-surface layout
against the light, neutral default palette designed for Minimal Elegant.

Fix (1): `components/invitation/theme-vars.ts`'s `themeToCssVars()` now
also emits the shared `--primary`/`--primary-foreground`/`--background`/
`--foreground`/`--secondary`/`--accent`/`--muted`/`--border`/`--input`/
`--ring` custom properties, scoped to the same root element every
template already applies `themeToCssVars()` to. CSS custom properties
cascade, so this rescopes those tokens *only within the invitation's own
subtree* — the dashboard elsewhere is completely unaffected. Zero
changes were made to `RsvpForm`, `WishForm`, `CopyValueButton`, or any
`components/ui/*` file. `--destructive`/`--destructive-foreground` were
deliberately left unscoped — an error state should stay recognizable
regardless of which template's palette is active.

Fix (2): `lib/invitations/theme.ts`'s `parseTheme()` gained an optional
second parameter, `fallback: PublicTheme = DEFAULT_THEME` (fully
backward compatible — every pre-existing call site and test is
unaffected). `lib/invitations/templates/default-themes.ts` (new) defines
each template's own default `PublicTheme`; `lib/invitations/
projection.ts`'s `toPublicInvitation()` — which already resolves the
event's `templateKey` at the exact point it calls `parseTheme()` — now
passes `getTemplateDefaultTheme(event.template?.slug ?? null)` as that
fallback. The merge remains genuinely field-by-field, at the same layer
it already happened at: an owner-set `Theme` column always wins; only a
genuinely null/invalid column falls back, now to the *selected
template's* default rather than unconditionally to the global one. No
new Prisma column, no new DTO field — `PublicTheme`/`PublicInvitation`
are structurally unchanged.

**Rationale:** Rescoping CSS custom properties at the existing single
root element (rather than modifying three separate, already-tested,
production-behavior-critical form components) is the least invasive
fix available — CLAUDE.md's engineering-judgment ordering explicitly
prefers minimizing complexity and preserving existing architecture. A
per-template default theme was necessary, not optional, once Dark Luxury
existed: without it, the single global `DEFAULT_THEME` (a light, warm,
neutral palette) would make Dark Luxury's own layout illegible by
default. Passing the fallback into the already-existing `parseTheme()`
call, at the point `projection.ts` already resolves `templateKey`, keeps
the merge logic in exactly one place rather than requiring every
template component to re-derive "is this field actually owner-set, or
just the fallback" from an already-collapsed DTO value — an approach
that was considered and rejected specifically because a `PublicTheme`
value has no way to distinguish "owner explicitly chose this exact
string" from "this is just where it fell back to" once constructed,
making a component-level guess unreliable at the edges (e.g., an owner
deliberately choosing a color that happens to equal the global default).
`resolveReadableForeground()` (`lib/invitations/color-contrast.ts`, real
WCAG relative-luminance math, zero new dependency) automatically picks a
legible foreground for text rendered against an arbitrary
primary/secondary/accent color, rather than relying on each template
author manually guessing a safe pairing — directly de-risking the
mandatory WCAG AA contrast verification this phase required for Dark
Luxury, Traditional Nusantara, and Soft Romantic.

**Impact:** Every template — including the untouched Minimal Elegant —
now renders its RSVP/Wishes forms and any `CopyValueButton` usage in its
own theme colors automatically, with no per-template opt-in required.
`lib/invitations/templates/default-themes.test.ts` proves every
template's own default `textColor`/`backgroundColor` pairing meets WCAG
AA (4.5:1) via a real, automated contrast-ratio check, not visual
inspection alone. `lib/invitations/projection.test.ts` proves the
field-by-field merge directly: a `dark-luxury` event with no `Theme` row
gets Dark Luxury's own palette; an event with no template selected still
gets the untouched global default; an owner-set field always overrides
the template default. `lib/invitations/color-contrast.test.ts` covers
the contrast/luminance math itself, including its fallback behavior for
a color format it can't parse (e.g. a named CSS color or `oklch()` an
owner might type into the free-text theme editor).

## D-052 --- `GuestInvitation.openedAt`/`OPENED` Remain Intentionally Unused; `InvitationView` Is the Sole Source of Truth for Invitation Opens

**Decision:** `GuestInvitation.openedAt` and `GuestInvitationStatus.OPENED`
remain **permanently, intentionally unwritten** by application code.
`GuestInvitationStatus.SENT`/`GuestInvitation.sentAt` remain unwritten
too, unchanged from D-029. No code was changed to implement this
decision — it is a closed reconciliation of a question Phase 7 explicitly
left open ("revisit if/when open-tracking becomes a real product
priority," see `docs/STATUS.md`'s Phase 7 "Known Limitations"), re-
examined now that Phase 15's `InvitationView` exists as a candidate
alternative. `InvitationView` (already tracking `eventId`, an optional
`guestId` resolved from a validated, event-scoped token exactly the way
every other domain resolves guest identity, an anonymous session id, and
a timestamp) is the sole, authoritative representation of "an invitation
was viewed/opened" — including at a per-guest level, via
`InvitationView.guestId`, even though no UI currently surfaces a
per-guest breakdown (Analytics' dashboard only shows the aggregate
`personalizedOpens` count today; building a per-guest "has this guest
opened it" view, if ever wanted, should query `InvitationView` grouped by
`guestId`, not add a new write path).

**Rationale — audit findings that drove this conclusion:**

1. **Zero application code writes these fields today.** A full-tree
   search confirms `openedAt`/`sentAt`/`GuestInvitationStatus.SENT`/`.OPENED`
   appear only in (a) `lib/guests/service.ts`'s token-regeneration reset
   logic, which only ever sets them to `null`, never to a real value, and
   (b) unit tests exercising that reset logic's *hypothetical* handling
   of those states as pure-function input. No RSVP, check-in, QR, guest-
   management, or public-invitation code path has ever produced `SENT` or
   `OPENED` in this codebase's history.
2. **`InvitationView` already structurally represents the same concept**,
   built independently and later (Phase 15) but solving the identical
   underlying question ("did this guest's personalized link get
   accessed"), with its own token validation, cross-event scoping, and
   privacy protections already proven correct (`lib/analytics/
   service.integration.test.ts`). Writing `openedAt` too would mean the
   same fact is recorded in two places, one of which (a per-guest,
   permanent `GuestInvitation` column) has no deduplication/rate-limiting
   applied the way `InvitationView`'s write path does today.
3. **A per-guest, dashboard-visible "Opened" indicator carries a
   materially different — and more misleading — claim than an aggregate
   analytics count, given identical underlying data quality.** A
   messaging app's link-preview unfurler (WhatsApp, Telegram, iMessage,
   Slack, etc.) fetching a personalized URL the moment an owner shares it
   would, if `openedAt` were written on page-render, prematurely and
   permanently mark that specific named guest as having "opened" their
   invitation before they ever saw it. An aggregate analytics number
   inflated by the same bot traffic is a well-understood, accepted
   limitation of any lightweight web view-counter; a confident per-person
   status badge next to a named guest in a dashboard is read very
   differently by an event owner, and being wrong there is a materially
   worse product outcome for the same root cause. Both `InvitationView`
   and a hypothetical `openedAt` write would fire at the identical
   server-side resolution point and are therefore equally exposed to this
   — the difference is entirely in how confidently each *presents* the
   same imperfect signal.
4. **`docs/PRD.md` §17 ("Invitation Opening") defines "opening" as a
   client-side gesture, not a server-side page load.** The PRD describes
   a cover/reveal screen — an opening title card with a "Buka Undangan"
   button the guest must tap, which then reveals the invitation content
   and (subject to browser autoplay restrictions) starts optional music.
   This is a discrete client interaction, not something a Server
   Component's GET-request execution can observe. **This pattern is not
   implemented in any of the 6 templates today** (confirmed by a
   repository-wide search — no "Buka Undangan" cover screen exists
   anywhere), and implementing it is explicitly out of scope for this
   task (it would be new template UI/UX work, not a lifecycle-tracking
   fix). Critically, even a page-render-time `openedAt` write would *not*
   correctly represent this PRD-defined "opening" moment — it would only
   ever capture "the URL was fetched by some agent," the same signal
   `InvitationView` already captures under a more honest label. If/when
   the cover-screen interaction is built, tracking a genuine click-to-
   reveal event would need its own new client→server signal (e.g. a
   Server Action invoked by the reveal button) — not a repurposing of
   this already-dead field.
5. **The original Phase 3/Phase 7 reasoning for not writing on every
   public page view — real abuse-surface and database-write-amplification
   concerns — remains valid** and is reinforced, not weakened, by
   Analytics already existing: Analytics' own write path (rate-limited by
   session, 30-minute deduplicated) is the more carefully engineered of
   the two candidate mechanisms for exactly this kind of high-frequency,
   low-trust public write; duplicating it with a second, less-guarded
   write path would only add risk, not correctness.

**Impact:** No files changed. `GuestInvitationStatus`'s `SENT`/`OPENED`
enum values and `GuestInvitation.sentAt`/`openedAt` columns remain in the
schema (removing them would be a needless breaking schema change for
values that cause no harm sitting unused, and `resolveNextInvitationStatus()`/
`resolveInvitationAfterRegeneration()`'s existing never-downgrade logic
already correctly handles them if they were ever set by a future data
migration or feature). `docs/STATUS.md`'s Phase 7 "Known Limitations"
section is updated to mark this as reconciled rather than merely
deferred. A future phase wanting a per-guest "opened" indicator in the
guest list UI should query `InvitationView` filtered by `guestId`, not
add a write to `GuestInvitation`. A future phase implementing PRD §17's
actual cover-screen interaction is a distinct, separately-scoped piece of
template/UX work, not a revival of this field.

## D-053 --- Content-Security-Policy: Nonce-Based `script-src`, `'unsafe-inline'` for `style-src`, Broad `img-src` — Each Directive Traced to Real Source Usage, Not a Generic Policy

**Decision:** `proxy.ts` now sets a `Content-Security-Policy` and a small
set of baseline security response headers (`lib/security/headers.ts`) on
every request. Each directive was decided from actual source evidence, not
copy-pasted:

-   `script-src 'self' 'nonce-{random}' 'strict-dynamic'` (+
    `'unsafe-eval'` only in development, matching React's dev-mode error
    reconstruction). A fresh, cryptographically random nonce
    (`crypto.randomUUID()`, base64-encoded) is generated per request in
    `proxy.ts` and set on both the CSP header and an `x-nonce` request
    header, following the exact pattern documented in Next.js 16.3.5's own
    bundled guide (`node_modules/next/dist/docs/01-app/02-guides/
    content-security-policy.md`) — confirmed by reading that file directly
    rather than relying on training-data assumptions about an older Next
    version. Next.js reads the nonce back out of the CSP header at render
    time and applies it automatically to its own injected scripts (RSC
    flight-data/hydration) — no per-component code changes were needed.
-   `style-src 'self' 'unsafe-inline'` — deliberately **not** nonce-based.
    9 files (all 6 invitation templates + `components/analytics/
    progress-bar.tsx` + `components/checkin/qr-code-scanner.tsx` +
    `components/invitation/sections/hero-section.tsx`) use React's
    `style={{...}}` prop for dynamic, per-theme CSS custom properties —
    values computed per render, with no practical nonce/hash strategy.
    This is not presented as fully hardened; a future phase that wants a
    stricter `style-src` would need to first move theme-variable
    application off the `style` prop (e.g., a `<style>` block with a
    nonce, or `element.style.setProperty` client-side) — out of scope
    here per D-050/D-051's own template-composition boundaries.
-   `img-src 'self' https: http: data: blob:` — matches `lib/invitations/
    url-safety.ts`'s existing `toSafeHttpUrl()` validation exactly (scheme
    only, not domain — D-041/D-042's deliberate owner-pasted-URL design).
    A domain allowlist was considered and rejected: it would break real,
    already-published invitations using external image/gift-QR URLs.
-   `connect-src 'self'` — zero raw `fetch()` calls exist in `components/`,
    and the one client-side Supabase helper (`lib/supabase/client.ts`,
    `createSupabaseBrowserClient()`) has zero callers anywhere in the
    codebase.
-   `worker-src 'self' blob:` — required, not optional. **Corrected
    during the P0 remediation pass:** this entry originally shipped
    `worker-src 'self'` on the belief that `qr-scanner` (used by
    `components/checkin/qr-code-scanner.tsx`) spawns a same-origin
    bundled worker file. It does not: on browsers without the native
    `BarcodeDetector` API (iOS Safari, Firefox, desktop Chrome on
    Windows/Linux), `qr-scanner` 1.4.x dynamically imports
    `qr-scanner-worker.min.js` (a same-origin chunk, covered by
    `script-src`), whose `createWorker()` runs
    `new Worker(URL.createObjectURL(new Blob([...])))` — a **`blob:`
    worker**, which `'self'` does not match. The original directive
    therefore blocked QR scanning on exactly those browsers (manual search
    still worked). `blob:` is the narrowest source that permits it —
    workers cannot be nonced or hashed, and a `blob:` URL can only be
    minted by script already trusted under `script-src`. The worker body
    uses no `eval`/`new Function`/WebAssembly/`importScripts`/`fetch`
    (checked in the installed package), so nothing else is needed. No
    other scheme/host is allowed; `script-src` does not gain `blob:`.
    Pinned by `lib/security/headers.test.ts`. The headless E2E suite
    cannot exercise a real camera decode, so this remains unverified in a
    real browser until manual device QA.
-   `frame-ancestors 'self'` + `X-Frame-Options: SAMEORIGIN` — closes a
    previously-open clickjacking gap; the public invitation and dashboard
    have no documented cross-origin embedding requirement.
-   `Permissions-Policy` explicitly allows `camera=(self)` (required —
    `qr-scanner`'s `getUserMedia`-based camera access for check-in
    scanning, confirmed by reading `components/checkin/qr-code-scanner.tsx`)
    and explicitly denies `microphone=()`/`geolocation=()`/`payment=()`
    (confirmed unused anywhere in the codebase by search, not assumed).
-   `Strict-Transport-Security` is sent only when the incoming request's
    own protocol was HTTPS (`request.nextUrl.protocol === "https:"` — the
    same check `proxy.ts` already used for the analytics cookie's
    `Secure` flag), never over local HTTP dev traffic. `includeSubDomains`
    and `preload` are deliberately omitted for now: `preload` requires a
    manual, largely irreversible submission to browsers' HSTS preload
    list, and subdomain topology isn't confirmed yet — both are Track B
    (external/manual) concerns for a later batch, not this one.
-   `upgrade-insecure-requests` was deliberately **not** added: it would
    force-upgrade the deliberately-allowed `http:` image URLs to `https:`
    at the browser level, which could silently break an image hosted on a
    server that doesn't support HTTPS — an unpredictable interaction with
    the `img-src` decision above, not something this batch's audit
    evidence justified.

**Nonce forces dynamic rendering — handled directly.** Next's own CSP
guide states plainly that a statically generated page has no per-request
nonce available, so its own injected hydration script would be blocked by
a nonce-based `script-src`. Every real route in this app already reads
cookies/headers/searchParams somewhere in its render tree (auth session
checks, guest tokens, analytics session cookie) except two: the root
landing stub (`app/page.tsx`, a placeholder with zero data fetching) and
the framework's default not-found fallback. Both were given
`export const dynamic = "force-dynamic"` (the latter via a new, minimal
`app/not-found.tsx`, styled to match the existing `app/invite/[slug]/
not-found.tsx`) — confirmed via `next build` output that every route is
now dynamically rendered (`ƒ`), not static (`○`).

**Rationale for not going further this batch:** the full audit (Phase 20)
identified more hardening opportunities — event/gift mutation rate
limiting, rate-limiter eviction, `AuditLog` writes — deliberately left for
a later batch to keep this one reviewable and regression-verifiable in
isolation, per the task's own explicit batching instruction.

**Impact:** New `lib/security/headers.ts` + `lib/security/headers.test.ts`
(10 new unit tests). `proxy.ts` and `app/page.tsx` modified; new
`app/not-found.tsx`. No database/schema change. Verified against the full
E2E suite (68 tests across all 15 spec files, including the QR
check-in/camera path and all 6 invitation templates) with the new headers
live — see `docs/STATUS.md`'s Phase 20 (Batch 1) entry for the full
verification record.

## D-054 --- Supabase Data API Lockdown: RLS Enabled With No Policies, Data API Roles Revoked

**Context (found by the post-Phase-20 audit, verified before fixing):**
every `public` table in the Supabase DEV database had RLS disabled, zero
policies, and the full privilege set (`arwdDxtm` — SELECT, INSERT,
UPDATE, DELETE, TRUNCATE, …) granted to `anon` and `authenticated`.
Anonymous Data API requests succeeded (e.g. `GET /rest/v1/User` → 206
with a readable row count). Anyone holding the project URL and anon key —
which Supabase treats as public by design — could read invitation tokens,
guest phone numbers and user emails, and write rows directly, bypassing
every application-level check (`getAuthorizedEvent`, token scoping,
seat-quota rules).

**Root cause:** none of the Prisma migrations ever enabled RLS (Prisma
does not manage RLS), and Supabase's default privileges for the `postgres`
role in `public` grant ALL on every newly created table to `anon`,
`authenticated` and `service_role`. Every table Prisma created therefore
inherited full Data API access. This was an omission, not a design
decision — no document ever stated the Data API should be reachable.

**Verified architecture (why deny-all is correct, not a guess):**
- No browser code queries Supabase tables. `lib/supabase/client.ts`
  (`createSupabaseBrowserClient`) has zero callers; there are no
  `.from(...)`/`.rpc(...)` table calls anywhere.
- Supabase JS is used only server-side: Auth (anon key, `lib/supabase/
  server.ts`, `proxy.ts`) and Storage (service-role key,
  `lib/storage/supabase-provider.ts`, `server-only`).
- E2E fixtures use only the Auth Admin API, never the Data API.
- Every table read/write goes through Prisma, connected as `postgres` —
  the table owner, with `BYPASSRLS` — so RLS does not apply to it.
- No table has a legitimate public-read requirement through the Data API:
  public invitation data is served by the server-rendered
  `/invite/[slug]` projection (D-014), never by direct table reads.

**Decision:** migration `20260923150000_lock_down_supabase_data_api`:
1. `ENABLE ROW LEVEL SECURITY` on all 29 model tables and
   `_prisma_migrations`, with **no policies** (deny-all for non-bypass
   roles).
2. `REVOKE ALL` on all `public` tables, sequences and functions from
   `anon`/`authenticated` (RLS alone does not cover TRUNCATE/REFERENCES/
   TRIGGER), plus `ALTER DEFAULT PRIVILEGES ... REVOKE` so future objects
   created by the migration role do not re-inherit Data API grants.
   Guarded by role existence so the migration still runs on plain
   PostgreSQL without Supabase roles.

`service_role` grants are intentionally unchanged: it is server-only,
already bypasses RLS by Supabase design, and is used for Storage. Storage
itself (`storage.objects`/`storage.buckets`) already had RLS enabled with
no policies — only the server-side service role writes; the public bucket
serves reads via public object URLs. No change there.

**Explicitly rejected:** `USING (true)` policies, per-table "owner" policies
keyed on `auth.uid()` (nothing would use them — they would only add attack
surface and a second authorization model to keep in sync with
`getAuthorizedEvent`), and revoking schema `USAGE` (unnecessary given the
table-level lockdown, and riskier for Supabase-internal tooling).

**Verification (DEV):** before the migration, `lib/db/rls.integration.
test.ts` failed 4 of 7 checks; after `prisma migrate deploy`, 7/7 pass.
Anonymous Data API GET on `User`, `GuestInvitation`, `Guest`, `Event`,
`RSVP`, `Template`, `_prisma_migrations` and anonymous POST on `RSVP` all
return 401. The full unit + integration suite (Prisma DB access and real
Storage upload/delete) passes unchanged.

**Impact / rules going forward:** every migration that creates a table
must enable RLS on it; the integration test enforces this from the live
catalog. Introducing any Data API access (a policy or a grant) requires a
new decision here. Every other environment (staging/production) receives
this lockdown automatically through `prisma migrate deploy`; production
must still be verified separately once it exists.

## D-055 --- E2E-Only Login Rate-Limit Ceiling, Honored Only When `NODE_ENV=development`

**Context:** D-030 raised the `login` bucket to 30 per 10 minutes and
recorded that the next escalation must be "a per-test-run-isolated
rate-limit store or a test-environment exemption, not another arbitrary
increase." The E2E suite now submits the login form ~42 times per run
(38 `login()` helper calls, 3 direct logins in `e2e/editor.spec.ts`, 1
invalid-credentials attempt in `e2e/auth.spec.ts`), all from one loopback
address (Next's server fills `x-forwarded-for` from the socket), so they
share one in-memory bucket. Measured during the P0 remediation pass: a
full local run took 4.3 minutes and 22 of 73 tests failed, 12 of them
with the limiter's own "Terlalu banyak percobaan" message in the page
snapshot — CI (with retries, which add further logins) would fail the
same way.

**Decision:** `lib/auth/rate-limit.ts` exposes `resolveAuthRateLimit()`,
which replaces only the `login` bucket's numeric ceiling with
`E2E_AUTH_LOGIN_RATE_LIMIT` when set to a positive integer, and **honors it
only when `NODE_ENV === "development"`** — the value `next dev` sets,
which is what Playwright launches. The guard is fail-closed: every other
value (`production`, `test`, `staging`, a miscased or non-standard value,
or unset) ignores the override. This matters because Next's CLI keeps a
pre-set non-standard `NODE_ENV` rather than forcing `production`, so a
"not production" check would fail open. `playwright.config.ts` sets the
variable (500) only on the dev server Playwright launches. The limiter
still runs during E2E; `register`/`password-reset` limits are unaffected.

**Rejected:** another arbitrary increase of the production limit (D-030
explicitly ruled that out); spoofing a per-worker `x-forwarded-for` from
Playwright (implicit, and entrenches the client-IP trust weakness the
planned durable rate limiter must fix).

**Impact:** pinned by `lib/auth/rate-limit.test.ts`, including the
fail-closed guard (undefined, `test`, `staging`, `production`,
`Production` all ignore the override). If a developer runs E2E against an already-running dev
server (`reuseExistingServer` outside CI), that server needs the variable
itself.

## D-056 --- Global `testTimeout`/`hookTimeout` (15000ms) Instead of Per-File Overrides, After CI (Not Local) Timeouts in `lib/checkin/service.integration.test.ts`

**Context:** after D-054's Data API lockdown migration was applied to the
shared Supabase DEV database, two consecutive CI runs failed identically:
"Unit and integration tests" ran for ~10 minutes then failed with 10 tests
in `lib/checkin/service.integration.test.ts` each reporting `Error: Test
timed out in 5000ms` (vitest's default `testTimeout`). The intervening fix
attempt (bumping explicit per-test timeouts to `15000` in
`lib/analytics/service.integration.test.ts`) targeted the wrong file — a
misdiagnosis, since the actual failing tests were in the check-in file —
and the next CI run failed the same way.

**Diagnosis:** running `lib/checkin/service.integration.test.ts` alone,
and the full 779-test suite, both passed cleanly and quickly (79s) on a
12-core local machine — proving the RLS lockdown did not break check-in's
authorization or transactional logic. GitHub's hosted `ubuntu-latest`
runner has far fewer cores, so vitest's file-level parallelism serializes
more of the ~10 real-database integration test files there than locally;
combined with the small additional per-query overhead RLS-enabled tables
now carry (checked even for a bypass role) and ordinary Supabase DEV
network variance, this occasionally pushes the check-in file's
transaction-heavy tests past the 5000ms default. This is the same class
of flakiness already documented for Phase 3/15 work — not new, but not
previously severe enough to trip the default.

**Decision:** raise `testTimeout` and `hookTimeout` to `15000` globally in
`vitest.config.ts`, rather than patching individual files as they happen
to be the one that tips over first. All 10 integration test files hit the
same real database under the same CI conditions, so any of them — not
just check-in — could be next. The now-redundant explicit `, 15000`
arguments added to `lib/analytics/service.integration.test.ts` by the
prior (mistargeted) fix were removed, since they no longer differ from
the new global default.

**Rejected:** patching only `lib/checkin/service.integration.test.ts`
(treats the symptom in whichever file failed most recently, not the
shared root cause every integration-test file is equally exposed to).

**Impact:** `vitest.config.ts`, `lib/analytics/service.integration.test.ts`
(revert of the mistargeted per-test overrides). No production code
changed. Verified: the previously-failing check-in tests and the full
779-test suite both pass locally under the new config; typecheck, lint,
and `prisma validate` all pass. CI-specific contention cannot be fully
reproduced locally (fewer cores, different network path to Supabase), so
this fix's real test is the next CI run, not this local verification.

## D-057 --- Global Timeout Raised Again (15000 → 30000ms); Separate, Unrelated Flaky-Test Root Cause Found and Fixed in `lib/editor/actions.test.ts`

**Context:** D-056's 15000ms global timeout was not enough. The next CI
run still failed at "Unit and integration tests" (~13 min), this time with
9 failures spread across three different files instead of one:
`lib/rsvp/service.integration.test.ts` (1), `lib/checkin/
service.integration.test.ts` (2), and `lib/editor/
service.integration.test.ts` (6) — all `Error: Test timed out in 15000ms`
— plus one unrelated, non-timeout failure in `lib/editor/actions.test.ts`
(`AssertionError: expected false to be true`).

**Timeout investigation:** a local experiment temporarily raised
`connection_limit` on `DATABASE_URL` from 1 to 10 (Supabase's
serverless/PgBouncer convention — `.env.local` carries `connection_limit=1
&pgbouncer=true`, undocumented anywhere until now) and re-ran the full
suite: 85.98s vs the usual ~80s — no meaningful difference. This weakens
(does not fully rule out, since CI's network latency to Supabase is far
higher than local and could make the same serialization costlier) the
connection-limit theory as the dominant factor. The more consistent
explanation: `lib/editor/service.integration.test.ts` is the largest
integration file (789 lines/45 tests) and several of its failing tests
perform **real, sequential Supabase Storage uploads** (e.g. "two uploads
for two different events never collide on object path" — two full
uploads in one test), which are more network-latency-sensitive than a
plain Postgres round-trip. Under CI's higher latency to Supabase, the
heaviest files are the ones most likely to cross any fixed timeout.

**Decision (timeout):** raise `testTimeout`/`hookTimeout` from 15000 to
30000ms, globally, same rationale as D-056 (any integration test file can
be next; a single global lever stays reviewable). Not switched to a
per-file or per-test-type (e.g. "Storage-touching tests get more time")
scheme — that reintroduces the whack-a-mole pattern D-056 explicitly
rejected, for a difference (network latency vs. plain query latency) this
project has no reliable way to measure per-test in advance.

**Separate finding — `lib/editor/actions.test.ts`'s failure is unrelated
to any of this.** It is a pure mock-based unit test (`uploadGalleryImage`
is mocked; no real Supabase/database call). Root cause, found by reading
`uploadGalleryImageAction` (`lib/editor/actions.ts:224-235`): it always
calls `await file.arrayBuffer()` on the real `File` object before handing
the result to `validateGalleryImageUpload` — mocking that function does
not skip this call. The test file's own jsdom polyfill for the missing
`File.prototype.arrayBuffer` implemented it as `new
Response(this).arrayBuffer()`, routing through Node's `undici`
fetch/Response stack. That path intermittently failed under a full CI
run's heavier concurrent load (never observed locally in dozens of runs),
which the `try/catch` in `uploadGalleryImageAction` then turned into a
false `{ ok: false }` instead of the expected success — the same failure
signature reported.

**Decision (flaky test):** replace the polyfill with a `FileReader`-based
implementation, a jsdom-native API that never touches the fetch/undici
stack:

```ts
File.prototype.arrayBuffer = function arrayBuffer(this: Blob) {
  return new Promise<ArrayBuffer>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as ArrayBuffer);
    reader.onerror = () => reject(reader.error ?? new Error("FileReader failed"));
    reader.readAsArrayBuffer(this);
  });
};
```

This is the only file in the repository with this polyfill pattern
(confirmed by search), so no other test file needed the same fix.

**Rejected:** stubbing `file.arrayBuffer` per-test-instance instead of
fixing the shared polyfill (would leave the same fragile Response-based
path in place for any future test added to this file that also exercises
`uploadGalleryImageAction`); disabling/skipping the flaky test (hides a
real, now-understood, now-fixed bug instead of fixing it).

**Impact:** `vitest.config.ts` (timeout), `lib/editor/actions.test.ts`
(polyfill swap). No production code changed for either fix. Verified: full
779-test suite passes locally; `lib/editor/actions.test.ts` run 3
consecutive times individually, 16/16 each time; typecheck, lint, and
`prisma validate` all pass. As with D-056, the timeout fix's real test is
the next CI run — local verification cannot reproduce CI's network/
resource conditions.
