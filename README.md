# Digital Invitation

Digital invitation SaaS for the Indonesian market. Next.js (App Router) +
TypeScript + Prisma + Supabase PostgreSQL, deployed on Vercel.

See `docs/PRD.md`, `docs/ARCHITECTURE.md`, `docs/DATABASE.md`, and
`docs/ROADMAP.md` for product and technical context, and `docs/STATUS.md`
for current implementation state.

## Requirements

- Node.js 20.9+ and npm
- A Supabase project (hosted PostgreSQL, Storage, Auth) — no local
  PostgreSQL or Docker required

## Setup

```bash
npm install
cp .env.example .env.local   # fill in your Supabase DEV credentials
npm run prisma:generate
npm run prisma:migrate       # applies migrations to the configured Supabase DB
npm run db:seed              # seeds reference data (templates, plans)
npm run dev
```

`.env.local` is git-ignored and must never be committed. See
`.env.example` for the full list of variables and what each one is for.

## Scripts

| Script                  | Purpose                                    |
| ------------------------ | ------------------------------------------- |
| `npm run dev`             | Start the Next.js dev server                |
| `npm run build`           | Production build                            |
| `npm run start`           | Run the production build                     |
| `npm run typecheck`       | TypeScript, no emit                          |
| `npm run lint`            | ESLint                                       |
| `npm run format` / `format:check` | Prettier write / check                |
| `npm run test`            | Unit/integration tests (Vitest)              |
| `npm run test:e2e`        | End-to-end tests (Playwright)                |
| `npm run prisma:generate` | Generate the Prisma client                   |
| `npm run prisma:validate` | Validate `prisma/schema.prisma`              |
| `npm run prisma:migrate`  | Create/apply a migration against the dev DB  |
| `npm run prisma:deploy`   | Apply pending migrations (CI/production)     |
| `npm run prisma:studio`   | Open Prisma Studio                           |
| `npm run db:seed`         | Run `prisma/seed.ts`                         |

## Project layout

```text
app/            Routes, layouts, pages (App Router)
components/     UI components (components/ui = shadcn/ui primitives)
lib/            Business logic, db access, providers, validation
  db/           Prisma client
  supabase/     Supabase client boundaries (Storage/Auth)
  env.ts        Zod-validated environment variables
prisma/         schema.prisma, migrations, seed.ts
e2e/            Playwright end-to-end tests
docs/           Product/architecture/database/roadmap documentation
```
