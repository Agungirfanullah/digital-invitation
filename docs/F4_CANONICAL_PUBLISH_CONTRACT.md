# F4 Canonical Publish Contract

**Status:** APPROVED
**Phase:** F4 — Publish Rule Alignment
**Purpose:** Canonical source of truth for MVP publish requirements after the Phase 0.9 conformance audit.

---

## 1. Purpose

This document defines the **approved product rules** for determining whether an event is eligible to be published.

These rules resolve the discrepancies identified during the F4 read-only audit between:

* PRD publish requirements
* current event-type implementation
* existing publish-related tests

This document is authoritative for the F4 implementation work.

### Authority Rule

For F4 implementation:

> **This contract takes precedence over inferred behavior, existing implementation behavior, and ambiguous PRD wording where this contract explicitly defines the approved rule.**

Claude or any implementation agent MUST NOT introduce additional publish requirements that are not defined here.

---

## 2. Scope

The contract applies to the eight MVP event types:

1. WEDDING
2. ENGAGEMENT
3. ANNIVERSARY
4. BIRTHDAY
5. AQIQAH
6. GATHERING
7. CORPORATE
8. OTHER

---

## 3. Canonical Publish Requirements

### 3.1 WEDDING

Wedding requires identity information for both people.

#### Bride

At least one of:

* Bride full name
* Bride nickname

#### Groom

At least one of:

* Groom full name
* Groom nickname

Therefore:

```text
Bride full name OR bride nickname
AND
Groom full name OR groom nickname
```

A Wedding event MUST NOT be publishable if either bride or groom has neither a full name nor a nickname.

Wedding's agenda (schedule) count and venue requirement are defined by **F4-09 (§4.3)**, which supersedes any earlier general statement that "venue is not required by F4 for Wedding" — venue for Wedding is conditionally required, not universally optional. See §4.3.

---

### 3.2 ENGAGEMENT

Required:

* Person 1 full name OR nickname
* Person 2 full name OR nickname
* Exactly 1 agenda (schedule), and that agenda has a non-null venue

Therefore:

```text
Person 1 full name OR nickname
AND
Person 2 full name OR nickname
AND
agendaCount === 1
AND
agenda[0].venueId !== null
```

Agenda count and venue mechanics are defined generally for all non-Wedding types in **F4-09 (§4.4)**.

---

### 3.3 ANNIVERSARY

Required:

* Person 1 full name OR nickname
* Person 2 full name OR nickname
* Exactly 1 agenda (schedule), and that agenda has a non-null venue

Therefore:

```text
Person 1 full name OR nickname
AND
Person 2 full name OR nickname
AND
agendaCount === 1
AND
agenda[0].venueId !== null
```

Agenda count and venue mechanics are defined generally for all non-Wedding types in **F4-09 (§4.4)**.

---

### 3.4 BIRTHDAY

Required:

* Celebrant full name OR nickname
* Exactly 1 agenda (schedule), and that agenda has a non-null venue

Therefore:

```text
Celebrant full name OR nickname
AND
agendaCount === 1
AND
agenda[0].venueId !== null
```

Agenda count and venue mechanics are defined generally for all non-Wedding types in **F4-09 (§4.4)**.

---

### 3.5 AQIQAH

Required:

* Baby full name OR nickname
* At least one parent
* Exactly 1 agenda (schedule), and that agenda has a non-null venue

Parent requirement:

```text
Father
OR
Mother
OR
Father AND Mother
```

Valid states:

```text
Father only       -> VALID
Mother only       -> VALID
Father + Mother   -> VALID
Neither           -> INVALID
```

An Aqiqah event MUST NOT be publishable when:

* the baby has neither a full name nor nickname, OR
* both father and mother are absent, OR
* the agenda/venue requirement in F4-09 (§4.4) is not met.

F4 does NOT require both parents.

---

### 3.6 GATHERING

Required:

* Existing host identity requirement
* Exactly 1 agenda (schedule), and that agenda has a non-null venue

F4-09 (§4.4) establishes the agenda-count and venue mechanics.

F4 does not redefine the existing host identity field or introduce additional host identity requirements.

---

### 3.7 CORPORATE

Required:

* Existing organization identity requirement
* Exactly 1 agenda (schedule), and that agenda has a non-null venue

F4-09 (§4.4) establishes the agenda-count and venue mechanics.

