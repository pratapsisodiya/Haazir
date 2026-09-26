/**
 * Which script and language a message is in, decided without an LLM. Used to
 * check the reply matches the person (guardrail, spec §11.4), and as the
 * fallback when the router can't be reached.
 */

export type Script = 'devanagari' | 'latin'
export type ReplyLanguage = 'hi' | 'en' | 'hinglish'

const DEVANAGARI = /[ऀ-ॿ]/g
const LATIN = /[A-Za-z]/g

export function detectScript(text: string): Script {
  const deva = text.match(DEVANAGARI)?.length ?? 0
  const latin = text.match(LATIN)?.length ?? 0
  // "RS-CIT की फीस?" is Hindi in Devanagari even though it has Latin letters.
  return deva > 0 && deva >= latin * 0.3 ? 'devanagari' : 'latin'
}

// Common Hindi words as people type them in Roman letters. Two or more of
// these in a Latin-script message means Hinglish, not English.
const HINGLISH_MARKERS = new Set(
  // No words that are also common English ("me", "fees", "batch", "sir").
  (
    'hai hain ho kya kitni kitna kitne kab kaha kahan kaise kaun kyu kyun nahi nahin mujhe mera meri ' +
    'aap aapka aapki apna hum humein bhai bhaiya ji ka ki ke ko se mein bhi ' +
    'chahiye karna karo karein kar batao bataiye bataye milega milegi hoga hogi tha thi abhi kal ' +
    'aaj parso subah shaam raat mahina mahine saal paisa rupaye wala wali haan ' +
    'accha acha theek thik dhanyavaad shukriya namaste kripya'
  ).split(' '),
)

export function detectLanguage(text: string): ReplyLanguage {
  if (detectScript(text) === 'devanagari') return 'hi'
  const words = text.toLowerCase().match(/[a-z]+/g) ?? []
  const hits = words.filter((w) => HINGLISH_MARKERS.has(w)).length
  return hits >= 2 || (words.length <= 3 && hits >= 1) ? 'hinglish' : 'en'
}

export function scriptFor(language: ReplyLanguage): Script {
  return language === 'hi' ? 'devanagari' : 'latin'
}
