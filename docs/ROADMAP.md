# Development Roadmap

## Digital Invitation SaaS

**Version:** 1.0  
**Strategy:** Incremental Agentic Development

---

# 1. Roadmap Philosophy

The product will be built incrementally.

Do not attempt to implement every feature simultaneously.

Each phase must leave the application:

- runnable
- testable
- deployable
- internally consistent

A phase is not complete merely because the UI exists.

---

# 2. Priority Levels

```text
P0 = Critical MVP
P1 = Important
P2 = Monetization / advanced product
P3 = Future
```

---

# 3. Phase 0 — Repository & Foundation

Priority:

P0

## Goals

Establish a clean development foundation.

## Infrastructure Baseline

The canonical infrastructure for the project is:

```text
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

Supporting services:

```text
Supabase Storage
Supabase Auth (when used)
External payment/email/maps/WhatsApp providers
```

Standard development must not require:

```text
Local PostgreSQL
Docker
```

The agent must configure the repository so a developer can work with the hosted Supabase database using environment variables.

## Tasks

- Inspect repository
- Inspect package.json
- Inspect existing source
- Inspect existing database
- Setup TypeScript
- Setup Tailwind
- Setup shadcn/ui
- Setup Prisma
- Connect Prisma to Supabase-hosted PostgreSQL
- Configure Supabase project/environment variables
- Configure Supabase Storage integration boundary
- Configure Supabase Auth integration boundary when authentication is implemented
- Setup environment configuration
- Setup ESLint
- Setup Prettier
- Setup Vitest
- Setup Playwright
- Create base layout
- Create design tokens
- Create `.env.example`

## Acceptance Criteria

- Application starts
- Application connects to the configured Supabase PostgreSQL database
- Prisma works against the Supabase database
- TypeScript works
- Lint works
- Tests work
- Build works

---

# 4. Phase 1 — Authentication

Priority:

P0

## Tasks

- Register
- Login
- Logout
- Session
- Protected routes
- User model
- Password hashing
- Password reset architecture
- Email verification architecture

## Acceptance Criteria

A user can:

Register
→ Login
→ Access Dashboard
→ Logout

Unauthenticated users cannot access protected dashboard routes.

---

# 5. Phase 2 — Event Management

Priority:

P0

## Tasks

- Event model
- Create event
- Edit event
- Delete event
- Event list
- Event dashboard
- Event status
- Event type
- Publish state

## Acceptance Criteria

User can create:

```text
Wedding
Raka & Nadia
12 December 2026
```

and see the event in their dashboard.

---

# 6. Phase 3 — Template System

Priority:

P0

## Tasks

- Template model
- Template gallery
- Template selection
- Template renderer
- Template configuration
- Seed six templates

Templates:

1. Minimal Elegant
2. Modern Editorial
3. Floral Romance
4. Dark Luxury
5. Traditional Nusantara
6. Soft Romantic

## Acceptance Criteria

User can:

Create event
→ Browse templates
→ Select template
→ Preview template

---

# 7. Phase 4 — Invitation Data

Priority:

P0

## Tasks

- WeddingProfile
- EventSchedule
- Venue
- LoveStory
- Gallery
- Theme
- Section configuration

## Acceptance Criteria

User can enter all core invitation information.

---

# 8. Phase 5 — Invitation Editor

Priority:

P0

## Tasks

Create:

```text
EditorShell
├── SectionSidebar
├── PreviewPanel
└── PropertiesPanel
```

Implement:

- section selection
- section enable/disable
- section ordering
- content editing
- theme editing
- live preview
- autosave
- save status

## Acceptance Criteria

User can modify invitation content and immediately see the preview change.

Reloading the page must preserve saved changes.

---

# 9. Phase 6 — Public Invitation

Priority:

P0

## Tasks

- Public route
- Event slug
- Invitation renderer
- Responsive invitation
- Opening screen
- Countdown
- Schedule
- Couple
- Story
- Gallery
- Location
- Closing
- SEO metadata
- OG metadata

## Acceptance Criteria

A published event can be opened through:

```text
/invite/[slug]
```

without authentication.

The page works correctly on mobile.

---

# 10. Phase 7 — Guest Management

Priority:

P0

## Tasks

- Guest CRUD
- Guest categories
- Search
- Filter
- Sort
- Seat quota
- GuestInvitation
- Secure tokens
- CSV import
- CSV export

## Acceptance Criteria

Owner can add 100+ guests.

Owner can search and filter guests.

Owner can import guests through CSV.

Each guest receives a unique invitation token.

---

# 11. Phase 8 — Guest Personalization

Priority:

P0

## Tasks

- Personalized URL
- Guest greeting
- Token validation
- Guest-specific invitation rendering
- Invitation open tracking

## Acceptance Criteria

Opening:

```text
/invite/raka-nadia?to=TOKEN
```

shows the correct guest name.

Invalid tokens must not reveal guest information.

---

# 12. Phase 9 — RSVP

Priority:

P0

## Tasks

- RSVP model
- RSVP form
- Attendance states
- Seat quota
- RSVP dashboard
- RSVP statistics

## Acceptance Criteria

Guest can:

- Attend
- Not attend
- Maybe

Attendee count cannot exceed seat quota.

Owner can see RSVP results.

---

# 13. Phase 10 — Wishes

Priority:

P1

## Tasks

- Wish model
- Submit wish
- Moderation
- Approve
- Hide
- Delete
- Public display

## Acceptance Criteria

Only approved wishes are visible publicly.

Spam/rate limiting exists.

---

# 14. Phase 11 — Gallery

Priority:

P1

## Tasks

- Image upload
- Storage abstraction
- Gallery management
- Reorder
- Delete
- Lightbox
- Responsive images

## Acceptance Criteria

Owner can upload gallery images.

Public invitation loads optimized images.

---

# 15. Phase 12 — WhatsApp Sharing

Priority:

P1

## Tasks

- Personalized message generator
- Copy message
- WhatsApp deep link
- Guest-specific URL

## Acceptance Criteria

Owner can generate a personalized WhatsApp invitation for any guest.

---

# 16. Phase 13 — QR Invitation

Priority:

P1

## Tasks

- QR generation
- Guest QR
- Secure token
- QR display
- QR download

## Acceptance Criteria

Every guest invitation can generate a QR code.

---

# 17. Phase 14 — Event Check-in

Priority:

P1

## Tasks

- QR scanner
- Manual search
- Check-in
- Duplicate prevention
- Check-in dashboard
- Reception mode

## Acceptance Criteria

Staff can:

Scan guest QR
→ View guest
→ Check in

Second check-in attempt must be rejected safely.

---

# 18. Phase 15 — Analytics

Priority:

P1

## Tasks

- Invitation view tracking
- Unique sessions
- Guest opens
- RSVP metrics
- Check-in metrics
- Dashboard charts

## Acceptance Criteria

Owner can see:

- Total views
- Unique views
- RSVP
- Attendance
- Check-ins

---

# 19. Phase 16 — Digital Gift

Priority:

P2

## Tasks

- Gift methods
- Bank transfer
- E-wallet
- QR payment
- Copy account number
- Gift display

## Acceptance Criteria

Owner can configure gift information.

Guest can view and copy it.

No fake payment confirmation.

---

# 20. Phase 17 — Gift Registry

Priority:

P2

## Tasks

- Registry
- Gift items
- Inventory
- Reservation
- Cancel reservation
- Purchased state

## Acceptance Criteria

Guests cannot reserve more items than available quantity.

---

# 21. Phase 18 — Subscription

Priority:

P2

## Tasks

- Plan model
- Subscription model
- Payment model
- Checkout abstraction
- Webhook abstraction
- Feature limits
- Premium access

## Acceptance Criteria

Plan limits are enforced server-side.

Payment state comes from verified provider events.

---

# 22. Phase 19 — Admin

Priority:

P2

## Tasks

- Admin authentication
- User management
- Event management
- Template management
- Plan management
- Payment management
- Moderation

## Acceptance Criteria

Admin can manage platform resources without exposing user secrets.

---

# 23. Phase 20 — Production Hardening

Priority:

P1

This phase should happen before production launch even if advanced features are incomplete.

## Tasks

- Security review
- Authorization review
- Rate limiting
- Upload security
- Error handling
- Logging
- Monitoring
- Performance optimization
- SEO
- Accessibility
- Mobile QA
- Verify Vercel production deployment
- Verify Supabase database connectivity in production
- Verify Supabase Storage access and upload security
- Verify production environment variables
- Verify Prisma migration state
- Verify serverless database connection behavior

---

# 24. Phase 21 — AI

Priority:

P3

Only after the core product is stable.

Features:

- Invitation copy generator
- Love story rewriting
- WhatsApp message generation
- AI event assistant

AI must never silently overwrite user content.

---

# 25. Phase 22 — Future Product Expansion

Priority:

P3

Potential:

- Custom domains
- Team collaboration
- Seating management
- Table assignment
- Wedding budget
- Vendor marketplace
- Event planner
- Native mobile app

---

# 26. Agent Execution Rules

Claude Code should execute roadmap phases sequentially.

Before starting a phase:

1. Read `PRD.md`
2. Read `ARCHITECTURE.md`
3. Read `DATABASE.md`
4. Read this roadmap
5. Inspect current repository
6. Identify completed work
7. Identify missing dependencies

Do not repeat completed work unnecessarily.

---

# 27. Phase Completion Rules

A phase is complete only when:

```text
[ ] Feature implemented
[ ] Database implemented
[ ] Server logic implemented
[ ] UI implemented
[ ] Authorization implemented
[ ] Validation implemented
[ ] Loading states
[ ] Error states
[ ] Empty states
[ ] Mobile checked
[ ] Tests written
[ ] Tests passing
[ ] Typecheck passing
[ ] Lint passing
[ ] Build passing
```

---

# 28. Task Decomposition

Claude should break each phase into small tasks.

Example:

```text
Phase 7 — Guest Management

