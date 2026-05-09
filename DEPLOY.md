# Deployment Guide

## One-time setup

1. **Create Turso database**
```bash
curl -sSfL https://get.tur.so/install.sh | bash
turso auth signup    # or login
turso db create bd-assigner
turso db tokens create bd-assigner
```
Save the database URL and auth token.

2. **Deploy to Vercel**
- Push code to GitHub
- Import repo in Vercel dashboard
- Add environment variables:
  - `TURSO_DATABASE_URL` = the libsql:// URL
  - `TURSO_AUTH_TOKEN` = the token
  - `DATABASE_URL` = the libsql:// URL (yes, both — Prisma reads DATABASE_URL for migrate)
  - `NEXT_PUBLIC_DEFAULT_COUNTRY_CODE` = `+91` (or yours)
  - `SESSION_COOKIE_NAME` = `bd_session`
  - `SESSION_MAX_AGE_DAYS` = `30`
- Trigger deploy

3. **Seed the production database** (one-time)
- Locally with prod env vars set:
```bash
TURSO_DATABASE_URL=... TURSO_AUTH_TOKEN=... DATABASE_URL=... npm run db:seed
```
- Or via Turso shell: `turso db shell bd-assigner` and run inserts manually.
- This creates the seeded `admin`, `alice`, `bob` accounts. Change usernames before going live in production.

## Subsequent deploys
- Push to main branch → Vercel auto-deploys
- Schema changes: create migration locally with `npm run db:migrate:dev`, commit, push. Build hook runs `prisma migrate deploy`.

## Rolling back
- Vercel: instant rollback via dashboard ("Promote" a previous deployment)
- DB: `turso db restore` from backup if schema corruption occurs

## Monitoring
- Vercel dashboard: function logs, error rates, runtime metrics
- Health check: `https://yourdomain.com/api/health` — wire to UptimeRobot or similar

## Backup strategy
Turso provides built-in point-in-time recovery on paid plans.
For manual backup or external archiving:
```bash
turso db shell bd-assigner ".dump" > backup-$(date -u +%Y-%m-%d).sql
```
You can automate this via GitHub Actions or a cron job.
