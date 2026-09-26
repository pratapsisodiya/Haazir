import { createAnthropic } from '@ai-sdk/anthropic'
import { createAzure } from '@ai-sdk/azure'
import { createGoogle } from '@ai-sdk/google'
import { createOpenAI } from '@ai-sdk/openai'
import type { EmbeddingModel, LanguageModel } from 'ai'

/**
 * Models for the brain, chosen from env (spec §4): the Vercel AI SDK makes
 * the four providers interchangeable, so switching provider or model is a
 * config change, never a code change.
 */
export interface Models {
  /** Routing, classification, extraction: cheap and fast. */
  fast: LanguageModel
  /** Writing the answer. */
  smart: LanguageModel
  embedding: EmbeddingModel
  ids: { fast: string; smart: string; embedding: string }
}

export interface AiEnv {
  LLM_PROVIDER: 'openai' | 'anthropic' | 'google' | 'azure'
  LLM_FAST_MODEL?: string
  LLM_SMART_MODEL?: string
  EMBEDDING_PROVIDER: 'openai' | 'google' | 'azure'
  EMBEDDING_MODEL: string
  OPENAI_API_KEY?: string
  ANTHROPIC_API_KEY?: string
  GOOGLE_API_KEY?: string
  AZURE_OPENAI_ENDPOINT?: string
  AZURE_OPENAI_API_KEY?: string
}

/** The brain can't run: no key or no model configured. The bot hands over instead. */
export class AiNotConfiguredError extends Error {
  constructor(readonly missing: string[]) {
    super(`AI is not configured; set ${missing.join(', ')}`)
    this.name = 'AiNotConfiguredError'
  }
}

type Provider = AiEnv['LLM_PROVIDER']

const KEY_FOR: Record<Provider, (keyof AiEnv)[]> = {
  openai: ['OPENAI_API_KEY'],
  anthropic: ['ANTHROPIC_API_KEY'],
  google: ['GOOGLE_API_KEY'],
  azure: ['AZURE_OPENAI_ENDPOINT', 'AZURE_OPENAI_API_KEY'],
}

function languageModelFactory(provider: Provider, env: AiEnv) {
  switch (provider) {
    case 'openai':
      return createOpenAI({ apiKey: env.OPENAI_API_KEY })
    case 'anthropic':
      return createAnthropic({ apiKey: env.ANTHROPIC_API_KEY })
    case 'google':
      return createGoogle({ apiKey: env.GOOGLE_API_KEY })
    case 'azure':
      return createAzure({ baseURL: env.AZURE_OPENAI_ENDPOINT, apiKey: env.AZURE_OPENAI_API_KEY })
  }
}

/** Which env vars are missing for the configured providers (empty means ready). */
export function missingAiConfig(env: AiEnv): string[] {
  const missing = new Set<string>()
  if (!env.LLM_FAST_MODEL) missing.add('LLM_FAST_MODEL')
  if (!env.LLM_SMART_MODEL) missing.add('LLM_SMART_MODEL')
  for (const key of [...KEY_FOR[env.LLM_PROVIDER], ...KEY_FOR[env.EMBEDDING_PROVIDER]]) {
    if (!env[key]) missing.add(key)
  }
  return [...missing]
}

export function createModels(env: AiEnv): Models {
  const missing = missingAiConfig(env)
  if (missing.length) throw new AiNotConfiguredError(missing)

  const llm = languageModelFactory(env.LLM_PROVIDER, env)
  const emb = languageModelFactory(env.EMBEDDING_PROVIDER, env) as ReturnType<typeof createOpenAI>
  return {
    fast: llm.languageModel(env.LLM_FAST_MODEL!),
    smart: llm.languageModel(env.LLM_SMART_MODEL!),
    embedding: emb.embedding(env.EMBEDDING_MODEL),
    ids: { fast: env.LLM_FAST_MODEL!, smart: env.LLM_SMART_MODEL!, embedding: env.EMBEDDING_MODEL },
  }
}
