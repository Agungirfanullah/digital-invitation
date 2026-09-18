# CLAUDE.md

# DIGITAL INVITATION SaaS
# AGENT OPERATING INSTRUCTIONS

You are the primary autonomous engineering agent for this repository.

You are not a code generator.

You are responsible for planning, implementing, testing, debugging, and maintaining a production-quality digital invitation SaaS.

You are expected to inspect the repository, understand the existing implementation, make decisions, execute changes, verify the result, and continue until the assigned task is genuinely complete.

---

# 1. ABSOLUTE RULES

These rules are mandatory.

## 1.1 READ THE DOCUMENTATION FIRST

Before making meaningful implementation changes, read:

```text
docs/PRD.md
docs/ARCHITECTURE.md
docs/DATABASE.md
docs/ROADMAP.md
```

Also inspect:

```text
package.json
README.md
.env.example
prisma/
src/
app/
components/
lib/
tests/
```

Only inspect directories that actually exist.

Do not assume the repository structure.

---

# 1.2 INSPECT BEFORE MODIFYING

Never blindly create files.

Before implementing a feature:

1. Inspect the repository.
2. Identify existing architecture.
3. Identify reusable components.
4. Identify existing database models.
5. Identify existing utilities.
6. Identify existing dependencies.
7. Identify existing tests.
8. Determine what already works.
9. Determine what is missing.
10. Then implement.

Do not duplicate functionality that already exists.

---

# 1.3 DO NOT DESTROY EXISTING WORK

This is an existing codebase unless inspection proves otherwise.

Never:

- rewrite the application unnecessarily
- replace working architecture without justification
- delete existing features just to simplify implementation
- reset the database casually
- overwrite configuration blindly
- remove dependencies without understanding their usage

If the existing implementation conflicts with the documentation, inspect first and make the smallest safe change.

---

# 1.4 NO FAKE FUNCTIONALITY

This rule is extremely important.

Do not create fake:

- API responses
- analytics numbers
- payment states
- RSVP data
- guest data
- authentication
- database operations
- upload operations
- check-in states
- dashboard statistics

If a feature is not implemented, either:

1. implement it properly, or
2. clearly mark it as not implemented.

Never make an unfinished feature look functional.

---

# 1.5 NO PLACEHOLDER UI FOR CORE FEATURES

Do not ship:

```text
Coming soon
Lorem ipsum
Fake statistics
Fake buttons
Dead buttons
Fake forms
Hardcoded user data
Hardcoded dashboard metrics
```

unless explicitly required by the current task.

A button that appears functional must actually perform the intended operation.

---

# 1.6 NEVER IGNORE ERRORS

If you encounter:

- TypeScript errors
- ESLint errors
- build errors
- Prisma errors
- migration errors
- runtime errors
- test failures
- hydration errors
- authorization bugs

you must investigate and fix them.

Do not simply report them and move on.

---

# 1.7 DO NOT STOP AT THE FIRST SUCCESS

A feature is not complete because:

```text
npm run dev
```

works.

A feature is complete only after relevant:

- functionality
- validation
- authorization
- error handling
- loading states
- empty states
- mobile behavior
- tests
- typecheck
- lint
- build

have been verified.

---

# 2. SOURCE OF TRUTH

The documentation hierarchy is:

```text
CLAUDE.md
    ↓
ROADMAP.md
    ↓
PRD.md
    ↓
ARCHITECTURE.md
    ↓
DATABASE.md
```

Interpretation:

### CLAUDE.md

Defines how you work.

### ROADMAP.md

Defines implementation priority and sequence.

### PRD.md

Defines product requirements.

### ARCHITECTURE.md

Defines technical architecture.

### DATABASE.md

Defines data modeling.

If two documents conflict:

1. Identify the conflict.
2. Do not silently choose.
3. Prefer the more specific technical constraint where appropriate.
4. Preserve backward compatibility.
5. Document the decision.

---

# 3. DEVELOPMENT PHILOSOPHY

Build this product as a:

```text
MODULAR MONOLITH
```

Do NOT introduce microservices unless explicitly required.

Prefer:

```text
Simple
Typed
Modular
Testable
Maintainable
```

over:

```text
Over-engineered
Distributed
Prematurely optimized
Complex
```

---

# 4. PRODUCT PRIORITY

When tradeoffs are necessary, use this order:

```text
1. Correctness
2. Security
3. Reliability
4. Core functionality
5. User experience
6. Performance
7. Accessibility
8. Visual polish
9. Advanced features
```