7.1 Guest schema
7.2 Guest repository
7.3 Authorization
7.4 Create guest action
7.5 Update guest action
7.6 Delete guest action
7.7 Guest table
7.8 Search
7.9 Filters
7.10 CSV parser
7.11 CSV preview
7.12 CSV import
7.13 CSV export
7.14 Tests
7.15 Mobile QA
```

Do not attempt a massive implementation without checkpoints.

---

# 29. Dependency Rules

Example:

```text
Authentication
      ↓
Events
      ↓
Templates
      ↓
Invitation Editor
      ↓
Public Invitation
      ↓
Guests
      ↓
Personalization
      ↓
RSVP
      ↓
Analytics
```

Do not implement features before their required dependencies exist.

---

# 30. Regression Rules

When modifying existing functionality:

1. Identify affected features.
2. Run related tests.
3. Implement change.
4. Run tests again.
5. Run typecheck.
6. Run lint.
7. Run build when appropriate.

Do not break existing P0 features to implement P1/P2 features.

---

# 31. Definition of MVP

MVP is complete when:

Authentication works.

Event creation works.

Template selection works.

Invitation editor works.

Public invitation works.

Guest management works.

Guest personalization works.

RSVP works.

Gallery works.

Wishes work.

Location works.

WhatsApp sharing works.

Dashboard works.

Mobile experience works.

SEO metadata works.

Security checks pass.

Tests pass.

Build passes.

---

# 32. Launch Gate

Do NOT declare the product production-ready until:

- P0 complete
- Critical P1 complete
- Security review complete
- Mobile QA complete
- E2E happy path passes
- No critical console errors
- No known authorization bypass
- Database migrations work
- Environment variables documented
- Production build succeeds

---

# 33. Final Agent Instruction

The roadmap is not a checklist to blindly tick.

Use engineering judgment.

If an architectural dependency requires a different order, adjust the implementation order while preserving the product priorities.

Always prioritize:

1. Correctness
2. Security
3. Reliability
4. User experience
5. Performance
6. Visual polish
7. Advanced features

The final goal is a genuinely usable digital invitation SaaS, not a collection of unfinished demos.