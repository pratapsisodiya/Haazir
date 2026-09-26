# Haazir

A done-for-you WhatsApp AI assistant for coaching institutes in tier-2/3 India: instant replies at
any hour, demo booking and fee reminders, all on the institute's own WhatsApp number.

The full product spec is in [`docs/HAAZIR_SPEC.md`](docs/HAAZIR_SPEC.md) (original PDF alongside).
It is built in phases; [`PROGRESS.md`](PROGRESS.md) shows where things stand.

## Repository

```
apps/
  api/          Express 5 API: /health, /ready, /api/v1 (routes arrive from Phase 1)
  worker/       BullMQ job processors (Phase 0: a heartbeat on the `system` queue)
  dashboard/    React 19 + Vite PWA for institute owners and staff
  site/         Public marketing site, live on Vercel (Vite/React; moves to Astro in Phase 6)
packages/
  shared/       zod-validated env, error codes, constants, money helpers
  db/           Drizzle schema, SQL migrations, seed data
docs/           Product spec
```

## Run it locally

You need Node 22, pnpm 10 (`corepack enable`) and Docker.

```bash
pnpm install
cp .env.example .env          # defaults work for local development
pnpm services:up              # Postgres 16 + pgvector, Redis 7, Mailpit
pnpm db:migrate
pnpm db:seed                  # demo institute: Shiksha Computer Institute, Sikar
pnpm dev                      # api :4000, worker, dashboard :5173
```

Then open:

| URL                                  | What                                                   |
| ------------------------------------ | ------------------------------------------------------ |
| http://localhost:5173                | Dashboard shell (Hindi by default)                     |
| http://localhost:5173/dev/components | Every component in light/dark and Hindi/English        |
| http://localhost:4000/health         | Liveness: the process is up                            |
| http://localhost:4000/ready          | Readiness: Postgres, Redis, and the worker's heartbeat |
| http://localhost:8025                | Mailpit, for emails the app sends locally              |

The marketing site runs separately: `pnpm --filter @haazir/site dev` (port 4321).

No Docker? Any Postgres 16 and Redis 7 will do. Point `DATABASE_URL` and `REDIS_URL` at them.

## Checks

```bash
pnpm typecheck
pnpm lint
pnpm test          # unit + integration; migrations run on in-process PGlite, no Docker needed
pnpm build
pnpm format:check
```

CI (`.github/workflows/ci.yml`) runs all of these. A second job migrates and seeds a real
Postgres 16 + pgvector (twice, to prove both are idempotent) and checks that the built API
reports ready.

## Manual test checklist (Phase 0)

1. `pnpm dev`, then open `/ready`: `database`, `redis` and (within a minute) `worker` are `ok`.
2. Stop Redis (`docker compose stop redis`): `/ready` returns 503 with `redis: down`, while
   `/health` stays 200. Start it again: `/ready` recovers without restarting anything, and the
   worker's heartbeat comes back within a minute.
3. Open the dashboard on a phone-sized window: top bar, five bottom tabs. Tap **और**: a bottom
   sheet with the other nine screens, plus language and theme.
4. Switch to English, then to Dark. Reload: both choices stick, with no white flash.
5. Widen to ≥ 1024px: a sidebar replaces the tabs, and the active item has a madder strip on
   its left edge.
6. Open `/dev/components`: four panels (light and dark, Hindi and English). The ledger numbers
   count up once. With reduced motion turned on in the OS, they appear without counting.
7. Tab through the page with the keyboard: every control shows a blue focus ring.

## Database

Schema changes: edit `packages/db/src/schema`, then

```bash
pnpm db:generate --name describe_the_change   # writes SQL to packages/db/migrations
pnpm db:migrate
```

Commit the generated SQL. Money is integer paise; ids are Postgres-generated uuids.

## Deploying the marketing site

Vercel builds `apps/site` from this repo (`vercel.json`: `pnpm --filter @haazir/site build`,
output `apps/site/dist`). The API, worker and dashboard deploys are set up in Phase 6
(spec §21).
