# Haazir

A done-for-you WhatsApp AI assistant for coaching institutes in tier-2/3 India: instant replies at
any hour, demo booking and fee reminders, all on the institute's own WhatsApp number.

The full product spec is in [`docs/HAAZIR_SPEC.md`](docs/HAAZIR_SPEC.md) (original PDF alongside).
It is built in phases; [`PROGRESS.md`](PROGRESS.md) shows where things stand.

## Repository

```
apps/
  api/          Express 5 API: /health, /ready, /webhooks/whatsapp, /api/v1
  worker/       BullMQ processors: inbound, ai-reply, outbound, media (+ heartbeat)
  dashboard/    React 19 + Vite PWA for institute owners and staff
  site/         Public marketing site, live on Vercel (Vite/React; moves to Astro in Phase 6)
packages/
  shared/       zod-validated env, error codes, queue names, money, AES-256-GCM secrets
  db/           Drizzle schema, SQL migrations, seed data
  channels/
    whatsapp/   Cloud API v26.0: webhook parser, signature check, window rules, sender
  messaging/    The outbound gate every send goes through
  storage/      S3-compatible (R2, MinIO) or local-disk file storage
scripts/        e2e-whatsapp.sh (CI's end-to-end check)
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

## WhatsApp (Phase 1)

Every incoming message goes: Meta → `POST /webhooks/whatsapp` (signature checked on the raw
body, queued, 200) → `inbound` (stored once, even if Meta delivers it twice) → `ai-reply` →
the outbound gate (opt-out, 24-hour window) → `outbound` → Meta. Delivery statuses come back
through the same webhook and move each message forward: queued, sent, delivered, read (or
failed, with Meta's reason). Photos, voice notes and documents are copied into storage by `media`.

In Phase 1 the "AI" answers every message with **"Namaste! Haazir se jawab."** The real brain
arrives in Phase 2.

**Graph API version:** pinned to **v26.0** (released 29 July 2026) in `META_GRAPH_API_VERSION`.
Bump it only after reading that version's WhatsApp changes.

### Try the whole loop without a Meta account

A mock Graph API stands in for Meta: it accepts sends and posts signed delivery statuses back.

```bash
# in .env: any values for these, plus
#   ENCRYPTION_KEY=<openssl rand -base64 32>
#   META_APP_SECRET=local-secret   META_WEBHOOK_VERIFY_TOKEN=local-verify
#   WHATSAPP_PHONE_NUMBER_ID=100000000000001   WHATSAPP_WABA_ID=1   WHATSAPP_ACCESS_TOKEN=x
#   META_GRAPH_BASE_URL=http://localhost:4010
pnpm db:migrate && pnpm whatsapp:connect   # stores the number, token encrypted
pnpm whatsapp:mock                         # terminal 1: fake Meta on :4010
pnpm dev                                   # terminal 2
pnpm whatsapp:simulate "RS-CIT ki fees kitni hai?"                  # terminal 3
pnpm whatsapp:simulate --repeat 2 "Delivered twice, stored once"
```

The mock prints the read receipt, the reply and the statuses it sends back.

### Connect a real Meta test number

1. At developers.facebook.com create an app (type **Business**) and add the **WhatsApp** product.
   Meta gives you a free test number.
2. From **WhatsApp > API Setup** copy the **Phone number ID** and **WhatsApp Business Account ID**
   into `WHATSAPP_PHONE_NUMBER_ID` and `WHATSAPP_WABA_ID`. Add your own phone as a recipient.
3. Put an access token in `WHATSAPP_ACCESS_TOKEN`. The temporary one lasts 24 hours; for anything
   longer, create a system user token with `whatsapp_business_messaging` permission.
4. From **App settings > Basic** copy the **App secret** into `META_APP_SECRET`. Invent a
   `META_WEBHOOK_VERIFY_TOKEN`. Remove `META_GRAPH_BASE_URL` if you set it for the mock.
5. `pnpm whatsapp:connect`, then `pnpm dev`.
6. Meta must reach your API over HTTPS. Locally, a tunnel works: `cloudflared tunnel --url
http://localhost:4000`. In **WhatsApp > Configuration**, set the callback URL to
   `https://<tunnel>/webhooks/whatsapp` with your verify token, then subscribe to `messages`.
7. Message the test number from your phone. The reply arrives within a few seconds, and the
   `messages` table shows it going sent, delivered, read.

## Checks

```bash
pnpm typecheck
pnpm lint
pnpm test          # unit + integration; migrations run on in-process PGlite, no Docker needed
pnpm build
pnpm format:check
```

CI (`.github/workflows/ci.yml`) runs all of these. A second job migrates and seeds a real
Postgres 16 + pgvector (twice, to prove both are idempotent), then runs
`scripts/e2e-whatsapp.sh`: the built API and worker against real Postgres and Redis, with the
mock Graph API standing in for Meta. It sends one webhook twice and expects one stored message
and one reply that reaches `read`.

## Manual test checklist

### Phase 0

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

### Phase 1

1. `pnpm whatsapp:simulate "Hello"` with the mock running: the mock shows a read receipt with
   typing, then `Namaste! Haazir se jawab.`, then sent, delivered and read statuses.
2. In `psql`: `select direction, body, status from messages order by created_at;` shows the
   inbound message and the reply with status `read`.
3. `pnpm whatsapp:simulate --repeat 2 "Twice"`: one inbound row, one reply.
4. `curl "localhost:4000/webhooks/whatsapp?hub.mode=subscribe&hub.verify_token=<yours>&hub.challenge=42"`
   answers `42`; with a wrong token, 403.
5. `curl -X POST localhost:4000/webhooks/whatsapp -d '{}'`: 401 (no signature), nothing queued.
6. `select access_token_enc from whatsapp_accounts;` starts with `v1.` and never contains the token.
7. Set a contact to opted out (`update contacts set opt_in_status = 'opted_out'`) and message
   again: stored, no reply.

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
