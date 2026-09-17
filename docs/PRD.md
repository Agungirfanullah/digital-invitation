# Product Requirements Document

## Digital Invitation SaaS

**Version:** 1.0  
**Status:** Active  
**Product:** Digital Invitation Platform  
**Primary Market:** Indonesia  
**Primary Language:** Bahasa Indonesia

---

# 1. Product Overview

This product is a SaaS platform that allows users to create, customize, publish, and manage digital invitations.

The initial focus is wedding invitations, while the underlying architecture must support other event types.

The platform should allow a non-technical user to:

1. Create an account
2. Create an event
3. Select a template
4. Customize the invitation
5. Add guests
6. Generate personalized invitation links
7. Publish the invitation
8. Share it through WhatsApp
9. Receive RSVP responses
10. Manage wishes
11. Track invitation analytics
12. Check guests in at the event

The product must be mobile-first because guests will primarily access invitations through smartphones.

---

# 2. Product Vision

Create the easiest way for Indonesian users to create beautiful digital invitations.

The product should combine:

- Premium invitation design
- Simple no-code editing
- Guest management
- Personalized invitations
- RSVP
- Event check-in
- Digital gifting
- Analytics

The experience should feel significantly simpler than designing a website manually.

---

# 3. Product Principles

## 3.1 Simplicity

A first-time user should understand how to create an invitation without technical knowledge.

## 3.2 Mobile First

The public invitation experience must prioritize smartphones.

## 3.3 Visual Quality

Templates are a core product differentiator.

## 3.4 Personalization

Each guest should be able to receive a personalized invitation.

## 3.5 Real Functionality

Every visible feature must be connected to real functionality.

Do not ship fake buttons, fake analytics, or fake payment states.

## 3.6 Performance

Public invitation pages must load quickly even on mobile networks.

---

# 3.5 Platform & Infrastructure Requirements

The product is designed around a managed cloud architecture.

Canonical infrastructure:

```text
Vercel
  ↓
Next.js
  ↓
Prisma
  ↓
Supabase PostgreSQL
```

Supporting Supabase services may include:

```text
Supabase Storage
Supabase Auth
```

Requirements:

- The application must be deployable to Vercel.
- PostgreSQL must be hosted on Supabase for the planned implementation.
- Prisma remains the ORM and database access layer.
- Uploaded media must use managed object storage, initially Supabase Storage.
- Standard local development must not require a locally installed PostgreSQL server.
- Standard local development must not require Docker.
- Environment-specific credentials must be supplied through environment variables.
- The product must not depend on local filesystem persistence for user-generated data.
- The architecture should remain portable enough to move the PostgreSQL database or supporting providers later without rewriting core product logic.

# 4. Target Users

## 4.1 Primary User

Indonesian couples preparing for marriage.

Typical characteristics:

- Non-technical
- Mobile-first
- Wants beautiful design
- Wants quick setup
- Uses WhatsApp heavily
- Has hundreds of guests
- Wants personalized invitations

## 4.2 Secondary Users

- Event organizers
- Wedding organizers
- Families
- Birthday organizers
- Community organizers
- Corporate event organizers

---

# 5. User Roles

## Guest

Can:

- Open invitation
- See personalized greeting
- View event details
- View gallery
- View story
- View map
- RSVP
- Send wishes
- View gift information
- Add event to calendar
- View live stream
- Check invitation status

## Event Owner

Can:

- Create events
- Edit invitations
- Select templates
- Customize themes
- Manage guests
- Manage RSVP
- Manage wishes
- Manage gallery
- Configure gift
- Publish invitation
- View analytics
- Manage check-in

## Admin

Can:

- Manage users
- Manage events
- Manage templates
- Manage plans
- Manage payments
- Manage moderation
- View platform analytics
- Manage system configuration

---

# 6. Core User Journey

The primary journey is:

REGISTER
→ ONBOARDING
→ CREATE EVENT
→ SELECT TEMPLATE
→ EDIT CONTENT
→ CUSTOMIZE DESIGN
→ ADD GUESTS
→ PREVIEW
→ PUBLISH
→ SHARE
→ RECEIVE RSVP
→ MANAGE GUESTS
→ CHECK-IN

The user should always be able to resume an unfinished event.

---

# 7. Marketing Website

## Homepage

The homepage must communicate the product value immediately.

### Hero

Headline:

> Undangan Digital yang Cantik, Personal, dan Berkesan.

Subheadline:

> Buat undangan dalam hitungan menit. Pilih desain, kelola tamu, bagikan lewat WhatsApp, dan pantau RSVP dari satu tempat.

Primary CTA:

> Buat Undangan

Secondary CTA:

> Lihat Template

---

# 8. Homepage Sections

Required:

1. Hero
2. Template Showcase
3. Product Benefits
4. How It Works
5. Invitation Preview
6. Guest Management
7. RSVP
8. Digital Gift
9. Analytics
10. Pricing
11. Testimonials
12. FAQ
13. CTA
14. Footer

---

# 9. Authentication

Required:

- Register
- Login
- Logout
- Session management
- Protected routes
- Password reset
- Email verification architecture

Optional depending on credentials:

- Google OAuth

Authentication must be production-safe.

---

# 10. Onboarding

After registration:

Display:

> Yuk, buat undangan pertamamu.

Ask:

1. Event type
2. Event name
3. Date
4. Host/couple names
5. Template

Create a draft event immediately after onboarding.

---

# 11. Event Types

MVP:

- Wedding
- Engagement
- Birthday
- Aqiqah
- Anniversary
- Gathering
- Corporate
- Other

The invitation engine must not be hardcoded exclusively for weddings.

---

# 12. Event Creation

Users must be able to create:

- Event title
- Event type
- Date
- Time
- Host
- Couple
- Venue
- Address
- Coordinates
- Description
- Theme
- Template

---

# 13. Wedding Information

Wedding events support:

## Bride

- Full name
- Nickname
- Father
- Mother
- Instagram

## Groom

- Full name
- Nickname
- Father
- Mother
- Instagram

---

# 14. Event Schedules

An event can contain multiple schedules.

Example:

### Akad Nikah

Date:
12 December 2026

Time:
08:00–10:00

Venue:
Example Venue

### Reception

Date:
12 December 2026

Time:
11:00–14:00

Venue:
Example Venue

Custom schedules must be supported.

---

# 15. Invitation Sections

Supported sections:

1. Cover
2. Guest Greeting
3. Couple
4. Quote
5. Countdown
6. Schedule
7. Love Story
8. Gallery
9. Video
10. Location
11. RSVP
12. Gift
13. Gift Registry
14. Wishes
15. Live Streaming
16. Closing

Each section must be independently configurable.

Owner can:

- Enable
- Disable
- Reorder
- Edit

---

# 16. Public Invitation

Public invitation URL:

`/invite/[slug]`

Example:

`/invite/raka-dan-nadia`

Guest-specific URL:

`/invite/raka-dan-nadia?to=[token]`

Public invitations must not require authentication.

---

# 17. Invitation Opening

Opening screen:

> THE WEDDING OF

> Raka & Nadia

> 12.12.2026

Personalized:

> Dear  
> Agung

CTA:

> Buka Undangan

After opening:

- Reveal invitation
- Start optional music
- Enable smooth scrolling

Browser autoplay restrictions must be respected.

---

# 18. Guest Personalization

Each guest must have a unique secure token.

Never expose sequential database IDs as guest invitation identifiers.

Guest data:

- Name
- Category
- Phone
- Seat quota
- Invitation status
- RSVP status
- Check-in status

---

# 19. Guest Management

Required:

- Add guest
- Edit guest
- Delete guest
- Bulk delete
- Search
- Filter
- Sort
- CSV import
- CSV export