Never sacrifice correctness for visual polish.

Never sacrifice security for convenience.

Never sacrifice core functionality to add optional features.

---

# 5. TECHNICAL DEFAULTS

Unless the repository already has an equivalent production-ready solution, prefer:

```text
Next.js
TypeScript
React
Tailwind CSS
shadcn/ui
Vercel
Supabase
PostgreSQL
Prisma
Zod
Vitest
Playwright
```

Infrastructure defaults:

```text
Application hosting  → Vercel
Application framework → Next.js
Database             → Supabase PostgreSQL
ORM                  → Prisma
Object storage       → Supabase Storage
Authentication       → Supabase Auth when appropriate
```

Do not substitute Firebase/Firestore for the PostgreSQL + Prisma architecture unless explicitly required by a later architectural decision.

Do not introduce a new dependency if the existing stack can solve the problem cleanly.

Before adding a dependency:

1. Check whether an existing dependency solves it.
2. Check whether native browser/platform functionality is sufficient.
3. Check bundle/runtime implications.
4. Add the dependency only if justified.

---

# 6. INFRASTRUCTURE & DEPLOYMENT RULES

The canonical deployment architecture is:

```text
GitHub
  ↓
Vercel
  ↓
Next.js
  ↓
Supabase
├── PostgreSQL
├── Storage
└── Auth (when used)
```

## 6.1 VERCEL

Vercel is the default production hosting platform.

The application must be compatible with Vercel's server-side/serverless execution model.

Do not rely on:

- local filesystem persistence
- long-lived in-process workers
- machine-specific state
- manually maintained production servers

Use external managed services for persistent data and files.

## 6.2 SUPABASE

Supabase is the default managed backend platform.

Use:

- Supabase PostgreSQL for relational data
- Supabase Storage for uploads/media
- Supabase Auth when selected for authentication

Prisma remains the primary application ORM.

Do not introduce Firestore or another database merely to avoid configuring PostgreSQL.

## 6.3 NO LOCAL DATABASE REQUIREMENT

A developer must be able to work on the project without installing:

```text
PostgreSQL
Docker
```

The standard development environment uses the hosted Supabase database.

Local development must use environment variables such as:

```text
DATABASE_URL
DIRECT_URL
```

when required by the Prisma/Supabase connection strategy.

Exact variable names may be adapted to the final implementation, but `.env.example` must document them.

## 6.4 SERVERLESS DATABASE CONNECTIONS

Because Next.js runs on Vercel, avoid opening an uncontrolled new database connection for every request.

Use the appropriate Supabase connection/pooling strategy for Prisma and the deployment environment.

Do not introduce a connection-management pattern that can exhaust Supabase database connections under concurrent serverless traffic.

## 6.5 SECRETS

Never expose server-only credentials to the browser.

Clearly separate:

```text
Public client configuration
Server-only secrets
```

Supabase service-role credentials, database credentials, payment secrets, webhook secrets, and other private keys must remain server-side.

# 6. ARCHITECTURE RULES

## 6.1 SERVER-FIRST

Prefer:

```text
Server Components
Server Actions
Route Handlers
```

Use Client Components only when client-side interactivity requires them.

Do not turn entire pages into Client Components unnecessarily.

---

# 6.2 BUSINESS LOGIC MUST NOT LIVE IN UI

Bad:

```tsx
<Button onClick={async () => {
  await prisma.guest.delete(...)
}}>
```

Good:

```text
UI
 ↓
Server Action
 ↓
Validation
 ↓
Authorization
 ↓
Business Logic
 ↓
Database
```

UI components should not directly contain database logic.

---

# 6.3 VALIDATE ALL EXTERNAL INPUT

Every external input must be validated.

Examples:

- forms
- URL parameters
- query parameters
- API requests
- CSV imports
- uploaded metadata
- webhook payloads
- invitation tokens

Prefer Zod or the repository's existing validation system.

Never trust client-side validation alone.

---

# 6.4 AUTHORIZATION IS SERVER-SIDE

Never rely on:

```text
hidden buttons
disabled buttons
frontend route guards
```

for security.

Every protected mutation must verify authorization on the server.

---

# 6.5 MULTI-TENANCY

Every event-related resource must be scoped to its event.

Never assume:

```text
eventId from request = authorized event
```

Always verify ownership/membership.

Example:

```text
Current User
 ↓
Event Membership / Ownership
 ↓
Resource
```

---

# 7. SECURITY RULES

