# Progress

Three lines per phase (spec, "How to use this file").

## Phase 0: Foundation (done)

- pnpm + Turborepo monorepo (api, worker, dashboard, site; shared, db), strict TS, ESLint + Prettier, CI with a real Postgres/Redis job. docker-compose for Postgres 16 + pgvector, Redis 7 and Mailpit.
- zod-validated env, pino logging, `/health` + `/ready` (Postgres, Redis, worker heartbeat), graceful shutdown. Drizzle with the first migration (plans, organizations, users, memberships, super_admins) and an idempotent seed (3 plans, Shiksha Computer Institute, owner, staff, super admin).
- Dashboard: bahi-khata tokens (light/dark), self-hosted Anek Devanagari + Mukta, app shell (bottom tabs + "Aur" sheet on phones, sidebar on desktop), Hindi/English, and `/dev/components` with Button, Input, Card, LedgerCard, StatusPill and EmptyState. Contrast is tested in CI.

## Next: Phase 1, WhatsApp echo

Needs from Pratap: a Meta app with a WhatsApp test number (app secret, verify token, a temporary access token, phone number id) and S3-compatible storage (Cloudflare R2 or Azure Blob) for media.