Guest categories:

- Family
- Friend
- Colleague
- VIP
- Other

Guest table:

| Name | Category | Phone | Invitation | RSVP | Seats | Check-in |
|---|---|---|---|---|---|---|

---

# 20. CSV Import

CSV import must provide a preview.

Display:

- Valid rows
- Duplicate rows
- Invalid rows

User must explicitly confirm before importing.

Handle:

- UTF-8
- Quoted values
- Commas
- Empty values
- Duplicate guests
- Invalid phone numbers

---

# 21. RSVP

Guest sees:

> Apakah Anda akan hadir?

Options:

- Ya, saya akan hadir
- Maaf, saya tidak dapat hadir
- Masih belum pasti

If attending:

Ask number of attendees.

Never allow attendee count above seat quota.

Store:

- Guest
- Event
- Attendance
- Attendee count
- Message
- Submitted timestamp

---

# 22. RSVP Dashboard

Display:

- Total invited
- Attending
- Not attending
- Pending
- Total seats
- Confirmed seats

Charts:

- RSVP distribution
- RSVP timeline
- RSVP by category

---

# 23. Wishes / Guestbook

Guests can submit:

- Name
- Message

Owner can:

- Approve
- Hide
- Delete

Only approved wishes appear publicly.

Add rate limiting and spam protection.

---

# 24. Gallery

Support:

- Image upload
- Image reorder
- Image delete
- Captions
- Video URLs

Display modes:

- Grid
- Masonry
- Carousel
- Lightbox

Images must be optimized.

---

# 25. Love Story

Support timeline entries.

Each entry:

- Date/year
- Title
- Description
- Optional image

Example:

2018 — First Met

2020 — First Date

2023 — Engagement

2026 — Wedding

---

# 26. Location

Support:

- Venue
- Address
- Coordinates
- Map URL

Guest actions:

- Open Maps
- Get Directions

---

# 27. Music

Support:

- Music library
- Optional custom audio
- Enable/disable
- Volume

Music must not prevent the invitation from functioning if autoplay is blocked.

---

# 28. Digital Gift

Support configuration for:

- Bank transfer
- E-wallet
- QR payment

Provide copy-to-clipboard functionality.

The application must not falsely represent a payment as completed unless a real payment provider confirms it.

---

# 29. Gift Registry

Owner can create:

- Product
- Image
- Price
- URL
- Quantity

Guests can reserve gifts.

Prevent duplicate reservation.

---

# 30. Live Streaming

Support external streaming URLs.

Examples:

- YouTube
- Other streaming providers

Only display the section if configured.

---

# 31. Calendar

Guest can add event to calendar.

Generated event must include:

- Title
- Date
- Time
- Venue
- Address
- Description

---

# 32. WhatsApp Sharing

Generate personalized invitation messages.

Example:

> Halo {{guest_name}},
>
> Dengan penuh kebahagiaan, kami mengundang Anda untuk hadir di acara kami.
>
> Silakan membuka undangan melalui link berikut:
>
> {{invitation_url}}
>
> Terima kasih atas doa dan kehadirannya.

Actions:

- Copy message
- Open WhatsApp
- Generate personalized links

Automated bulk messaging must respect platform policies and anti-spam requirements.

---

# 33. QR Check-in

Each guest receives a secure QR code.

QR check-in must show:

- Guest name
- RSVP status
- Seat quota
- Check-in status

Staff can:

- Scan
- Search manually
- Check in

Duplicate check-ins must be prevented.

---

# 34. Check-in Dashboard

Display:

Total invited

Confirmed

Checked in

Remaining

Provide:

- QR scanner
- Search
- Guest details
- Check-in action

Optimize this experience for mobile/tablet.

---

# 35. Analytics

Track:

- Invitation views
- Unique visitors
- Guest opens
- RSVP
- Wishes
- Gift interactions
- Check-ins

Dashboard should show:

- Total views
- Unique views
- RSVP conversion
- Attendance
- Check-in progress

Do not collect unnecessary personal data.

---

# 36. Invitation Editor

Editor layout:

LEFT:
Section navigation

CENTER:
Live preview

RIGHT:
Properties

Owner can modify:

- Content
- Colors
- Typography
- Background
- Section visibility
- Section order
- Decorative elements

Autosave changes.

Display:

Saving...

Saved

Failed to save

---

# 37. Theme System

Theme properties:

- Primary color
- Secondary color
- Background
- Text
- Accent
- Heading font
- Body font
- Script font
- Background image
- Decorative style

Themes must be data-driven.

---

# 38. Template System

Initial templates:

1. Minimal Elegant
2. Modern Editorial
3. Floral Romance
4. Dark Luxury
5. Traditional Nusantara
6. Soft Romantic

Each template must have a genuinely different visual identity.

Templates must reuse common invitation components.

---

# 39. Template Architecture

Do not create a fully hardcoded page for every template.

Use:

InvitationRenderer

Input:

- Event
- Guest
- Template
- Theme
- Sections

The renderer composes reusable components.

---

# 40. Responsive Design

Support:

- Mobile
- Tablet
- Desktop

Primary viewport:

390 × 844

No horizontal overflow.

Buttons must have touch-friendly sizes.

---

# 41. SEO

Public invitations require:

- Dynamic title
- Meta description
- OG title
- OG description
- OG image
- Canonical URL
- Structured data where useful

---

# 42. Pricing

Initial plans:

## Free

- Limited templates
- Limited guests
- Basic RSVP
- Platform branding

## Premium

- Premium templates
- Higher guest limits
- Personalized guest links
- QR check-in
- Analytics
- Gift
- Custom slug
- Remove branding

## Business

- Multiple events
- Team members
- Advanced guest management
- Advanced analytics
- Check-in

Prices and limits must come from database configuration.

---

# 43. Admin

Admin can manage:

- Users
- Events
- Templates
- Plans
- Payments
- Coupons
- Moderation
- System configuration

---

# 44. Non-Functional Requirements

## Performance

Target Lighthouse Performance >= 90 where practical.

## Accessibility

Support:

- Keyboard navigation
- Semantic HTML
- Focus states
- Labels
- Accessible dialogs
- Alt text

## Security

Implement:

- Authentication
- Authorization
- Input validation
- Rate limiting
- XSS protection
- SQL injection protection
- Secure file uploads
- Secure sessions
- Webhook verification

---

# 45. MVP Scope

MVP includes:

Authentication

Event creation

Templates

Invitation editor

Public invitation

Guest management

Personalized invitations

RSVP

Gallery

Countdown

Location

Wishes

WhatsApp sharing

Dashboard

Responsive design

SEO metadata

---

# 46. Post-MVP

Phase 2:

- QR check-in
- Music
- Digital gift
- Gift registry
- Live streaming
- Analytics
- Custom domains

Phase 3:

- AI copywriting
- AI invitation assistant
- Team collaboration
- Wedding planner
- Budget planner
- Seating management
- Vendor management

---

# 47. Product Success Criteria

A new user should be able to:

1. Register
2. Create an event
3. Select a template
4. Fill basic information
5. Publish an invitation
6. Add guests
7. Generate personalized links
8. Share invitation
9. Receive RSVP

without technical assistance.

---

# 48. Definition of Done

A feature is complete only when:

- UI works
- Backend works
- Database works
- Validation works
- Authorization works
- Loading state exists
- Error state exists
- Empty state exists
- Mobile experience works
- Tests exist
- Typecheck passes
- Lint passes
- Build passes

---

# 49. Product Rule

The product must always prioritize:

CORE FUNCTIONALITY
→ RELIABILITY
→ UX
→ VISUAL POLISH
→ ADVANCED FEATURES

Do not sacrifice core functionality to add more features.