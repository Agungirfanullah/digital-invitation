# Session Handoff — 2026-10-27 to 2026-11-04

> **Cara pakai (untuk pemilik produk):** di laptop lain, `git pull`, buka
> Claude Code di folder repo, lalu ketik:
> _"Baca docs/HANDOFF.md lalu lanjutkan dari Next Step."_

This file hands a new agent session the context of the recent working
days. It is a summary and a pointer list; the sources of truth stay
`CLAUDE.md`, `docs/DECISIONS.md` (D-092 to D-110) and `docs/STATUS.md`.
Read those for detail, and update or replace this file at the end of the
next session.

---

## 1. How the product owner works

- Writes casual Indonesian ("lu/gue"); answer in the same register,
  short and concrete. Explain technical terms simply when asked ("CI itu
  apa?").
- **Commits and pushes themselves.** Never run `git commit` or
  `git push`. At the end of a task, give: what changed, verification
  results, a `git add …` line, and a commit message in Indonesian with the
  conventional prefix (`feat:`, `fix:`, `test:`, `docs:`, `ci:`) ending with
  `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`. They like one
  commit per logical step (e.g. one per template stage).
- Product-scope and copy decisions are theirs. Present options with a
  recommendation (they usually say "ikuti saran"), do not decide silently.
  Anything touching the database, production or infrastructure: ask first.
- No fake data, ratings, testimonials, popularity claims or "terkirim"
  states (CLAUDE.md §1.4). This came up repeatedly; keep enforcing it.
  The demo invitation carries obviously sample data (bank "Bank Contoh"),
  never invented guest wishes.
- They ask for honest design critique ("menurut lu sebagai desainer senior
  udah menarik belum?"): give a score, what works, what does not, and a
  prioritized fix list.

## 2. What was done

### 2026-10-27 to 10-28 (SEO, CI, homepage, dashboard)

| Commit | Summary | Decision |
| --- | --- | --- |
| `e63ea4a` | SEO metadata, homepage-only JSON-LD from `getActivePlans()`, fake rating removed | D-092 |
| `eb70439` `41aa486` `f1d16ff` | CI timeouts for CI-to-Supabase latency; CI green again | D-093 |
| `9a69973` | Published invitations `noindex` + `X-Robots-Tag` on `/invite/*` | D-094 |
| `95aa4e5` `a09c54b` | Homepage redesign "modern bersih"; honest copy, paid plans "Segera hadir" | D-095 |
| `68cf092` | Dashboard + account pages redesign | D-096 |
| `fd5f730` `1df842d` `29be551` | Logo/nav scroll to top; password show/hide toggle | — |

### 2026-11-02 to 11-03 (CI fix, templates, editor)

| Commit | Summary | Decision |
| --- | --- | --- |
| `43b5413` | Onboarding integration test uses per-run slugs (cancelled CI run had left fixed-slug rows) | STATUS |
| — | DEV DB cleaned: 275 leftover test users + 47 events deleted; only `dev.tester@example.com` remains (keep it) | STATUS |
| `666d320` | CI no longer cancels push runs mid-run; PRs still do | D-097 |
| `f93d9af` | Fuller demo (full names, love story, "Bank Contoh" gift, sample RSVP form that cannot be sent); shared sections follow each template (`components/invitation/template-look.ts`: corner radius, countdown mood, five desktop-panel layouts); gallery mosaic | D-098 |
| `6de36db` | Event hub (breadcrumb, grouped tool cards) and invitation editor redesign (toolbar, grouped section nav, phone-frame live preview); dashboard nav "/edit vs /editor" active bug fixed | D-099 |
| `ddec119` | Couple parents shown publicly ("Putri dari / Putra dari", auto "Bapak/Ibu") | D-100 |
| `6bbb9a1` `53ad858` `25b5f9b` | Eight look-alike templates rebuilt with their own composition (Royal Gold, Art Deco, Floral Romance, Garden Tropical, Blue Bloom, Traditional Nusantara, Soft Romantic, Minimal Elegant) | D-101 |
| `f03d410` | 17th template **Traditional Jawa** (gunungan, truntum, kawung, parang); seeded on DEV and production | D-102 |
| `a927d1e` | Template web fonts actually load (18 families via `next/font`, `preload: false`); Traditional Jawa refined | D-103 |
| `0fa629b` | Step 3 polish of the other eight templates; one RSVP heading per page (`RsvpSection embedded`); handoff refreshed | D-104 |
| `800e16a` | Template web fonts in the editor font picker; deleted-event race shows "not found" instead of a 500 | D-105 |

### 2026-11-04 (launch readiness)

| Commit | Summary | Decision |
| --- | --- | --- |
| (pending push) | Kebijakan Privasi + Syarat & Ketentuan pages | D-106 |
| (pending push) | Admin panel (super admin), account suspension (`User.suspendedAt` migration, applied to DEV), `npm run admin:grant` | D-107 |
| (pending push) | Stricter style CSP (`style-src-elem` nonce) + `media-src`; `e2e/csp.spec.ts` | D-108 |
| (pending push) | Background music (upload + library), supersedes D-069's "no music" | D-109 |
| (pending push) | Akun page (rename, password, delete account), activity log, robots.txt, sitemap.xml; retroactive D-067/070/072/073/077 entries | D-110 |

## 3. Current state

- **Template refresh is complete** (audit → shared foundations → step 2 →
  Traditional Jawa → fonts → step 3). Homepage and dashboard refreshes
  were already done. A before/after page of the step-2 templates was
  published as a private artifact for the owner.
- **Verification at the D-104 change:** Vitest (components, invitations)
  1,049 PASS; E2E for templates, invitation, RSVP, wishes, guest
  invitation, homepage and editor 61/61 PASS; typecheck, ESLint, Prettier
  clean. The last full run (at `a927d1e`): Vitest 115 files / 2,010 tests,
  full E2E 125/125, CI green. Confirm GitHub Actions is green on the latest
  push before starting.
- **Production:** Vercel + a separate Supabase project. Traditional Jawa's
  Template row was seeded there by the owner (confirmed). Published
  invitations open publicly (the owner tested); the `…-mumun-tech.vercel.app`
  team alias sits behind Vercel login, which is normal.

## 4. Next step

**Production setup the owner must do for the 2026-11-04 work** (the agent
cannot: production credentials, and the DEV bucket change was refused by
the permission system as a shared-resource change):

1. `npx prisma migrate deploy` against production (adds `User.suspendedAt`).
2. `npm run storage:configure` against DEV **and** production, so the bucket
   accepts MP3/M4A (until then music uploads fail and `e2e/music.spec.ts`
   skips).
3. Set `NEXT_PUBLIC_CONTACT_EMAIL` in Vercel (shown on the legal pages).
4. `npm run admin:grant -- <email>` against production for the first admin.
5. Have the legal pages reviewed by someone qualified in Indonesian law.
6. Built-in music tracks: one so far (Chopin Nocturne Op. 9 No. 2, PD).
   More go through `music-incoming/` (git-ignored) with title, performer
   and license confirmed, then `public/music/` and
   `lib/invitations/music-library.ts` (D-109).

**Still open (ask which first):** Phase 18 (subscription/payments); the
homepage JSON-LD price range Rp0–Rp299.000; `connection_limit=1` onboarding
transaction timeouts; demo photos in traditional attire; custom SMTP,
Supabase plan/auto-pause and error alerting (UptimeRobot/Sentry) before
launch.

## 5. Gotchas learned (save time)

- **E2E text locators are loose.** `getByRole(…, { name })` and
  `getByText` match case-insensitive substrings, a list's text runs
  together without spaces, and hidden elements count. Sidebar labels avoid
  "Edit", "Kelola", "Tambah Tamu"; "Check-in" + "Analitik" adjacent spells
  "nAn". Never render the same visible text twice (e.g. the hero heading,
  a guest name, the invitation preview in the editor must render once).
  Grep `e2e/` for a label before adding a link or heading with similar text.
- **CI is slow to Supabase.** E2E sometimes times out on the first attempt
  (~8 s per invitation page). Re-run the failed job before changing code;
  only raise waits if the same tests fail again.
- **Cancelled CI runs leave test rows behind.** Never use fixed values for
  globally unique columns (slug, token) in tests; add a per-run suffix.
- **`next-env.d.ts` flips** between dev and build; always
  `git checkout -- next-env.d.ts` after a build, never commit it.
- **Two Next servers in one folder conflict**, and a killed background
  `next dev` can leave its node process holding the port (symptom: 500s
  with "Jest worker encountered 2 child process exceptions"). Free the port
  with PowerShell `Get-NetTCPConnection -LocalPort 3220` + `Stop-Process`.
- **Bash heredocs break on apostrophes** in this environment (the command
  is wrapped in quotes). Write scripts to the scratchpad with the Write
  tool and run them instead.
- **Template bands in the primary color:** paint `--ii-primary` on a
  wrapper (and keep it as `--ii-band`), rescope `--ii-text`/`--ii-primary`
  to `var(--primary-foreground)` on an inner element. Never put RSVP or
  wish forms on a band. Buttons on bands: foreground on band color.
- **Transforms create containing blocks:** animations on wrappers of forms
  must be opacity-only (`animate-fade-in`), or date/time picker popovers
  mis-position.
- **SVG pattern ids** must be unique per instance (`useId`), since a
  template can render several times on one page.
- **Fonts:** theme stacks keep plain family names; `resolveFontStack()`
  maps them to the `next/font` variables. Adding a web font means updating
  both `app/template-fonts.ts` and `lib/invitations/font-stack.ts`.
- **Adding a template** (D-079): registry, default theme (contrast + unique
  palette tests), `template-look.ts`, homepage style group, `prisma/seed.ts`,
  slug lists in `default-themes.test.ts`, `registry.test.ts`,
  `cross-template.test.tsx`, `e2e/templates.spec.ts`; then seed DEV, and
  the owner seeds production (set `$env:DATABASE_URL`/`$env:DIRECT_URL` to
  production in that terminal, `npm run db:seed`; the seed only creates
  missing rows).
- **GitHub API without auth** allows 60 requests/hour and `gh` is not
  installed. Job logs/artifacts need the owner to download them (they put
  `playwright-report` in the repo root; it is gitignored).
- **Traditional Nusantara stays generic** by decision; attributed regional
  motifs go in their own template (D-102).
- **Every page must render dynamically** (or read cookies/headers) so Next
  stamps the CSP nonce on its scripts; a statically prerendered page has
  its scripts blocked. `e2e/csp.spec.ts` catches this; add new public pages
  to it. Use `export const dynamic = "force-dynamic"` when a page reads no
  request data.
- **`"use server"` files may export only async functions**; keep constants
  (e.g. messages) in a plain module.
- **The dashboard streams (`loading.tsx`)**, so `notFound()` in a dashboard
  page answers HTTP 200 with the not-found screen; assert the screen in
  E2E, not the status code.
- **Audit rows survive user deletion**; integration/E2E tests must delete
  the `AuditLog` rows they create (by `userId` or `resourceId`).
- **Supabase's admin `deleteUser` throws** (not returns an error) for a
  non-UUID id; wrap it.
- **Vercel refuses function request bodies over 4.5MB** before the app
  runs, so the user only sees a generic failure. Every Server Action
  upload stays at 4MB (photos `GALLERY_UPLOAD_MAX_BYTES`, music
  `MUSIC_UPLOAD_MAX_BYTES`; tests guard both). Local dev has no such limit.

## 6. Commands

```bash
npx tsc --noEmit
npm run lint
npx prettier --check <files>
npx vitest run                     # unit + integration (live DEV database)
npm run build && git checkout -- next-env.d.ts
CI=true npx playwright test        # E2E exactly as CI runs it (production build)
CI=true npx playwright test e2e/templates.spec.ts --repeat-each=3 --retries=0
```

All need `.env.local` (Supabase DEV credentials) — copy it to the other
laptop by hand; it is not in git.

## 7. Screenshot helpers used for visual review

Not committed (scratch tooling). Recreate in the scratchpad when needed;
each loads Playwright from the project's own `node_modules` via
`createRequire("<REPO>/package.json")`, against `next dev --port 3220`:

- **Template demos:** visit `/demo/<slug>` at 390×844 (and 1440×900),
  scroll the page to trigger reveals, full-page screenshot; log console
  errors and `document.documentElement.scrollWidth > innerWidth`.
- **Section close-ups:** screenshot `section[aria-labelledby="<id>-heading"]`.
- **Without a cover photo:** create a throwaway user + published event with
  Prisma (no photo), set `templateId`, visit `/invite/<slug>`, click
  "Buka Undangan", screenshot, delete everything in `finally`.
- **Dashboard pages:** create a user through the Supabase admin API, log
  in through `/login`, screenshot, delete the event, user and auth user in
  `finally`. Never leave test data in the DEV database.
