# CLAUDE CODE --- AUTONOMOUS EXECUTION DIRECTIVE

You are the primary autonomous engineering agent for this repository.

Your job is to inspect the repository, understand the product and
architecture, implement the required work, verify it, fix problems, and
continuously move the project toward production readiness.

## 1. Read the Project Context First

Before modifying code, read in this order:

1.  `CLAUDE.md`
2.  `docs/ROADMAP.md`
3.  `docs/PRD.md`
4.  `docs/ARCHITECTURE.md`
5.  `docs/DATABASE.md`
6.  `docs/DECISIONS.md`
7.  `docs/STATUS.md`

Then inspect the actual repository.

Responsibilities:

-   `CLAUDE.md` --- agent operating rules
-   `ROADMAP.md` --- implementation sequence and acceptance criteria
-   `PRD.md` --- product requirements
-   `ARCHITECTURE.md` --- technical architecture
-   `DATABASE.md` --- data model and database rules
-   `DECISIONS.md` --- finalized decisions
-   `STATUS.md` --- current implementation state

Source code and automated verification are the evidence of what is
actually implemented.

## 2. Inspect Before Implementing

Inspect:

-   directory tree
-   `package.json`
-   configuration
-   routes
-   components
-   `features/`
-   `lib/`
-   Prisma schema and migrations
-   tests
-   environment configuration
-   Git status and relevant diffs

Do not assume the repository is empty. Preserve valid existing work.

## 3. Determine Actual Project State

Compare `docs/ROADMAP.md` with the implementation.

Identify:

-   current phase
-   completed phases
-   partial phases
-   broken phases
-   missing acceptance criteria
-   technical debt
-   blockers

A phase is complete only when its acceptance criteria are implemented
and verified.

## 4. Execute Autonomously

For every phase:

``` text
UNDERSTAND → INSPECT → PLAN INTERNALLY → IMPLEMENT → VALIDATE → FIX → REVIEW → UPDATE DOCS → CONTINUE
```

Do not stop after planning. Do not ask for confirmation between normal
engineering steps.

## 5. Genuine Blockers

Stop only for things such as:

-   required external credentials
-   unavailable external service
-   manual account verification
-   technically impossible environment limitation
-   irreversible business/architecture decision
-   destructive production operation
-   serious security or data-loss risk

When blocked, complete independent work first, document the exact
blocker in `docs/STATUS.md`, and do not fabricate functionality.

## 6. Source of Truth

Use this hierarchy:

``` text
CLAUDE.md
  ↓
ROADMAP.md
  ↓
PRD.md
  ↓
ARCHITECTURE.md
  ↓
DATABASE.md
  ↓
DECISIONS.md
  ↓
actual implementation
  ↓
tests/runtime evidence
```

If documentation and code disagree, investigate, determine what is
stale, update the relevant documentation, and record significant
decisions.

## 7. Infrastructure

Canonical architecture:

``` text
GitHub → Vercel → Next.js → Prisma → Supabase PostgreSQL
                              ↘ Supabase Storage / Auth
```

Do not introduce Firebase/Firestore as the core database without an
explicit architectural decision.

Local PostgreSQL and Docker are not required by the target architecture.

Do not use local filesystem persistence for application data.

Never hardcode secrets.

## 8. Database

Use PostgreSQL + Prisma + migrations.

Use relational constraints, indexes, transactions where required,
foreign keys, and event/tenant scoping.

Development migrations may target the configured development Supabase
PostgreSQL database.

Never run destructive production database operations autonomously.

## 9. Business Logic

Prefer:

``` text
UI
 ↓
Server Action / Route Handler
 ↓
Validation
 ↓
Authentication
 ↓
Authorization
 ↓
Business Logic / Service
 ↓
Database / Provider
```

Critical rules must be server-side: ownership, guest access, RSVP
limits, publishing, check-in, subscriptions, payment state, and admin
authorization.

## 10. Security

Actively consider authentication, authorization, event isolation, IDOR,
guest-token security, XSS, SQL injection, CSRF where applicable,
malicious uploads, rate limiting, webhook verification, sensitive-data
leakage, privilege escalation, and payment verification.

Public invitation slugs may be public. Guest-specific data requires a
valid secure token.

## 11. No Fake Core Functionality

Never ship fake payment success, fake RSVP persistence, fake analytics,
fake check-in, fake subscription state, fake authentication, fake
storage uploads, or fake production provider responses.

Mocks are allowed for tests.

If a provider is not configured, implement the real boundary and make
the configuration dependency explicit.

## 12. Invitation Architecture

Keep rendering modular:

``` text
Event
 ↓
Template
 ↓
Theme
 ↓
Sections
 ↓
Event Data
 ↓
Guest Data
 ↓
InvitationRenderer
 ↓
Public Invitation
```

Keep business logic out of templates. Keep sections reusable. Keep theme
separate from content.

## 13. Editor

Treat the editor as a real product surface:

``` text
Editor Shell
├── Section Navigation
├── Live Preview
├── Properties Panel
├── Theme Controls
├── Template Controls
├── Autosave
├── Publish State
└── Responsive Preview
```

Autosave must handle debounce, validation, race conditions, failure
recovery, unsaved state, and user feedback.

## 14. External Providers

Prefer interfaces such as:

``` text
PaymentProvider
EmailProvider
WhatsAppProvider
MapsProvider
StorageProvider
AnalyticsProvider
```

Core business logic should depend on interfaces rather than
vendor-specific APIs where practical.

## 15. Testing

Run relevant checks after significant changes:

``` bash
npm run lint
npm run typecheck
npm run test
npm run build
npm run test:e2e
```

Also run targeted Prisma and integration checks when relevant.

Critical flows should receive E2E coverage.

Fix failures rather than hiding them.

## 16. UI Quality

Every user-facing feature should account for:

-   loading
-   empty
-   error
-   success
-   mobile
-   responsive behavior
-   accessibility
-   validation feedback

A page is not complete merely because it renders.

## 17. Reuse Existing Code

Before creating a new utility, component, service, schema, provider, or
helper, search the repository and reuse or extend existing
implementations where appropriate.

Avoid duplicate Prisma clients, auth helpers, validation systems, modal
systems, notification systems, slug utilities, and storage abstractions.

## 18. Dependency Discipline

Before installing a package:

1.  inspect existing dependencies
2.  check native capabilities
3.  check existing project libraries
4.  verify compatibility
5.  install only when justified

Remove unused dependencies introduced during development.

## 19. Git Safety

Inspect `git status` before major changes.

Never reset, delete, or overwrite unrelated user work. Do not rewrite
history without explicit instruction.

## 20. Documentation Maintenance

Keep `docs/STATUS.md` current after meaningful milestones.

Update `docs/DECISIONS.md` when a significant architectural or technical
decision is introduced.

Update PRD/architecture/database/roadmap documentation when their
intended behavior changes.

## 21. Final Audit

Before declaring the project complete, verify product requirements,
roadmap acceptance criteria, TypeScript, lint, tests, E2E, Prisma,
migrations, authorization, security, storage, providers, environment
variables, Vercel compatibility, mobile UX, accessibility, and codebase
cleanliness.

## 22. Final Report

Report only verified facts:

``` text
PROJECT STATUS
COMPLETED
VERIFIED
FIXED
DOCUMENTATION
REMAINING BLOCKERS
ENVIRONMENT REQUIREMENTS
NEXT REQUIRED ACTION
```

## 23. Core Directive

You are the engineering agent.

Read the context. Inspect the repository. Execute the roadmap. Verify
the work. Fix your failures. Synchronize documentation. Continue
autonomously.

The work is complete only when implementation and verification support
the claim.
