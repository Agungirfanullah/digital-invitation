# System Architecture

## Digital Invitation SaaS

**Version:** 1.0

---

# 1. Architecture Goals

The architecture must support:

- Multi-tenant SaaS
- Multiple events per user
- Multiple templates
- Personalized invitations
- Guest management
- RSVP
- Analytics
- Check-in
- Subscription
- Admin
- Future AI functionality

The system must remain modular and avoid excessive coupling.

---

# 2. Technology Stack

Unless the existing repository already provides an equivalent production-ready stack:

### Frontend

- Next.js
- TypeScript
- React
- App Router
- Tailwind CSS
- shadcn/ui

### Backend

Next.js server-side architecture.

Use:

- Server Components
- Server Actions
- Route Handlers

where appropriate.

Do not create APIs unnecessarily when Server Actions are more suitable.

### Hosting / Deployment

- Vercel
- Next.js deployed as the primary application

### Database / Backend Platform

- Supabase
- PostgreSQL hosted by Supabase
- Supabase Storage for object/file storage
- Supabase Auth may be used for authentication/session infrastructure where appropriate

### ORM

Prisma

### Validation

Zod

### Authentication

Supabase Auth or another production-ready auth layer compatible with the architecture.

When Supabase Auth is used, keep application authorization and event-level access control in the server-side application layer.

### Testing

- Vitest
- React Testing Library
- Playwright

---

# 3. High-Level Architecture

```text
                    ┌────────────────────┐
                    │    Marketing Web   │
                    └─────────┬──────────┘
                              │
                              ▼
                    ┌────────────────────┐
                    │    Next.js App     │
                    │                    │
                    │ Server Components  │
                    │ Server Actions     │
                    │ Route Handlers     │
                    └─────────┬──────────┘
                              │
          ┌───────────────────┼───────────────────┐
          ▼                   ▼                   ▼
   ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
   │ PostgreSQL  │     │ Object      │     │ External    │
   │             │     │ Storage     │     │ Services    │
   │ Prisma      │     │             │     │             │
   └─────────────┘     └─────────────┘     │ Maps        │
                                            │ Payment     │
                                            │ Email       │
                                            │ Analytics   │
                                            └─────────────┘
```

---

# 4. Deployment & Infrastructure

The production deployment target is:

```text
GitHub
   ↓
Vercel
   ↓
Next.js application
   ↓
Supabase
├── PostgreSQL
├── Storage
└── Auth (when selected)
```

## 4.1 Vercel

Vercel is the primary hosting and deployment platform for the Next.js application.

Use it for:

- production deployments
- preview deployments
- environment variable configuration
- application hosting
- server-side Next.js execution

The application must remain compatible with Vercel's serverless/server-side execution model.

Do not depend on:

- a permanently running local server process
- local filesystem persistence
- local-only background processes
- infrastructure that requires a long-lived mutable server unless explicitly introduced later

## 4.2 Supabase

Supabase is the primary managed backend platform.

Use:

- Supabase PostgreSQL as the source of truth for relational application data
- Supabase Storage for uploaded images and other managed media
- Supabase Auth when selected as the authentication provider

The application should access PostgreSQL through Prisma for application data operations.

Do not replace PostgreSQL/Prisma with Firestore or another document database.

## 4.3 Local Development

Local PostgreSQL and Docker are **not required** for the standard development workflow.

The expected local requirements are:

```text
Node.js
npm / pnpm
Git
Claude Code / code editor
```

The development database is hosted remotely in Supabase.

Environment variables must provide the appropriate Supabase/PostgreSQL connection details.

Never commit real Supabase credentials or production secrets.

## 4.4 Database Connection Strategy

Because the application is deployed on Vercel, database connections must be configured with Supabase's supported connection approach for serverless workloads.

Use the appropriate Supabase connection/pooling configuration for the deployment environment.

Prisma must not create uncontrolled connection growth from serverless invocations.

## 4.5 Portability

The application should avoid unnecessary vendor lock-in.

Business logic must depend on:

```text
Prisma
PostgreSQL
provider interfaces
```

rather than Supabase-specific APIs wherever a neutral abstraction is practical.

Supabase-specific integrations are acceptable for:

- Auth
- Storage
- managed database capabilities

but must remain isolated behind clear integration boundaries where appropriate.

---

# 4. Application Layers

## Presentation Layer

Responsible for:

- UI
- forms
- loading states
- responsive behavior
- client interactions

Location:

`components/`

---

## Application Layer

Responsible for:

- business workflows
- authorization checks
- orchestration

Location:

`lib/`

---

## Data Layer

Responsible for:

- database access
- queries
- transactions
- repositories

Location:

`lib/db/`

---

## Integration Layer

Responsible for external providers.

Examples:

`lib/storage/`

`lib/payments/`

`lib/maps/`

`lib/email/`

`lib/analytics/`

---

# 5. Recommended Directory Structure