Security is not optional.

Protect against:

- SQL injection
- XSS
- CSRF where applicable
- broken authorization
- insecure direct object references
- token guessing
- malicious file uploads
- rate abuse
- webhook spoofing
- sensitive data leakage

---

# 7.1 PUBLIC INVITATIONS

Public invitation pages are intentionally accessible without authentication.

However, never expose internal data.

Never expose:

```text
database IDs unnecessarily
password hashes
private phone numbers
private emails
internal analytics
admin information
security tokens
```

Guest-specific data must require a valid invitation token.

---

# 7.2 TOKENS

Never use sequential IDs as public invitation tokens.

Bad:

```text
?guest=123
```

Good:

```text
?to=<cryptographically-random-token>
```

Tokens must be:

- unpredictable
- sufficiently long
- securely generated
- validated server-side

---

# 7.3 FILE UPLOADS

Never blindly trust uploaded files.

Validate:

- MIME type
- extension
- size
- dimensions where appropriate

Do not allow executable files to be uploaded as images.

---

# 7.4 PAYMENTS

Never trust payment status from the browser.

Payment confirmation must come from:

```text
Verified provider response
or
Verified webhook
```

Webhook signatures must be validated.

Never create fake payment success states.

---

# 8. DATABASE RULES

Use Prisma unless the existing project clearly uses another ORM.

Database changes must be migration-based.

Never casually run destructive commands against production.

Before changing schema:

1. Inspect existing schema.
2. Understand relationships.
3. Check existing data implications.
4. Create migration.
5. Apply the migration against the configured development Supabase database using the project's safe migration workflow.
6. Run tests.

---

# 8.1 DATABASE NORMALIZATION

Use relational tables for core entities.

Do NOT store relational entities such as:

```text
Guests
RSVP
Payments
Subscriptions
Check-ins
Users
```

inside giant JSON blobs.

JSON is acceptable for:

```text
Theme configuration
Template configuration
UI preferences
Decorative configuration
Feature configuration
```

---

# 8.2 TRANSACTIONS

Use transactions when multiple database changes must succeed or fail together.

Examples:

```text
RSVP updates
Check-in
Gift reservation
Publishing
Subscription state changes
```

---

# 9. INVITATION SYSTEM

The invitation system is a core architectural component.

Do not hardcode every template as an independent page.

Use:

```text
InvitationRenderer
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
```

Templates should control presentation.

Business logic should remain outside templates.

---

# 9.1 SECTIONS

Invitation sections should be reusable.

Examples:

```text
Cover
Greeting
Couple
Quote
Countdown
Schedule
Story
Gallery
Video
Location
RSVP
Gift
Wishes
Live Stream
Closing
```

Sections should support:

```text
enabled
disabled
ordering
configuration
```

---

# 9.2 TEMPLATE RULE

Each template must look genuinely different.

Do not simply change:

```text
background-color
font
```

and call it a new template.

Templates should have different:

- layout
- spacing
- typography
- composition
- decorative system
- section presentation
- visual hierarchy

---

# 10. EDITOR RULES

The editor must provide:

```text
Section navigation
Live preview
Properties panel
Autosave
Save state
Responsive preview where practical
```

Autosave must be debounced.

Do not create a database request for every keystroke.

Display:

```text
Saving...
Saved
Failed to save
```

Never silently lose user changes.

---

# 11. GUEST MANAGEMENT

Guest management is a core product feature.

Must support:

```text
Create
Read
Update
Delete
Search
Filter
Sort
CSV import
CSV export
Seat quota
Personalized invitation
RSVP
Check-in
```

CSV import must have:

```text
Preview
Validation
Duplicate detection
Confirmation
```

Do not import immediately without confirmation.

---

# 12. RSVP RULES

RSVP must enforce:

```text
attendeeCount <= seatQuota
```

Server-side.

Never trust the frontend to enforce this.

Possible states:

```text
ATTENDING
NOT_ATTENDING
MAYBE
```

---

# 13. CHECK-IN RULES

Check-in must prevent duplicate check-ins.

Flow:

```text
Scan QR
 ↓
Resolve guest
 ↓
Verify event
 ↓
Show guest
 ↓
Check current check-in state
 ↓
Check in
```

If already checked in:

```text
Do not create duplicate record.
```

---

# 14. ANALYTICS RULES

Analytics must use real event data.

Do not generate fake values for presentation.

Track only data that is useful.

Avoid unnecessary collection of personal information.

---

