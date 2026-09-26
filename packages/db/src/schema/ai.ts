import { sql } from 'drizzle-orm'
import {
  boolean,
  customType,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  real,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  vector,
} from 'drizzle-orm/pg-core'
import { id, timestamps } from './columns'
import { organizations } from './core'
import { conversations, messages } from './whatsapp'

/** Embedding width: OpenAI text-embedding-3-small (spec §4). Changing it needs a migration and a re-embed. */
export const EMBEDDING_DIMENSIONS = 1536

const tsvector = customType<{ data: string }>({ dataType: () => 'tsvector' })

export const botToneEnum = pgEnum('bot_tone', ['warm', 'formal'])
export const knowledgeTypeEnum = pgEnum('knowledge_type', ['faq', 'text', 'pdf', 'url'])
export const knowledgeStatusEnum = pgEnum('knowledge_status', [
  'pending',
  'processing',
  'ready',
  'failed',
])

/** Text in each language the bot speaks. Missing keys fall back to hinglish. */
export type Localised = Partial<Record<'hi' | 'en' | 'hinglish', string>>

/** How one org's bot behaves (spec §8, §16.11). One row per org. */
export const botConfigs = pgTable('bot_configs', {
  id: id(),
  orgId: uuid()
    .notNull()
    .unique()
    .references(() => organizations.id, { onDelete: 'cascade' }),
  personaName: text().notNull().default('Haazir Sahayak'),
  tone: botToneEnum().notNull().default('warm'),
  languages: text()
    .array()
    .notNull()
    .default(sql`'{hi,en,hinglish}'::text[]`),
  greeting: jsonb().$type<Localised>().notNull().default({}),
  mainMenu: jsonb().$type<{ id: string; title: Localised }[]>().notNull().default([]),
  fallbackMessage: jsonb().$type<Localised>().notNull().default({}),
  handoffKeywords: text()
    .array()
    .notNull()
    .default(sql`'{}'::text[]`),
  optoutKeywords: text()
    .array()
    .notNull()
    .default(sql`'{}'::text[]`),
  afterHoursMessage: jsonb().$type<Localised>().notNull().default({}),
  /** Other institutes the bot must never name (guardrail, spec §11.4). */
  competitorNames: text()
    .array()
    .notNull()
    .default(sql`'{}'::text[]`),
  maxAiRepliesPerContactHour: integer().notNull().default(20),
  privacyNoticeUrl: text(),
  enabled: boolean().notNull().default(true),
  ...timestamps,
})

/** Something the bot was taught from: an FAQ set, pasted text, a PDF, a website. */
export const knowledgeSources = pgTable(
  'knowledge_sources',
  {
    id: id(),
    orgId: uuid()
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),
    type: knowledgeTypeEnum().notNull(),
    title: text().notNull(),
    fileKey: text(),
    url: text(),
    /** The pasted text itself, for `text` sources. */
    textContent: text(),
    status: knowledgeStatusEnum().notNull().default('pending'),
    error: text(),
    chunkCount: integer().notNull().default(0),
    ...timestamps,
  },
  (t) => [index('knowledge_sources_org_id_idx').on(t.orgId)],
)

export const knowledgeFaqs = pgTable(
  'knowledge_faqs',
  {
    id: id(),
    orgId: uuid()
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),
    sourceId: uuid()
      .notNull()
      .references(() => knowledgeSources.id, { onDelete: 'cascade' }),
    question: text().notNull(),
    answer: text().notNull(),
    language: text(),
    ...timestamps,
  },
  (t) => [index('knowledge_faqs_org_id_idx').on(t.orgId)],
)

/**
 * Retrieval units. Searched two ways at once (spec §11.1): by meaning
 * (pgvector, cosine) and by words (Postgres full-text, 'simple' config so
 * Hinglish and Devanagari aren't mangled by an English stemmer).
 */
export const knowledgeChunks = pgTable(
  'knowledge_chunks',
  {
    id: id(),
    orgId: uuid()
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),
    sourceId: uuid()
      .notNull()
      .references(() => knowledgeSources.id, { onDelete: 'cascade' }),
    content: text().notNull(),
    embedding: vector({ dimensions: EMBEDDING_DIMENSIONS }).notNull(),
    tsv: tsvector().generatedAlwaysAs(sql`to_tsvector('simple', content)`),
    metadata: jsonb()
      .$type<{ heading?: string; page?: number; url?: string }>()
      .notNull()
      .default({}),
    ...timestamps,
  },
  (t) => [
    index('knowledge_chunks_org_id_idx').on(t.orgId),
    index('knowledge_chunks_embedding_idx').using('hnsw', t.embedding.op('vector_cosine_ops')),
    index('knowledge_chunks_tsv_idx').using('gin', t.tsv),
  ],
)

/** One row per bot reply: what it understood, used, decided and cost (spec §8). */
export const aiTraces = pgTable(
  'ai_traces',
  {
    id: id(),
    orgId: uuid()
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),
    conversationId: uuid().references(() => conversations.id, { onDelete: 'cascade' }),
    messageId: uuid().references(() => messages.id, { onDelete: 'set null' }),
    intent: text(),
    language: text(),
    confidence: real(),
    retrievedChunkIds: uuid()
      .array()
      .notNull()
      .default(sql`'{}'::uuid[]`),
    toolCalls: jsonb()
      .$type<{ name: string; input: unknown; output?: unknown }[]>()
      .notNull()
      .default([]),
    model: text(),
    promptVersion: text(),
    inputTokens: integer(),
    outputTokens: integer(),
    latencyMs: integer(),
    handedOff: boolean().notNull().default(false),
    handoffReason: text(),
    guardrailFlags: jsonb().$type<string[]>().notNull().default([]),
    costUsdMicros: integer(),
    ...timestamps,
  },
  (t) => [index('ai_traces_org_created_idx').on(t.orgId, t.createdAt)],
)

/** Questions the bot couldn't answer, counted, for the "teach your bot" screen (spec §12). */
export const unansweredQuestions = pgTable(
  'unanswered_questions',
  {
    id: id(),
    orgId: uuid()
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),
    question: text().notNull(),
    /** Lower-cased, punctuation-stripped: repeats of the same question are counted together. */
    normalized: text().notNull(),
    count: integer().notNull().default(1),
    lastSeenAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    resolved: boolean().notNull().default(false),
    ...timestamps,
  },
  (t) => [uniqueIndex('unanswered_org_normalized_unique').on(t.orgId, t.normalized)],
)