F4 does not redefine the existing organization identity field or introduce additional organization identity requirements.

---

### 3.8 OTHER

Required:

* Exactly 1 agenda (schedule), and that agenda has a non-null venue

F4-09 (§4.4) establishes the agenda-count and venue mechanics.

F4 does not introduce an additional identity requirement for OTHER.

Any existing identity requirement already defined elsewhere in the application remains unchanged.

---

## 4. Agenda Count & Venue Rule (F4-09 — supersedes the earlier §4.1–§4.3)

**Status:** this section fully replaces the original §4.1–§4.3. The
original §4.3 explicitly left the multi-schedule "every vs. at least one"
question unresolved and instructed implementers to stop rather than
guess. That question is now resolved by F4-09 below — **not** by choosing
between "every schedule" and "at least one schedule," but by a per-type
**agenda count limit** that makes the question moot: agenda ("schedule")
count is now itself a publish requirement, so "every schedule" and "at
least one schedule" become the same statement whenever an event actually
satisfies its agenda-count limit.

### 4.1 Venue Definition

For F4 purposes, venue means that an event's schedule (agenda) row has an
associated venue/location entity through the application's existing
`EventSchedule.venue` relationship (`EventSchedule.venueId` non-null).

The implementation MUST use the existing data model and venue
relationship. The implementation MUST NOT invent a new venue
representation.

### 4.2 Agenda Terminology

"Agenda" is this contract's term for a row in the existing `EventSchedule`
table (what the application UI calls a "jadwal acara" / schedule). F4-09
does not introduce a new model or field — it constrains how many
`EventSchedule` rows an event may have at publish time, and whether each
has a venue.

### 4.3 Wedding Agenda & Venue Rule (F4-09)

Wedding is the **only** event type allowed 2 agendas.

```text
agendaCount === 0                          → PASS (governed by the pre-existing requiresDate=false
                                               baseline, not by F4-09 — see note below)
agendaCount === 1                          → PASS regardless of that agenda's venue (venue optional)
agendaCount === 2, both agendas venued     → PASS
agendaCount === 2, either agenda unvenued  → FAIL
agendaCount > 2                            → FAIL
```

**Note on 0 agendas:** Wedding's pre-F4-09 baseline (Phase 0.9) does not
require any schedule at all (`requiresDate: false` for Wedding — see
`docs/DECISIONS.md` D-063, preserved as the Wedding regression baseline).
F4-09 does not reopen that decision: it only constrains Wedding when 1 or
more agendas exist. Zero agendas remains governed by the pre-existing
`requiresDate` rule, which is `false` for Wedding, so zero agendas does
**not** fail under F4-09 specifically (it already passes under the
existing baseline). F4-09's agenda-count ceiling only rejects **more than
2** agendas, and its venue-completeness rule only applies when Wedding
has **exactly 2** agendas.

### 4.4 Non-Wedding Agenda & Venue Rule (F4-09)

Every other MVP event type (ENGAGEMENT, ANNIVERSARY, BIRTHDAY, AQIQAH,
GATHERING, CORPORATE, OTHER) requires **exactly 1 agenda**, and that
agenda MUST have a non-null venue.

```text
agendaCount === 0                    → FAIL
agendaCount === 1, venue present     → PASS
agendaCount === 1, venue null        → FAIL
agendaCount >= 2 (any venue state)   → FAIL
```

This is a stricter statement than "at least one schedule must have a
venue": a non-Wedding event with 2+ agendas fails **even if every agenda
has a venue** — the agenda-count ceiling is independent of, and checked
separately from, the venue check.

---

## 5. Identity Naming Rule

The following event types explicitly accept a nickname as an alternative to a full name:

* WEDDING
* ENGAGEMENT
* ANNIVERSARY
* BIRTHDAY
* AQIQAH

The canonical rule is:

```text
full name OR nickname
```

Therefore, a full name is **not mandatory** when a valid nickname is present.

---

## 6. Aqiqah Parent Rule

Aqiqah requires **at least one parent**.

Valid:

```text
Father only
Mother only
Father + Mother
```

Invalid:

```text
Neither father nor mother
```

F4 does NOT require both parents.

F4 does NOT introduce additional parent/family identity requirements beyond the existing Aqiqah data model.

---

## 7. Wedding Exception

Wedding intentionally differs from the non-Wedding event types.

Wedding requires:

```text
Bride identity
AND
Groom identity
```

