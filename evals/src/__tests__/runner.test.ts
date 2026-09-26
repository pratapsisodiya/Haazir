import { MockEmbeddingModelV4, MockLanguageModelV4 } from 'ai/test'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import type { Models } from '@haazir/ai-core'
import type { EvalCase } from '../cases'
import { createFixture, runCases } from '../runner'
import { formatReport, summarise } from '../score'

const usage = {
  inputTokens: { total: 1, noCache: 1, cacheRead: 0, cacheWrite: 0 },
  outputTokens: { total: 1, text: 1, reasoning: 0 },
}
const text = (t: string) => ({
  content: [{ type: 'text' as const, text: t }],
  finishReason: { unified: 'stop' as const, raw: 'stop' },
  usage,
  warnings: [],
})
const toolCall = (name: string, input: object) => ({
  content: [
    { type: 'tool-call' as const, toolCallId: 'c', toolName: name, input: JSON.stringify(input) },
  ],
  finishReason: { unified: 'tool-calls' as const, raw: 'tool_calls' },
  usage,
  warnings: [],
})

/**
 * A fake brain that behaves by question: looks up RS-CIT fees properly, hands
 * hostel questions over, and invents a Tally fee (which must be caught).
 */
function fakeModels(): Models {
  const lastUser = (prompt: unknown) => {
    const msgs = (prompt as { role: string; content: { type: string; text?: string }[] }[]).filter(
      (m) => m.role === 'user',
    )
    return JSON.stringify(msgs.at(-1)?.content ?? '').toLowerCase()
  }
  const hasToolResult = (prompt: unknown) => JSON.stringify(prompt).includes('"tool-result"')
  return {
    fast: new MockLanguageModelV4({
      doGenerate: async ({ prompt }) => {
        const q = lastUser(prompt)
        const intent = q.includes('hostel') ? 'other' : 'fee_query'
        return text(
          JSON.stringify({
            language: 'hinglish',
            script: 'latin',
            intent,
            entities: {},
            confidence: 0.9,
          }),
        )
      },
    }),
    smart: new MockLanguageModelV4({
      doGenerate: async ({ prompt }) => {
        const q = lastUser(prompt)
        if (q.includes('hostel')) {
          return hasToolResult(prompt)
            ? text('Team se confirm karke batate hain.')
            : toolCall('handoff_to_human', { reason: 'missing_info', summary: 'Hostel' })
        }
        if (q.includes('tally')) return text('Tally ki fees ₹7,999 hai.') // invented, twice: handed over
        return hasToolResult(prompt)
          ? text('*RS-CIT* ki fees *₹4,500* hai.')
          : toolCall('get_course_details', { course: 'rscit' })
      },
    }),
    embedding: new MockEmbeddingModelV4({
      doEmbed: async ({ values }) => ({
        embeddings: values.map(() => new Array(1536).fill(0.02)),
        warnings: [],
      }),
    }),
    ids: { fast: 'fake', smart: 'fake', embedding: 'fake' },
  }
}

const cases: EvalCase[] = [
  {
    id: 'fee',
    org_fixture: 'shiksha-sikar',
    tags: ['fees'],
    turns: [
      {
        user: 'RSCIT ki fees kitni hai',
        type: 'text',
        expect: { intent: 'fee_query', must_include: ['4500'], handoff: false },
      },
    ],
  },
  {
    id: 'hostel',
    org_fixture: 'shiksha-sikar',
    tags: ['not_in_kb'],
    turns: [{ user: 'hostel hai kya?', type: 'text', expect: { handoff: true } }],
  },
  {
    id: 'stop',
    org_fixture: 'shiksha-sikar',
    tags: ['opt_out'],
    turns: [{ user: 'STOP', type: 'text', expect: { kind: 'optout' } }],
  },
  {
    id: 'tally',
    org_fixture: 'shiksha-sikar',
    tags: ['fees'],
    turns: [
      { user: 'tally fees?', type: 'text', expect: { must_include: ['8500'], handoff: false } },
    ],
  },
]

let fixture: Awaited<ReturnType<typeof createFixture>>
beforeAll(async () => {
  fixture = await createFixture(fakeModels())
})
afterAll(() => fixture.close())

describe('eval runner', () => {
  it('runs cases end to end and scores them', async () => {
    const results = await runCases(fixture, fakeModels(), cases, { concurrency: 2 })
    expect(results.map((r) => [r.case.id, r.passed])).toEqual([
      ['fee', true],
      ['hostel', true],
      ['stop', true],
      ['tally', false], // the guardrail caught ₹7,999 and handed over: fails "no handoff" and "8500"
    ])
    const summary = summarise(results)
    expect(summary).toMatchObject({ total: 4, passed: 3, inventedNumberFailures: 0 })
    expect(summary.ok).toBe(false) // 75% < 85%
    expect(formatReport(results, summary)).toContain('✗ tally')
  })

  it("builds a facts corpus from the institute's data", () => {
    expect(fixture.factsCorpus).toContain('₹4,500')
    expect(fixture.factsCorpus).toContain('Station Road')
  })
})