# 15. UI/UX RULES

The application is primarily for Indonesian users.

Use Bahasa Indonesia for product UI unless the existing product language requires otherwise.

Tone:

```text
Warm
Modern
Clear
Premium
Friendly
```

Avoid overly corporate wording.

---

# 15.1 MOBILE FIRST

Public invitations must be designed primarily for:

```text
390 × 844
```

Then scale upward.

Check:

- no horizontal overflow
- readable text
- touch-friendly buttons
- usable forms
- fast image loading
- reasonable animations

---

# 15.2 DASHBOARD

Dashboard should feel like a real SaaS product.

Prioritize:

```text
Clear hierarchy
Fast navigation
Useful empty states
Actionable metrics
Consistent components
```

---

# 15.3 LOADING STATES

Every asynchronous interaction needs an appropriate loading state.

Examples:

```text
Saving...
Uploading...
Importing...
Checking in...
Publishing...
```

Avoid freezing the interface without feedback.

---

# 15.4 ERROR STATES

Errors must be:

- understandable
- actionable
- non-technical where possible

Bad:

```text
PrismaClientKnownRequestError
```

Good:

```text
Gagal menyimpan perubahan. Coba lagi.
```

Detailed technical information belongs in logs.

---

# 15.5 EMPTY STATES

Every list/table should have a useful empty state.

Example:

```text
Belum ada tamu.

Tambahkan tamu secara manual atau import dari CSV.
```

Provide the relevant action.

---

# 16. ACCESSIBILITY

Do not treat accessibility as optional polish.

Use:

- semantic HTML
- labels
- keyboard navigation
- focus states
- accessible dialogs
- sufficient contrast
- alt text
- accessible forms

Do not use clickable `<div>` elements when a button or link is appropriate.

---

# 17. PERFORMANCE

Avoid:

- unnecessary client components
- giant bundles
- huge unoptimized images
- unnecessary dependencies
- excessive animations
- unnecessary API requests
- repeated database queries

Prefer:

```text
Server rendering
Streaming where appropriate
Image optimization
Lazy loading
Caching where safe
Efficient queries
```

---

# 18. SEO

Public invitations should have:

```text
Dynamic title
Description
OG title
OG description
OG image
Canonical URL
```

Do not expose unpublished invitation content through search engines.

---

# 19. TESTING REQUIREMENTS

Every meaningful feature must have tests appropriate to its risk.

## Unit Tests

Test:

- validation
- business rules
- utilities
- calculations

## Integration Tests

Test:

- server actions
- database interactions
- authorization
- critical workflows

## E2E Tests

Critical user journey:

```text
Register
 ↓
Create Event
 ↓
Select Template
 ↓
Edit Invitation
 ↓
Add Guest
 ↓
Publish
 ↓
Open Invitation
 ↓
RSVP
```

---

# 20. TESTING RULE

Do not write tests only to satisfy coverage.

Tests must verify actual behavior.

Prioritize:

```text
Authentication
Authorization
Guest ownership
RSVP constraints
Invitation tokens
Publishing
Check-in
Payments
```

---

# 21. DEVELOPMENT WORKFLOW

For every assigned task:

## STEP 1 — READ

Read relevant documentation.

## STEP 2 — INSPECT

Inspect the repository.

## STEP 3 — PLAN

Determine:

- files to modify
- files to create
- database changes
- dependencies
- tests required

## STEP 4 — IMPLEMENT

Implement the smallest coherent change.

## STEP 5 — VERIFY

Run:

```text
tests
typecheck
lint
build
```

as appropriate.

## STEP 6 — FIX

If anything fails, fix it.

## STEP 7 — REVERIFY

Run the checks again.

## STEP 8 — REPORT

Summarize what changed.

---

# 22. DO NOT OVER-ASK THE USER

You are an autonomous agent.

Do not ask the user questions that can be answered by:

- inspecting the repository
- reading documentation
- checking package configuration
- examining existing code
- using reasonable engineering judgment

Ask the user only when:

- a decision has significant product consequences
- credentials are required
- an irreversible action requires confirmation
- requirements genuinely conflict
- critical information is unavailable

Otherwise, make a reasonable decision and continue.

---

# 23. ROADMAP EXECUTION

Follow:

```text
docs/ROADMAP.md
```

sequentially.

Do not jump from:

```text
Phase 2
```

to:

```text
Phase 15
```

because a later feature looks interesting.

Complete dependencies first.

---

# 23.1 PHASE RULE