```text
app/
├── (marketing)/
│   ├── page.tsx
│   ├── pricing/
│   ├── templates/
│   └── features/
│
├── (auth)/
│   ├── login/
│   ├── register/
│   ├── forgot-password/
│   └── reset-password/
│
├── dashboard/
│   ├── page.tsx
│   ├── events/
│   │   └── [eventId]/
│   │       ├── page.tsx
│   │       ├── guests/
│   │       ├── rsvp/
│   │       ├── wishes/
│   │       ├── gallery/
│   │       ├── analytics/
│   │       ├── check-in/
│   │       └── settings/
│
├── editor/
│   └── [eventId]/
│
├── invite/
│   └── [slug]/
│
├── admin/
│   ├── page.tsx
│   ├── users/
│   ├── events/
│   ├── templates/
│   ├── plans/
│   └── payments/
│
└── api/
    └── ...
```

---

# 6. Component Structure

```text
components/
├── ui/
├── marketing/
├── auth/
├── dashboard/
├── editor/
├── invitation/
├── guests/
├── rsvp/
├── gallery/
├── check-in/
├── analytics/
└── admin/
```

---

# 7. Invitation Architecture

The invitation is composed from reusable sections.

```text
Public Invitation
        │
        ▼
InvitationRenderer
        │
        ├── Template
        ├── Theme
        ├── Event
        ├── Guest
        └── Section Configuration
                │
                ▼
        ┌─────────────────────┐
        │ Invitation Sections │
        ├─────────────────────┤
        │ Cover               │
        │ Greeting            │
        │ Couple              │
        │ Quote               │
        │ Countdown           │
        │ Schedule            │
        │ Story               │
        │ Gallery             │
        │ Location            │
        │ RSVP                │
        │ Gift                │
        │ Wishes              │
        │ Closing             │
        └─────────────────────┘
```

---

# 8. Template Contract

Templates should implement a consistent interface.

Conceptually:

```ts
interface InvitationTemplate {
  id: string
  name: string
  category: string
  sections: InvitationSection[]
  render: InvitationRenderer
}
```

Actual implementation may differ.

The important requirement is:

Templates must consume shared event data.

Templates must not own business logic.

---

# 9. Business Logic Boundary

Business logic must not live inside presentation components.

Bad:

```tsx
<Button onClick={() => prisma.guest.delete(...)}>
```

Good:

```text
UI
 ↓
Server Action
 ↓
Authorization
 ↓
Business Logic
 ↓
Database
```

---

# 10. Server Actions

Use Server Actions for mutations where appropriate.

Examples:

- createEvent
- updateEvent
- publishEvent
- createGuest
- updateGuest
- deleteGuest
- submitRSVP
- createWish
- approveWish
- checkInGuest

Every mutation must perform authorization.

---

# 11. Authorization Model

Every protected operation must verify:

1. Authenticated user
2. Event ownership or membership
3. Required permission
4. Resource ownership

Never rely on UI restrictions.

---

# 12. Roles

```text
ADMIN
USER
TEAM_MEMBER
```

Potential permissions:

```text
EVENT_READ
EVENT_WRITE
EVENT_DELETE
GUEST_READ
GUEST_WRITE
RSVP_READ
WISH_MODERATE
ANALYTICS_READ
CHECKIN_WRITE
BILLING_READ
```

---

# 13. Multi-Tenancy

Each Event belongs to an owner.

All event-related data must be scoped through:

`eventId`

Authorization must always establish that the current user has access to that event.

---

# 14. Public Invitation Security

Public invitations are intentionally public.

However:

Guest-specific information must only be exposed when the guest token is valid.

Do not expose:

- guest phone numbers
- internal IDs
- private analytics
- administrative metadata

Guest tokens must be:

- random
- unguessable
- revocable

---

# 15. Data Fetching

Prefer:

Server Components
→ direct database reads

for authenticated dashboard pages where appropriate.

Avoid unnecessary client-side fetching.

Use client components only when interactivity requires them.

---

# 16. Editor Architecture

Editor consists of:

```text
EditorShell
├── SectionSidebar
├── PreviewPanel
└── PropertiesPanel
```

The editor must maintain a clear state model.

Content state should be persisted to the database.

Autosave must be debounced.

Do not save every keystroke as an independent database transaction.

---

# 17. Editor State

Conceptually:

```ts
{
  event: Event
  theme: Theme
  sections: SectionConfig[]
  selectedSection: string | null
  saveStatus: "idle" | "saving" | "saved" | "error"
}
```

---

# 18. Autosave

Autosave requirements:

- Debounce updates
- Prevent race conditions
- Display status
- Retry failures where safe
- Never silently lose user changes

If conflict resolution is required later, architecture should allow versioning.

---

# 19. Guest Token Architecture

Do not use:

```text
guestId=123
```

Use:

```text
token=random_secure_value
```

Token should resolve to:

```text
GuestInvitation
→ Guest
→ Event
```

---

# 20. Invitation URL

Canonical public URL:

```text
/invite/[slug]
```

Personalized:

```text
/invite/[slug]?to=[token]
```

The slug identifies the event.

The token identifies the invitation recipient.

---

# 21. Image Architecture

Uploaded images should go to object storage.

Flow:

```text
Browser
 ↓
Upload endpoint / signed upload
 ↓
Object Storage
 ↓
Store metadata in PostgreSQL
```

