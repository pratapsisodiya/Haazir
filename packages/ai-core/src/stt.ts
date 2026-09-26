import { createOpenAI } from '@ai-sdk/openai'
import { transcribe } from 'ai'

/**
 * Speech to text for voice notes (spec §4). Two providers behind one
 * interface; which is better for Rajasthani-accented Hindi is to be decided
 * on 20 real voice notes, so switching is one env var.
 */
export interface Transcriber {
  id: string
  transcribe(audio: Uint8Array, mimeType: string): Promise<{ text: string; language?: string }>
}

export interface SttEnv {
  STT_PROVIDER: 'openai' | 'sarvam'
  STT_MODEL?: string
  OPENAI_API_KEY?: string
  SARVAM_API_KEY?: string
}

// Names people say that a generic model misspells. Passed as a hint, not a rule.
const DOMAIN_HINT =
  'Hindi, Hinglish, English. RS-CIT, Tally Prime, GST, Python, Web Development, fees, batch, demo class, admission, Sikar.'

export function createTranscriber(
  env: SttEnv,
  fetchImpl: typeof fetch = globalThis.fetch,
): Transcriber | null {
  if (env.STT_PROVIDER === 'sarvam') {
    if (!env.SARVAM_API_KEY) return null
    return sarvam(env.SARVAM_API_KEY, env.STT_MODEL ?? 'saaras:v3', fetchImpl)
  }
  if (!env.OPENAI_API_KEY) return null
  const model = createOpenAI({ apiKey: env.OPENAI_API_KEY }).transcription(
    env.STT_MODEL ?? 'gpt-4o-mini-transcribe',
  )
  return {
    id: `openai:${env.STT_MODEL ?? 'gpt-4o-mini-transcribe'}`,
    async transcribe(audio) {
      const result = await transcribe({
        model,
        audio,
        providerOptions: { openai: { prompt: DOMAIN_HINT } },
        maxRetries: 1,
        abortSignal: AbortSignal.timeout(30_000),
      })
      return { text: result.text.trim(), language: result.language }
    },
  }
}

/**
 * Sarvam's REST API, per its official SDK (checked 2026-09, their docs site
 * was unreachable from the build machine): POST /speech-to-text with the key
 * in `api-subscription-key`; `saaras:v3` in "transcribe" mode; language
 * auto-detected. Returns { transcript, language_code }.
 */
function sarvam(apiKey: string, model: string, fetchImpl: typeof fetch): Transcriber {
  return {
    id: `sarvam:${model}`,
    async transcribe(audio, mimeType) {
      const form = new FormData()
      const ext = mimeType.includes('ogg') ? 'ogg' : mimeType.includes('mpeg') ? 'mp3' : 'wav'
      form.append('file', new Blob([audio], { type: mimeType.split(';')[0] }), `voice.${ext}`)
      form.append('model', model)
      form.append('language_code', 'unknown')
      if (model.startsWith('saaras:v3')) form.append('mode', 'transcribe')
      form.append('prompt', DOMAIN_HINT)
      const res = await fetchImpl('https://api.sarvam.ai/speech-to-text', {
        method: 'POST',
        headers: { 'api-subscription-key': apiKey },
        body: form,
        signal: AbortSignal.timeout(30_000),
      })
      if (!res.ok)
        throw new Error(`Sarvam speech-to-text ${res.status}: ${(await res.text()).slice(0, 200)}`)
      const data = (await res.json()) as { transcript?: string; language_code?: string }
      return { text: (data.transcript ?? '').trim(), language: data.language_code }
    },
  }
}
