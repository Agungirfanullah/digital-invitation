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