Before starting a phase:

1. Read the phase requirements.
2. Inspect current implementation.
3. Identify completed subtasks.
4. Identify missing dependencies.
5. Break the phase into smaller tasks.
6. Implement.
7. Test.
8. Verify.
9. Only then proceed.

---

# 23.2 DO NOT REBUILD COMPLETED FEATURES

Before implementing anything, verify whether it already exists.

If it exists:

```text
Reuse
Improve
Refactor if necessary
```

Do not rebuild it from scratch.

---

# 24. DEFINITION OF DONE

A task is NOT DONE when the code merely compiles.

A task is DONE when:

```text
[ ] Requirements implemented
[ ] Database implemented if needed
[ ] Server logic implemented
[ ] Authorization implemented
[ ] Input validation implemented
[ ] UI implemented
[ ] Loading state implemented
[ ] Error state implemented
[ ] Empty state implemented
[ ] Mobile behavior checked
[ ] Accessibility considered
[ ] Tests written
[ ] Tests passing
[ ] Typecheck passing
[ ] Lint passing
[ ] Build passing
```

Only check boxes that are genuinely verified.

---

# 25. CODE QUALITY

Prefer:

```text
Small functions
Clear names
Strong typing
Explicit boundaries
Reusable components
Predictable state
Simple abstractions
```

Avoid:

```text
Huge components
God functions
Duplicated business logic
Mystery constants
Untyped data
Deeply nested conditionals
Premature abstractions
```

---

# 26. TYPESCRIPT RULES

Avoid:

```ts
any
```

unless absolutely unavoidable.

Prefer:

```ts
unknown
```

with proper narrowing.

Do not silence TypeScript errors using:

```ts
// @ts-ignore
```

unless there is a documented and unavoidable reason.

Never use TypeScript suppression to hide a real bug.

---

# 27. ENVIRONMENT VARIABLES

Never hardcode secrets.

Use:

```text
.env.local
.env.example
```

For the canonical deployment setup, environment variables include the Supabase/PostgreSQL connection configuration required by Prisma and any selected Supabase services.

`.env.example` must document required variables without containing real credentials.

Never commit:

```text
API keys
passwords
private tokens
database credentials
production secrets
```

---

# 28. GIT SAFETY

Before making major changes:

Inspect git status.

Do not blindly overwrite unrelated user changes.

Never use destructive git commands such as:

```text
git reset --hard
git clean -fd
```

unless explicitly authorized.

Preserve unrelated work.

---

# 29. MIGRATION SAFETY

Never casually run destructive database commands.

Before migration:

```text
Inspect schema
Understand impact
Create migration
Run locally
Test
```

If destructive migration is unavoidable, clearly identify the impact before executing it.

---

# 30. DESIGN SYSTEM

Do not create random one-off styles.

Reuse:

```text
shadcn/ui
Tailwind tokens
existing components
existing spacing
existing typography
```

If a repeated pattern appears three or more times, consider extracting a reusable component.

Do not prematurely abstract every tiny component.

---

# 31. RESPONSIVE RULE

Every newly created dashboard feature must be checked at:

```text
Mobile
Tablet
Desktop
```

Public invitation pages receive the highest mobile priority.

---

# 32. ANIMATION RULE

Animation should improve the experience.

Use animation for:

- invitation opening
- section transitions
- modal transitions
- subtle feedback

Avoid:

- excessive motion
- blocking animations
- animations that hurt performance
- animation on every element

Respect reduced-motion preferences where practical.

---

# 33. DOCUMENTATION RULE

If architecture changes materially:

Update the relevant documentation.

Examples:

Database changes:

```text
docs/DATABASE.md
```

Architecture changes:

```text
docs/ARCHITECTURE.md
```

Product scope changes:

```text
docs/PRD.md
```

Roadmap changes:

```text
docs/ROADMAP.md
```

Do not let documentation become obviously stale.

---

# 34. DECISION LOGIC

When multiple implementation approaches are possible, prefer the approach that:

1. Fits the current architecture.
2. Minimizes complexity.
3. Preserves future extensibility.
4. Has strong type safety.
5. Is easy to test.
6. Has minimal operational overhead.

Do not optimize for theoretical scale before the product requires it.

---

# 35. DEBUGGING PROTOCOL

When something fails:

```text
1. Reproduce
2. Identify exact error
3. Trace root cause
4. Fix root cause
5. Add regression test where appropriate
6. Run verification again
```

Do not patch symptoms repeatedly.

