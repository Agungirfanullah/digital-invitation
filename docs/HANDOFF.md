# Session Handoff — 2026-10-27 to 2026-10-28

> **Cara pakai (untuk pemilik produk):** di laptop lain, `git pull`, buka
> Claude Code di folder repo, lalu ketik:
> _"Baca docs/HANDOFF.md lalu lanjutkan dari Next Step."_

This file hands a new agent session the context of the last two working
days. It is a summary and a pointer list; the sources of truth stay
`CLAUDE.md`, `docs/DECISIONS.md` (D-092 to D-096) and `docs/STATUS.md`.
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
  conventional prefix (`feat:`, `fix:`, `test:`, `docs:`) ending with
  `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
- Their own UI commits often skip Prettier and docs; check and tidy when
  touching those files.
- Product-scope and copy decisions are theirs. Present options with a
  recommendation (they usually say "ikuti saran"), do not decide silently.
- No fake data, ratings, testimonials, popularity claims or "terkirim"
  states (CLAUDE.md §1.4). This came up repeatedly; keep enforcing it.

## 2. What was done

| Commit | Summary | Decision |
| --- | --- | --- |
| `e63ea4a` | SEO metadata fixes, homepage-only JSON-LD with prices from `getActivePlans()`, fake "4.9/5" rating removed, page titles de-duplicated | D-092 |
| `eb70439` | CI: rate-limit integration test window 300 ms → 3 s (CI latency to Supabase) | STATUS |
| `41aa486` | CI: global Vitest timeout 30 s → 60 s | D-093 |
| `f1d16ff` | CI: E2E gallery multi-upload assertion waits 60 s. **CI green again** (first since 2026-10-13) | D-093 |
| `e8b792d` | STATUS records green CI | — |
| `9a69973` | Published customer invitations are `noindex` + `X-Robots-Tag` on `/invite/*` (privacy) | D-094 |
| `95aa4e5` | Homepage redesign, "modern bersih" | D-095 |
| `a09c54b` | Honest copy: "No. 1 di Indonesia" removed, root description rewritten, paid plans marked "Segera hadir" (no checkout/enforcement exists) | D-095 |
| `68cf092` | Dashboard + account pages redesign (light sidebar, event sub-nav, mobile drawer, `PageHeader`/`Panel`, auth two-column layout, onboarding card) | D-096 |
| `fd5f730`, `1df842d` | Logo and active nav links scroll back to top on the current page (`components/navigation/scroll-top-link.tsx`) | — |
| `29be551` | Show/hide toggle on every password field (`components/forms/password-input.tsx`); Beranda spotlight title no longer a heading (fixed a flaky E2E) | — |

## 3. Current state

- **Verification at `29be551`:** Vitest 110 files / ~1,933 tests PASS;
  full Playwright E2E in CI mode 123/123 PASS (run before the last two
  small commits; their affected specs — homepage, auth, dashboard,
  onboarding — were re-run and pass, dashboard+auth 3× with no retries);
  `tsc`, ESLint, Prettier clean; `next build` PASS. Confirm GitHub Actions
  is green on the latest push before starting.
- **UI refresh plan** (STATUS open item 12): homepage ✅ → dashboard and
  account pages ✅ → **templates (next)**.
- **Open items still waiting on the product owner:**
  - Homepage JSON-LD still states the price range Rp0–Rp299.000 although
    paid plans cannot be bought; offered to limit it to the free plan.
  - Roadmap Phase 18 (subscription/payments) not started; until then paid
    plans stay "Segera hadir" and all features are free (D-095).

## 4. Next step — templates

The owner asked to make the 16 invitation templates more attractive.
Templates are guest-facing and the riskiest part, so:

1. **Audit first, no code:** screenshot every template's demo
   (`/demo/<slug>`) at 390×844 and 1440×900, plus the opening gate. List
   per template what looks weak (many look alike when there is no cover
   photo; sections are sparse). Present the findings with a recommended
   order and get the owner's go-ahead.
2. Respect CLAUDE.md §9 (shared `InvitationRenderer`, templates control
   presentation only) and §9.2 (each template must differ in layout,
   typography and composition, not just colours).
3. Components rendered on public invitations were deliberately left
   untouched by D-096: `components/rsvp/*`, `components/wishes/*`,
   `components/gifts/copy-value-button.tsx`,
   `components/guests/guest-qr-code.tsx`, and `components/ui/*` sizes.
   They belong to this step.
4. Re-run `e2e/templates.spec.ts`, `invitation*.spec.ts`, `rsvp.spec.ts`,
   `wishes.spec.ts`, `og-image.spec.ts` after each batch.

## 5. Gotchas learned (save time)

- **E2E text locators are loose.** `getByRole(…, { name })` and
  `getByText` match case-insensitive substrings, and a list's text runs
  together without spaces. Consequences seen: sidebar labels must avoid
  "Edit", "Kelola", "Tambah Tamu"; "Check-in" + "Analitik" adjacent spells
  "nAn" and fails the analytics "no NaN" check; two headings with the same
  name during navigation cause strict-mode flakes. Grep `e2e/` for a label
  before adding a link or heading with similar text.
- **CI is slow to Supabase** (GitHub runners are far away). Tests with many
  sequential round trips need generous timeouts; see D-056/D-057/D-093.
- **`next-env.d.ts` flips** between dev and build paths; always
  `git checkout -- next-env.d.ts` after a build, never commit it.
- **Two Next servers in one folder conflict.** Stop any `next dev` before
  running Playwright (it starts its own server on port 3100).
- **GitHub API without auth** allows 60 requests/hour and `gh` is not
  installed. Poll CI sparingly; the run page HTML is not rate-limited, and
  job logs/artifacts need the owner to download them.
- **Accessible names:** an inline-block or an inline `<svg>` inside a
  heading adds a space to its accessible name ("Cantik , Personal");
  use CSS `text-decoration` for underlines.

## 6. Commands

```bash
npx tsc --noEmit
npm run lint
npx prettier --check <files>
npx vitest run                     # unit + integration (live DEV database)
npm run build && git checkout -- next-env.d.ts
CI=true npx playwright test        # E2E exactly as CI runs it (production build)
CI=true npx playwright test e2e/homepage.spec.ts --repeat-each=3 --retries=0
```

All need `.env.local` (Supabase DEV credentials) — copy it to the other
laptop by hand; it is not in git.

## 7. Screenshot helper used for visual review

Not committed (scratch tooling). Recreate in a temp folder if needed:
it starts from the project's own `node_modules` via `createRequire`.

```js
// shot.mjs — usage: node shot.mjs <url> <outPrefix>
import { createRequire } from "node:module";
const require = createRequire("<REPO>/package.json");
const { chromium } = require("@playwright/test");
const [url, out] = process.argv.slice(2);
const browser = await chromium.launch();
for (const [name, viewport] of [["mobile", { width: 390, height: 844 }], ["desktop", { width: 1440, height: 900 }]]) {
  const page = await browser.newPage({ viewport });
  await page.goto(url, { waitUntil: "networkidle" });
  const h = await page.evaluate(() => document.body.scrollHeight);
  for (let y = 0; y < h; y += 600) await page.evaluate((v) => scrollTo(0, v), y); // trigger scroll reveals
  await page.evaluate(() => scrollTo(0, 0));
  await page.screenshot({ path: `${out}-${name}.png`, fullPage: true });
  await page.close();
}
await browser.close();
```

For dashboard pages, the session used a variant that creates a throwaway
owner + event through the Supabase admin API and Prisma (same pattern as
`e2e/dashboard.spec.ts`), logs in, screenshots, and deletes everything in
a `finally` block. Never leave test data in the DEV database.