Database should store metadata, not binary image contents.

---

# 22. Image Optimization

Images should support:

- WebP
- AVIF where practical
- responsive sizes
- thumbnails
- lazy loading

Never load original high-resolution images unnecessarily.

---

# 23. External Services

Use provider abstractions.

Example:

```text
lib/
├── payments/
│   ├── provider.ts
│   └── ...
├── storage/
├── email/
├── maps/
└── analytics/
```

Business logic should depend on interfaces rather than provider-specific implementations.

---

# 24. Payment Architecture

Payment provider must be replaceable.

Conceptually:

```ts
interface PaymentProvider {
  createCheckout(...)
  verifyPayment(...)
  handleWebhook(...)
}
```

Never trust client-side payment status.

Webhook signatures must be verified.

---

# 25. Analytics Architecture

Track invitation events through an internal abstraction.

Example:

```text
trackInvitationView()
trackRSVP()
trackWish()
trackCheckIn()
```

Do not scatter provider-specific analytics code throughout components.

---

# 26. Error Handling

Use:

- typed application errors
- friendly UI messages
- logging
- structured server errors

Never expose:

- stack traces
- SQL queries
- secrets
- internal infrastructure details

---

# 27. Logging

Logs should contain useful operational information.

Do not log:

- passwords
- tokens
- payment secrets
- unnecessary personal data

---

# 28. Rate Limiting

Rate-limit:

- Login
- Register
- RSVP
- Wishes
- Public invitation interactions
- Guest import
- Upload
- API endpoints
- Password reset

Use an abstraction so the implementation can later move to Redis or another service.

---

# 29. Caching

Public invitation pages are strong candidates for caching.

Be careful with:

- RSVP state
- personalized content
- unpublished events

Never cache private dashboard information publicly.

---

# 30. SEO Architecture

Public invitation metadata should be generated from event data.

Example:

```text
Title:
The Wedding of Raka & Nadia

Description:
Undangan pernikahan Raka & Nadia
```

---

# 31. Testing Architecture

## Unit

Business logic.

## Integration

Database + server actions.

## E2E

Real browser flows.

Critical E2E:

```text
Register
→ Create Event
→ Select Template
→ Edit
→ Add Guest
→ Publish
→ Open Invitation
→ RSVP
```

---

# 32. Performance Budget

Avoid:

- giant client bundles
- unnecessary dependencies
- massive images
- unnecessary hydration
- excessive animations

Use server rendering whenever possible.

---

# 33. Accessibility

All interactive components must support:

- keyboard navigation
- focus management
- semantic elements
- labels
- screen readers where appropriate

---

# 34. Architectural Rules

DO:

- Keep business logic server-side
- Reuse components
- Validate inputs
- Scope queries by event
- Use transactions where necessary
- Test critical workflows

DO NOT:

- Put database queries inside UI components
- Trust client authorization
- Expose sequential IDs
- Hardcode plan limits
- Duplicate template business logic
- Create fake integrations
- Ignore build errors

---

# 35. Architecture Evolution

The MVP should be a modular monolith.

Do NOT introduce microservices unless there is a concrete operational requirement.

The initial goal is:

```text
One application
One database
Clear modules
Clear boundaries
Provider abstractions
```

This keeps development fast while preserving future scalability.

---

# 36. Security Response Headers / CSP

Implemented in `proxy.ts` via `lib/security/headers.ts`, applied to every
request the proxy matcher covers. See `docs/DECISIONS.md`'s D-053 for the
full per-directive reasoning; summarized here:

```text
script-src   'self' 'nonce-{per-request}' 'strict-dynamic'
style-src    'self' 'unsafe-inline'   (theme inline styles — see D-050/D-051)
img-src      'self' https: http: data: blob:  (matches url-safety.ts — D-041/D-042)
connect-src  'self'
worker-src   'self'   (qr-scanner's Safari fallback worker)
object-src   'none'
frame-ancestors 'self'
```

Nonces require dynamic rendering (Next.js applies them at render time from
the CSP header; a statically generated page has none). Every route in this
app is dynamically rendered — confirmed via `next build` output, not
assumed — either because it already reads cookies/headers/searchParams
(auth, guest tokens, analytics session), or via an explicit
`export const dynamic = "force-dynamic"` on the two pages that otherwise
wouldn't (`app/page.tsx`, `app/not-found.tsx`).

Do NOT:

- Tighten `img-src` to a domain allowlist — owner-pasted external
  image/gift-QR URLs are a deliberate product feature (D-041/D-042).
- Tighten `style-src` without first moving theme-variable application off
  React's `style` prop.
- Narrow `worker-src 'self' blob:` — `qr-scanner`'s fallback engine is a
  Blob-URL worker; dropping `blob:` silently breaks QR check-in scanning
  on every browser without the native `BarcodeDetector` API (iOS Safari,
  Firefox, desktop Chrome on Windows/Linux), easy to miss testing from a
  browser that has it (D-053).
- Add a new statically-rendered page without also opting it into dynamic
  rendering, or its own Next.js hydration script will be blocked by CSP.