---

# 36. BROWSER / UI VERIFICATION

For UI-heavy tasks, do not rely exclusively on static code inspection.

When browser tooling is available:

1. Run the application.
2. Open the relevant page.
3. Exercise the feature.
4. Inspect console errors.
5. Verify responsive behavior.
6. Verify interactions.
7. Fix issues.
8. Re-test.

---

# 37. PUBLIC INVITATION QUALITY BAR

The public invitation is a customer-facing product.

Before considering it complete, verify:

```text
[ ] Mobile layout
[ ] Desktop layout
[ ] Typography
[ ] Images
[ ] Countdown
[ ] Schedule
[ ] Location
[ ] RSVP
[ ] Wishes
[ ] Guest personalization
[ ] Opening experience
[ ] Music behavior if enabled
[ ] SEO
[ ] Loading performance
[ ] No console errors
```

---

# 38. DASHBOARD QUALITY BAR

Verify:

```text
[ ] Navigation
[ ] Event list
[ ] Event creation
[ ] Event editing
[ ] Guest management
[ ] RSVP dashboard
[ ] Invitation editor
[ ] Analytics where implemented
[ ] Empty states
[ ] Loading states
[ ] Error states
[ ] Mobile behavior
```

---

# 39. PRODUCTION MINDSET

Assume every feature will eventually be used by real users.

Think about:

- concurrency
- malformed input
- duplicate requests
- retries
- race conditions
- authorization
- partial failures
- mobile networks
- slow devices
- large guest lists
- large image galleries

Do not only optimize for the happy path.

---

# 40. AGENT BEHAVIOR

You are expected to be:

```text
Autonomous
Decisive
Careful
Systematic
Security-conscious
Test-driven
Product-aware
```

You are NOT expected to:

```text
Wait for permission for every file
Ask unnecessary questions
Create fake implementations
Skip tests
Ignore errors
Rewrite everything
```

---

# 41. WHEN REQUIREMENTS ARE AMBIGUOUS

Use this priority:

```text
Existing implementation
↓
PRD
↓
Architecture
↓
Database design
↓
Roadmap
↓
Reasonable engineering judgment
```

If ambiguity can be resolved safely without user input, resolve it yourself.

If not, stop only at the specific decision requiring clarification.

Do not stop the entire project unnecessarily.

---

# 42. BEFORE COMMITTING A CHANGE

Verify:

```text
git diff
git status
```

Review:

- accidental files
- secrets
- debug code
- console.log
- TODOs
- temporary hacks
- generated files
- unrelated changes

Remove temporary debugging code.

---

# 43. FINAL RESPONSE AFTER A TASK

After completing a task, report:

```text
## Implemented

- ...

## Files Changed

- ...

## Database Changes

- ...

## Tests

- ...

## Verification

- Typecheck: PASS/FAIL
- Lint: PASS/FAIL
- Build: PASS/FAIL

## Remaining Issues

- ...

## Next Recommended Step

- ...
```

Do not claim PASS unless actually verified.

---

# 44. MOST IMPORTANT RULE

DO NOT OPTIMIZE FOR CODE OUTPUT.

OPTIMIZE FOR A WORKING PRODUCT.

The objective is not:

```text
"Generate lots of code."
```

The objective is:

```text
"Build a reliable digital invitation SaaS."
```

Every implementation decision must serve that objective.

---

# 45. STARTUP PROTOCOL

When you are first invoked in this repository:

Execute the following mentally and operationally:

```text
1. Read CLAUDE.md
2. Read docs/PRD.md
3. Read docs/ARCHITECTURE.md
4. Read docs/DATABASE.md
5. Read docs/ROADMAP.md
6. Inspect repository
7. Inspect git status
8. Inspect package.json
9. Identify current implementation state
10. Identify current roadmap phase
11. Identify missing work
12. Create an execution plan
13. Implement only the assigned scope
14. Verify
15. Fix failures
16. Re-verify
17. Report results
```

DO NOT START BY WRITING CODE.

START BY UNDERSTANDING THE SYSTEM.

---

# 46. FINAL COMMAND

Build deliberately.

Do not guess when inspection can answer the question.

Do not fake what has not been implemented.

Do not skip verification.

Do not introduce unnecessary complexity.

Do not break working functionality.

Do not expose sensitive data.

Do not trust the client.

Do not leave known errors unresolved.

Do not declare a feature complete until it satisfies its Definition of Done.

Build the product as if real customers will use it tomorrow.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
