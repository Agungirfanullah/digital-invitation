# Database Design

## Digital Invitation SaaS

**Database:** Supabase-hosted PostgreSQL  
**ORM:** Prisma  
**Primary App Hosting:** Vercel  
**Backend Platform:** Supabase

---

# 0. Infrastructure & Connection Model

The database is hosted by **Supabase PostgreSQL**.

```text
Vercel / Next.js
       │
       ▼
    Prisma
       │
       ▼
Supabase PostgreSQL
```

The standard project must **not require a local PostgreSQL server or Docker** for development.

## 0.1 Database Responsibilities

Supabase PostgreSQL is the source of truth for:

- users
- events
- event membership
- guests
- guest invitations
- RSVP
- wishes
- schedules
- venues
- galleries
- gift configuration
- subscriptions
- payments
- analytics
- check-in
- audit data

## 0.2 Prisma

Prisma is the primary ORM and schema/migration layer.

Use:

```text
prisma/schema.prisma
prisma/migrations/
```

for relational schema management.

Application code should access PostgreSQL through Prisma rather than scattering raw SQL throughout the application.

Raw SQL is acceptable only when justified and kept within a controlled data-access boundary.

## 0.3 Supabase Services

Use Supabase services intentionally:

- PostgreSQL → relational application data
- Storage → uploaded files/media
- Auth → authentication when selected

Do not move core relational application data into Supabase-specific JSON structures merely because Supabase supports them.

### Data API lockdown (Row Level Security)

Supabase exposes the `public` schema through its Data API (PostgREST) to
the `anon` and `authenticated` roles. This application never uses the
Data API for table access — every table is read/written through Prisma,
connected as the table-owning `postgres` role, which has `BYPASSRLS`.

Therefore (D-054, migration `20260923150000_lock_down_supabase_data_api`):

- Every `public` table has RLS **enabled with no policies** (deny-all for
  non-bypass roles).
- `anon`/`authenticated` hold **no privileges** on any `public` table,
  sequence or function, and the migration role's default privileges no
  longer grant them on future objects.
- Prisma is unaffected (owner + `BYPASSRLS`).

Every migration that creates a table must also
`ALTER TABLE ... ENABLE ROW LEVEL SECURITY` for it.
`lib/db/rls.integration.test.ts` enumerates tables from the live catalog
and fails if any table lacks RLS, any Data API role holds a privilege, or
any policy exists. Adding a policy or granting Data API access requires a
new, explicit decision in `docs/DECISIONS.md` — never a broad
`USING (true)` policy.

## 0.4 Serverless Connection Safety

The application is deployed on Vercel, so Prisma/Supabase connections must use a deployment-appropriate connection strategy.

Use Supabase's supported pooling/direct connection approach as required by the environment.

The implementation must prevent uncontrolled database connection growth during concurrent Vercel executions.

## 0.5 Environment Configuration

The actual credentials must never be committed.

Development uses the hosted Supabase database through environment variables documented in:

```text
.env.example
```

Production secrets are configured through Vercel/Supabase environment configuration, not hardcoded into the repository.

---

# 1. Database Principles

The database must:

- Use relational modeling
- Maintain referential integrity
- Use foreign keys
- Use indexes for common queries
- Avoid unnecessary duplication
- Support multiple events per user
- Support future event types
- Support subscriptions
- Support analytics

Use UUID or CUID consistently.

---

# 2. Core Entity Relationship

High-level:

```text
User
 │
 ├── Event
 │     │
 │     ├── EventMember
 │     ├── Guest
 │     │     └── GuestInvitation
 │     ├── EventSchedule
 │     ├── Venue
 │     ├── Gallery
 │     ├── LoveStory
 │     ├── RSVP
 │     ├── Wish
 │     ├── GiftMethod
 │     ├── GiftRegistry
 │     ├── InvitationView
 │     └── CheckIn
 │
 └── Subscription
       │
       └── Plan
```

---

# 3. User

Purpose:

Application account.

Fields:

```text
id
email
name
passwordHash
avatarUrl
role
emailVerifiedAt
createdAt
updatedAt
```

Constraints:

- email unique
- passwordHash nullable if OAuth-only account
- role defaults to USER

---

# 4. Event

Represents an invitation/event.

Fields:

```text
id
ownerId
type
title
slug
status
description
templateId
themeId
publishedAt
expiresAt
settings
createdAt
updatedAt
```

Status:

```text
DRAFT
PUBLISHED
ARCHIVED
```

Constraints:

- slug unique
- owner required
- template optional during initial creation

Indexes:

```text
ownerId
slug
status
```

---

# 5. EventMember

Allows future team collaboration.

Fields:

```text
id
eventId
userId
role
createdAt
updatedAt
```

Roles:

```text
OWNER
EDITOR
VIEWER
```

Constraints:

```text
eventId + userId UNIQUE
```

---

# 6. Template

Represents an invitation template.

Fields:

```text
id
name
slug
description
category
previewImageUrl
isActive
isPremium
configuration
createdAt
updatedAt
```

Configuration may contain JSON for:

- default section ordering
- typography
- decorative configuration
- supported sections

---

# 7. Theme

Represents visual configuration.

Fields:

```text
id
eventId
primaryColor
secondaryColor
backgroundColor
textColor
accentColor
headingFont
bodyFont
scriptFont
backgroundImageUrl
configuration
createdAt
updatedAt
```

One event may have one active theme.

---

# 8. Guest

Represents a person invited to an event.

Fields:

```text
id
eventId
name
normalizedName
phone
email
category
seatQuota
notes
createdAt
updatedAt
```

Category:

```text
FAMILY
FRIEND
COLLEAGUE
VIP
OTHER
```

Indexes:

```text
eventId
phone
normalizedName
```

---

# 9. GuestInvitation

Represents the invitation relationship between a guest and event.

Fields:

```text
id
eventId
guestId
token
status
sentAt
openedAt
createdAt
updatedAt
```

Status:

```text
NOT_SENT
SENT
OPENED
RSVPED
CHECKED_IN
```

Constraints:

```text
token UNIQUE
eventId + guestId UNIQUE
```

Never use guest database ID as public invitation token.

`status` advances to `RSVPED` automatically whenever the guest submits or
updates their RSVP (see §16), regardless of attendance value — RSVPED
means "the guest responded," not "the guest is attending" (that's
`RSVP.attendance`). It is never downgraded back to RSVPED from
`CHECKED_IN` once check-in ships. See `docs/DECISIONS.md` D-026.

---

# 10. EventSchedule

Represents an event schedule.

Fields:

```text
id
eventId
title
description
date
startTime
endTime
venueId
sortOrder
createdAt
updatedAt
```

Examples:

- Akad Nikah
- Reception
- Holy Matrimony
- After Party

---

# 11. Venue

Fields:

```text
id
eventId
name
address
latitude
longitude
mapUrl
createdAt
updatedAt
```

---

# 12. Gallery

Represents a gallery associated with an event.

Fields:

```text
id
eventId
title
sortOrder
createdAt
updatedAt
```

---

# 13. GalleryItem

Fields:

```text
id
galleryId
type
url
thumbnailUrl
caption
sortOrder
createdAt
updatedAt
```

Type:

```text
IMAGE
VIDEO
```

---

# 14. LoveStory

Fields:

```text
id
eventId
title
sortOrder
createdAt
updatedAt
```

---

# 15. LoveStoryItem

Fields:

```text
id
loveStoryId
dateLabel
title
description
imageUrl
sortOrder
createdAt
updatedAt
```

---

# 16. RSVP

Represents the guest response.

Fields:

```text
id
eventId
guestId
attendance
attendeeCount
message
submittedAt
createdAt
updatedAt
```

Attendance:

```text
ATTENDING
NOT_ATTENDING
MAYBE
```

Constraints:

```text
eventId + guestId UNIQUE
```

Business rule:

```text
attendeeCount <= guest.seatQuota
```

---

# 17. Wish

Fields:

```text
id
eventId
guestId
name
message
status
createdAt
updatedAt
```

Status:

```text
PENDING
APPROVED
HIDDEN
DELETED
```

Only APPROVED wishes are publicly displayed.

---

# 18. GiftMethod

Represents configured gift/payment information.

Fields:

```text
id
eventId
type
providerName
accountName
accountNumber
qrImageUrl
instructions
isActive
createdAt
updatedAt
```

Type:

```text
BANK
EWALLET
QR
OTHER
```

Sensitive information should be handled carefully.

---

# 19. GiftTransaction

Represents an actual transaction only when an integrated payment provider exists.

Fields:

```text
id
eventId
guestId
provider
providerTransactionId
amount
currency
status
paidAt
metadata
createdAt
updatedAt
```

Status:

```text
PENDING
PAID
FAILED
EXPIRED
REFUNDED
```

Never mark PAID based only on frontend input.

---

# 20. GiftRegistry

Fields:

```text
id
eventId
title
description
createdAt
updatedAt
```

---

# 21. GiftItem

Fields:

```text
id
registryId
name
description
imageUrl
price
url
quantity
createdAt
updatedAt
```

---

# 22. GiftReservation

Fields:

```text
id
giftItemId
guestId
quantity
status
createdAt
updatedAt
```

Status:

```text
RESERVED
CANCELLED
PURCHASED
```

Business rule:

Reserved quantity must not exceed available quantity.

---

# 23. InvitationView

Tracks invitation visits.

Fields:

```text
id
eventId
guestId
sessionId
deviceType
referrer
createdAt
```

Do not store unnecessary personal information.

Avoid raw IP storage unless specifically justified.

Indexes:

```text
eventId
guestId
createdAt
```

---

# 24. CheckIn

Fields:

```text
id
eventId
guestId
checkedInAt
checkedInBy
method
createdAt
updatedAt
```

Method:

```text
QR
MANUAL
```

Constraint:

```text
eventId + guestId UNIQUE
```

A guest can only be checked in once.

---

# 25. Plan

Fields:

```text
id
name
slug
description
price
currency
billingInterval
isActive
features
limits
createdAt
updatedAt
```

Do not hardcode pricing or limits in application UI.

---

# 26. Subscription

Fields:

```text
id
userId
planId
provider
providerSubscriptionId
status
currentPeriodStart
currentPeriodEnd
cancelAtPeriodEnd
createdAt
updatedAt
```

Status:

```text
TRIALING
ACTIVE
PAST_DUE
CANCELLED
EXPIRED
```

---

# 27. Payment

Fields:

```text
id
userId
subscriptionId
provider
providerPaymentId
amount
currency
status
paidAt
metadata
createdAt
updatedAt
```

Status:

```text
PENDING
PAID
FAILED
REFUNDED
```

---

# 28. Coupon

Fields:

```text
id
code
type
value
maxRedemptions
redeemedCount
startsAt
expiresAt
isActive
createdAt
updatedAt
```

Type:

```text
PERCENTAGE
FIXED
```

Code must be unique.

---

# 29. Notification

Fields:

```text
id
userId
type
title
message
readAt
metadata
createdAt
```

---

# 30. AuditLog

Used for security-sensitive operations.

Fields:

```text
id
userId
action
resourceType
resourceId
metadata
createdAt
```

Examples:

```text
EVENT_PUBLISHED
USER_ROLE_CHANGED
PAYMENT_REFUNDED
TEMPLATE_CHANGED
```

Do not store secrets in metadata.

---

# 31. Wedding Profile Data

Wedding-specific data should not pollute the generic Event table excessively.

Recommended model:

```text
WeddingProfile

id
eventId
brideFullName
brideNickname
brideFather
brideMother
brideInstagram
groomFullName
groomNickname
groomFather
groomMother
groomInstagram
createdAt
updatedAt
```

Constraint:

```text
eventId UNIQUE
```

This keeps Event generic.

---

# 32. Invitation Section Configuration

Section configuration can be represented as JSON or normalized tables depending on complexity.

For MVP:

Use JSON configuration associated with Event.

Example conceptual structure:

```json
{
  "sections": [
    {
      "type": "cover",
      "enabled": true,
      "sortOrder": 1
    },
    {
      "type": "couple",
      "enabled": true,
      "sortOrder": 2
    },
    {
      "type": "gallery",
      "enabled": true,
      "sortOrder": 3
    }
  ]
}
```

Do not put business-critical relational data into JSON.

---

# 33. JSON Usage Rules

JSON is appropriate for:

- Theme configuration
- Template configuration
- UI settings
- Decorative settings
- Feature flags

JSON is NOT appropriate for:

- Guests
- RSVP
- Payments
- Subscriptions
- Check-ins
- User accounts

Those must remain relational.

---

# 34. Index Strategy

At minimum:

User:

```text
email UNIQUE
```

Event:

```text
ownerId
slug UNIQUE
status
```

Guest:

```text
eventId
eventId + normalizedName
eventId + phone
```

GuestInvitation:

```text
token UNIQUE
eventId + guestId UNIQUE
```

RSVP:

```text
eventId
eventId + guestId UNIQUE
```

Wish:

```text
eventId + status
```

InvitationView:

```text
eventId + createdAt
guestId + createdAt
```

CheckIn:

```text
eventId + guestId UNIQUE
```

---

# 35. Transaction Requirements

Use database transactions for:

### Publishing

Update:

- Event status
- publishedAt

atomically.

### RSVP

Update RSVP and relevant invitation status atomically where appropriate.

### Check-in

Create check-in and update invitation status atomically.

### Gift reservation

Reservation and inventory update must be atomic.

### Subscription

Subscription state updates must be transaction-safe.

---

# 36. Soft Delete

Use soft deletion only where business recovery/audit requirements justify it.

Do not add `deletedAt` to every table automatically.

For MVP, explicit deletion is acceptable for non-critical content.

Audit sensitive administrative changes.

---

# 37. Data Privacy

Never expose:

- password hashes
- payment secrets
- private guest phone numbers
- internal tokens
- admin metadata

Public invitation API responses must contain only required fields.

---

# 38. Seed Data

Seed development data:

- 1 admin
- 3 users
- 6 templates
- 2 events
- 50 guests
- RSVP examples
- wishes
- gallery
- plans

Seed must be safe to run in development.

---

# 39. Prisma Requirements

Use:

- explicit relations
- indexes
- enums
- sensible defaults
- cascading rules carefully

Avoid uncontrolled cascading deletes for financially or audit-sensitive entities.

---

# 40. Migration Rules

Never manually edit production database schema outside migrations.

Every schema change must create a migration.

Every new table must have RLS enabled in the same migration (see §0.3,
"Data API lockdown").

After schema changes:

1. Generate client
2. Run migration
3. Run tests
4. Run typecheck
5. Run build

---

# 41. Database Definition of Done

Database work is complete only when:

- Schema compiles
- Migration succeeds
- Relations are valid
- Required indexes exist
- Constraints exist
- Seed works
- Application can read/write data
- Authorization is enforced
- Tests pass