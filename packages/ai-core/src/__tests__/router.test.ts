import { MockLanguageModelV4 } from 'ai/test'
import { describe, expect, it } from 'vitest'
import { missingAiConfig } from '../providers'
import { route } from '../router'

const usage = {
  inputTokens: { total: 50, noCache: 50, cacheRead: 0, cacheWrite: 0 },
  outputTokens: { total: 20, text: 20, reasoning: 0 },
}
const answer = (json: object) =>
  new MockLanguageModelV4({
    doGenerate: {
      content: [{ type: 'text', text: JSON.stringify(json) }],
      finishReason: { unified: 'stop', raw: 'stop' },
      usage,
      warnings: [],
    },
  })

describe('route', () => {
  it('returns the validated verdict, with the script taken from the characters', async () => {
    const model = answer({
      language: 'hinglish',
      script: 'latin',
      intent: 'fee_query',
      entities: { course: 'rscit' },
      confidence: 0.94,
    })
    const result = await route(model, [], 'RS-CIT की फीस?')
    expect(result).toMatchObject({
      intent: 'fee_query',
      script: 'devanagari',
      language: 'hi',
      entities: { course: 'rscit' },
      fromModel: true,
      inputTokens: 50,
    })
  })

  it('falls back to text heuristics when the model returns junk', async () => {
    const model = answer({ intent: 'buy_pizza' })
    const result = await route(model, [], 'tally ka batch kab se hai')
    expect(result).toEqual({
      language: 'hinglish',
      script: 'latin',
      intent: 'other',
      entities: {},
      confidence: 0,
      fromModel: false,
    })
  })

  it('falls back when the provider errors', async () => {
    const model = new MockLanguageModelV4({
      doGenerate: async () => {
        throw new Error('529 overloaded')
      },
    })
    expect((await route(model, [], 'Hello')).fromModel).toBe(false)
  })
})

describe('missingAiConfig', () => {
  const base = {
    LLM_PROVIDER: 'anthropic' as const,
    EMBEDDING_PROVIDER: 'openai' as const,
    EMBEDDING_MODEL: 'e',
  }
  it('names exactly what is missing, including the embedding key for Anthropic', () => {
    expect(missingAiConfig(base)).toEqual([
      'LLM_FAST_MODEL',
      'LLM_SMART_MODEL',
      'ANTHROPIC_API_KEY',
      'OPENAI_API_KEY',
    ])
    expect(
      missingAiConfig({
        ...base,
        LLM_FAST_MODEL: 'f',
        LLM_SMART_MODEL: 's',
        ANTHROPIC_API_KEY: 'k',
        OPENAI_API_KEY: 'k',
      }),
    ).toEqual([])
  })
})
