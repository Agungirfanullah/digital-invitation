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
