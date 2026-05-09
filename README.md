# BD Assigner

Internal tool for managing cold-outreach lead assignment. Admins upload leads and assign to BDs; BDs make calls, log status, and manage follow-ups; admins monitor activity and analytics.

## Quick start (local dev)

```bash
git clone <repo>
cd bd-assigner
cp .env.example .env
npm install
npm run db:migrate:dev
npm run db:seed
npm run dev
```

Open http://localhost:3000. Log in as `admin`, `alice`, or `bob`.

## Stack
- Next.js 14+ (App Router)
- TypeScript (strict)
- Prisma + SQLite (local) / Turso LibSQL (production)
- Tailwind CSS, B&W theme

## Features
- Username-based auth (admin/user roles)
- Admin: upload leads via Excel, assign to users, monitor activity, analytics dashboard, activity log
- User: see assigned leads, click-to-call with native dialer, log calls, manage status, first interest, 4 follow-up slots
- Both: filter, search, export interested leads to CSV
- Live updates feed (polling-based)

## Deployment
See [DEPLOY.md](./DEPLOY.md).

## Project structure
- `src/app/` — pages (App Router)
- `src/components/` — UI components
- `src/components/ui/` — primitives (Button, Dialog, etc.)
- `src/lib/` — server utilities (auth, prisma, env, logger)
- `prisma/` — schema and migrations

## Scripts
- `npm run dev` — local dev
- `npm run build` — production build
- `npm run db:migrate:dev` — create new migration
- `npm run db:migrate` — apply migrations (production)
- `npm run db:seed` — seed initial users
- `npm run db:studio` — open Prisma Studio
- `npm run analyze` — bundle size analysis

## Environment variables
See `.env.example` for full list.