Wedding's agenda-count and venue rules are the F4-09 exception described in
§4.3: Wedding may have 1 or 2 agendas (every other type is limited to
exactly 1), and Wedding's venue is only required when it has exactly 2
agendas (both must be venued) — with 1 agenda, venue remains optional.

---

## 8. Canonical Matrix

| Event Type  | Identity Requirement                                              | Agenda Count (F4-09)   | Venue (F4-09)                                 |
| ----------- | ------------------------------------------------------------------ | ----------------------- | ---------------------------------------------- |
| WEDDING     | Bride full name OR nickname AND groom full name OR nickname       | 1 or 2 (max 2)          | Optional at 1 agenda; BOTH required at 2 agendas |
| ENGAGEMENT  | Person 1 full name OR nickname AND Person 2 full name OR nickname | Exactly 1               | REQUIRED on that agenda                        |
| ANNIVERSARY | Person 1 full name OR nickname AND Person 2 full name OR nickname | Exactly 1               | REQUIRED on that agenda                        |
| BIRTHDAY    | Celebrant full name OR nickname                                   | Exactly 1               | REQUIRED on that agenda                        |
| AQIQAH      | Baby full name OR nickname AND at least one parent                | Exactly 1               | REQUIRED on that agenda                        |
| GATHERING   | Existing host identity requirement                                | Exactly 1               | REQUIRED on that agenda                        |
| CORPORATE   | Existing organization identity requirement                        | Exactly 1               | REQUIRED on that agenda                        |
| OTHER       | No additional F4 identity requirement                             | Exactly 1               | REQUIRED on that agenda                        |

---

## 9. F4 Decision Log

### F4-01 — Wedding Identity

**Decision:**

Bride full name OR nickname is required.

AND

Groom full name OR nickname is required.

---

### F4-02 — Non-Wedding Venue

**Decision:**

Venue is required for all non-Wedding event types.

---

### F4-03 — Duplicate Venue Decision

F4-03 duplicated F4-02.

**Decision:**

F4-03 is merged into F4-02.

There is no separate product rule represented by F4-03.

---

### F4-04 — Engagement Identity

**Decision:**

Engagement accepts full name OR nickname.

---

### F4-05 — Birthday Identity

**Decision:**

Birthday accepts full name OR nickname.

---

### F4-06 — Aqiqah Baby Identity

**Decision:**

Aqiqah baby accepts full name OR nickname.

---

### F4-07 — Aqiqah Parent

**Decision:**

At least one parent is required.

---

### F4-08 — Anniversary Identity

**Decision:**

Anniversary accepts full name OR nickname.

---

### F4-09 — Agenda Count & Venue Rule

**Status:** APPROVED. Supersedes the original §4.3's unresolved
"every schedule vs. at least one schedule" question — see §4.

**Decision:**

Wedding is the only event type allowed 2 agendas (schedules).

```text
Wedding:
  1 agenda            → venue optional
  2 agendas           → both agendas MUST have a non-null venue
  more than 2 agendas → publishing MUST be rejected

All non-Wedding types (ENGAGEMENT, ANNIVERSARY, BIRTHDAY, AQIQAH,
GATHERING, CORPORATE, OTHER):
  exactly 1 agenda REQUIRED
  that agenda MUST have a non-null venue
  0 agendas, or 2+ agendas (any venue state) → publishing MUST be rejected
```

Explicitly rejected interpretations: "non-Wedding may have multiple
agendas as long as every agenda has a venue"; "at least one venue is
enough for a multi-agenda event"; "Wedding may have 3+ agendas"; "Wedding
always requires a venue regardless of agenda count."

---

## 10. Implementation Constraints

F4 implementation MUST:

1. Preserve the generalized Phase 0.9 event-type architecture.
2. Preserve the shared event-type configuration/resolver approach.
3. Avoid introducing unnecessary per-event-type duplicate publish logic.
4. Change only publish requirements necessary to conform to this contract.
5. Preserve existing authorization and ownership checks.
6. Preserve existing RLS/security boundaries.
7. Preserve event-type immutability after creation.
8. Avoid unrelated refactoring.
9. Avoid changing stored event data merely to satisfy publish validation.
10. Update affected tests to reflect this contract.
11. Preserve existing security and cross-event isolation tests.
12. Report unresolved ambiguity instead of making a new product decision.

---

