import { MockEmbeddingModelV4, MockLanguageModelV4 } from 'ai/test'
import { contacts, conversations, messages, whatsappAccounts, type AnyDatabase } from '@haazir/db'
import { seed } from '@haazir/db/seed'
import { createTestDb } from '@haazir/db/testing'
import type { Models } from '../providers'

const usage = {
  inputTokens: { total: 100, noCache: 100, cacheRead: 0, cacheWrite: 0 },
  outputTokens: { total: 30, text: 30, reasoning: 0 },
}

type Step = { text: string } | { tool: string; input: object }

/** One model response: either final text, or a tool call the SDK will execute. */
function result(step: Step) {
  return 'text' in step
    ? {
        content: [{ type: 'text' as const, text: step.text }],
        finishReason: { unified: 'stop' as const, raw: 'stop' },
        usage,
        warnings: [],
      }
    : {
        content: [
          {
            type: 'tool-call' as const,
            toolCallId: `call-${step.tool}`,
            toolName: step.tool,
            input: JSON.stringify(step.input),
          },
        ],
        finishReason: { unified: 'tool-calls' as const, raw: 'tool_calls' },
        usage,
        warnings: [],
      }
}

/** A model that answers with these steps, in order, then repeats the last. */
export function scripted(...steps: Step[]) {
  let i = 0
  return new MockLanguageModelV4({
    modelId: 'mock-smart',
    doGenerate: async () => result(steps[Math.min(i++, steps.length - 1)]!),
  })
}

export function router(verdict: object) {
  return new MockLanguageModelV4({
    modelId: 'mock-fast',
    doGenerate: async () =>
      result({ text: JSON.stringify({ entities: {}, confidence: 0.9, ...verdict }) }),
  })
}

/**
 * A deterministic stand-in for a real embedding model: words hashed into 1536
 * dimensions. Texts sharing words get similar vectors, which is all the
 * retrieval SQL needs to be exercised for real on pgvector.
 */
export function hashEmbedding() {
  const embedOne = (text: string) => {
    const v = new Array(1536).fill(0)
    for (const w of text.toLowerCase().match(/[\p{L}\p{M}\p{N}]+/gu) ?? []) {
      let h = 0
      for (const ch of w) h = (h * 31 + ch.codePointAt(0)!) >>> 0
      v[h % 1536] += 1
    }
    const norm = Math.hypot(...v) || 1
    return v.map((x) => x / norm)
  }
  return new MockEmbeddingModelV4({
    modelId: 'mock-embed',
    doEmbed: async ({ values }) => ({ embeddings: values.map(embedOne), warnings: [] }),
  })
}

export function models(fast: MockLanguageModelV4, smart: MockLanguageModelV4): Models {
  return {
    fast,
    smart,
    embedding: hashEmbedding(),
    ids: { fast: 'mock-fast', smart: 'mock-smart', embedding: 'mock-embed' },
  }
}

export async function createFixture() {
  const { db, close } = await createTestDb()
  const { org } = await seed(db)
  const [account] = await db
    .insert(whatsappAccounts)
    .values({ orgId: org.id, wabaId: 'w', phoneNumberId: '1065', accessTokenEnc: 'v1.a.b.c' })
    .returning()
  const [contact] = await db
    .insert(contacts)
    .values({ orgId: org.id, waId: '919812345678', profileName: 'Anil' })
    .returning()
  const [conversation] = await db
    .insert(conversations)
    .values({
      orgId: org.id,
      contactId: contact!.id,
      whatsappAccountId: account!.id,
      serviceWindowExpiresAt: new Date(Date.now() + 86_400_000),
    })
    .returning()

  let n = 0
  async function inbound(body: string | null, extra: Partial<typeof messages.$inferInsert> = {}) {
    const [m] = await db
      .insert(messages)
      .values({
        orgId: org.id,
        conversationId: conversation!.id,
        direction: 'in',
        waMessageId: `wamid.T${++n}`,
        type: 'text',
        body,
        ...extra,
      })
      .returning()
    return { orgId: org.id, conversationId: conversation!.id, messageId: m!.id }
  }

  return {
    db: db as AnyDatabase,
    org,
    contact: contact!,
    conversation: conversation!,
    inbound,
    close,
  }
}
