# Progress

Three lines per phase (spec, "How to use this file").

## Phase 0: Foundation (done)

- pnpm + Turborepo monorepo (api, worker, dashboard, site; shared, db), strict TS, ESLint + Prettier, CI with a real Postgres/Redis job. docker-compose for Postgres 16 + pgvector, Redis 7 and Mailpit.
- zod-validated env, pino logging, `/health` + `/ready` (Postgres, Redis, worker heartbeat), graceful shutdown. Drizzle with the first migration (plans, organizations, users, memberships, super_admins) and an idempotent seed (3 plans, Shiksha Computer Institute, owner, staff, super admin).
- Dashboard: bahi-khata tokens (light/dark), self-hosted Anek Devanagari + Mukta, app shell (bottom tabs + "Aur" sheet on phones, sidebar on desktop), Hindi/English, and `/dev/components` with Button, Input, Card, LedgerCard, StatusPill and EmptyState. Contrast is tested in CI.

## Phase 1: WhatsApp echo (done; not yet tried against a real Meta number)

- Webhook verify + HMAC signature check on the raw body, inbound queue, contacts/conversations/messages/whatsapp_accounts tables (token AES-256-GCM encrypted), BSUID-aware contacts, delivery statuses that only move forward, media copied to storage (R2/MinIO or local disk). Graph API pinned to v26.0.
- Outbound gate (opt-out, 24h window, content limits) writes the row before Meta is called; the outbound worker retries Meta outages and records policy errors as failed. Duplicate deliveries store one row and send one reply, even if Redis loses its dedupe keys or a job crashes mid-way.
- 23 integration tests (PGlite + MSW) plus parser/signature/window unit tests; CI runs the full loop end to end with a mock Graph API. `pnpm whatsapp:mock` / `whatsapp:simulate` let anyone try it locally.

## Next: Phase 2, AI brain

Needs from Pratap: an LLM provider and key (OpenAI, Anthropic, Google or Azure OpenAI), 20 real Hindi voice notes to choose the speech-to-text provider, and the 60 coaching conversations for the eval set (or approval to draft them from the demo institute).