## 11. Required F4 Verification

Implementation verification MUST demonstrate the following.

### 11.1 Wedding

Identity valid combinations (agenda/venue rules verified separately below):

* Bride full name + groom full name
* Bride nickname + groom nickname
* Bride full name + groom nickname
* Bride nickname + groom full name

Identity invalid:

* Missing bride identity
* Missing groom identity

Agenda/venue (F4-09, with valid identity held constant):

* 1 agenda + no venue → PASS
* 1 agenda + venue → PASS
* 2 agendas + both venued → PASS
* 2 agendas + first venue null → FAIL
* 2 agendas + second venue null → FAIL
* 2 agendas + both venues null → FAIL
* 3 agendas (any venue state) → FAIL

---

### 11.2 Engagement

Valid:

* Full names + exactly 1 agenda + venue
* Nicknames + exactly 1 agenda + venue
* Mixed full name/nickname + exactly 1 agenda + venue

Invalid:

* Missing required identity
* 0 agendas
* 1 agenda + venue null
* 2 agendas, both venued
* 2 agendas, one venue null

---

### 11.3 Anniversary

Valid:

* Full names + exactly 1 agenda + venue
* Nicknames + exactly 1 agenda + venue
* Mixed full name/nickname + exactly 1 agenda + venue

Invalid:

* Missing required identity
* 0 agendas
* 1 agenda + venue null
* 2 agendas, both venued
* 2 agendas, one venue null

---

### 11.4 Birthday

Valid:

* Full name + exactly 1 agenda + venue
* Nickname + exactly 1 agenda + venue

Invalid:

* Missing identity
* 0 agendas
* 1 agenda + venue null
* 2 agendas, both venued
* 2 agendas, one venue null

---

### 11.5 Aqiqah

Valid:

* Baby full name + father + exactly 1 agenda + venue
* Baby nickname + mother + exactly 1 agenda + venue
* Baby full name + both parents + exactly 1 agenda + venue
* Baby nickname + both parents + exactly 1 agenda + venue

Invalid:

* Missing baby identity
* Missing both parents
* 0 agendas
* 1 agenda + venue null
* 2 agendas, both venued
* 2 agendas, one venue null

---

### 11.6 Gathering

Valid:

* Existing valid host identity + exactly 1 agenda + venue

Invalid:

* 0 agendas
* 1 agenda + venue null
* 2 agendas (any venue state)

Existing host validation must remain unchanged unless explicitly required by another approved contract.

---

### 11.7 Corporate

Valid:

* Existing valid organization identity + exactly 1 agenda + venue

Invalid:

* 0 agendas
* 1 agenda + venue null
* 2 agendas (any venue state)

Existing organization validation must remain unchanged unless explicitly required by another approved contract.

---

### 11.8 Other

Valid:

* Valid event data + exactly 1 agenda + venue

Invalid:

* 0 agendas
* 1 agenda + venue null
* 2 agendas (any venue state)

---

### 11.9 Security Regression Verification

Existing security behavior MUST remain intact, including where applicable:

* authorization checks
* ownership checks
* cross-event isolation
* event-type immutability
* RLS boundaries
* publish authorization
* wrong-event / wrong-owner access protection

---

## 12. Out of Scope

F4 does NOT decide or modify:

* Homepage behavior
* Onboarding behavior
* Countdown implementation
* Opening/reveal animation
* Section ordering
* Theme behavior
* Analytics behavior
* RLS architecture
* Storage policies
* Event-type generalization architecture
* Other Phase 0.9 behavior not directly required for publish-rule alignment

Those remain separate roadmap items.

---

## 13. Source-of-Truth Statement

For the F4 implementation phase:

> **This document is the canonical product contract for MVP publish eligibility.**

If existing code, tests, or documentation conflict with this contract, the implementation work MUST identify and reconcile the conflict explicitly.

No implementation agent may silently:

* reinterpret these rules,
* weaken these rules,
* strengthen these rules,
* add new publish requirements,
* remove existing requirements unrelated to F4,
* or make a new product decision without explicit approval.

---

## 14. Change Control

Any future change to these publish requirements MUST:

1. Identify the affected F4 rule.
2. Explain the product reason for the change.
3. Update this document first.
4. Obtain explicit product approval.
5. Only then modify implementation and tests.

Implementation code MUST NOT become the source of truth for publish requirements.

**Canonical source: this document.**
