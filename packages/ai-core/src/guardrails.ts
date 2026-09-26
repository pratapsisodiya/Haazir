import { detectScript, type Script } from './language'

/**
 * Checks every reply passes before it's sent (spec §11.4). Pure functions:
 * the pipeline regenerates once with the violations explained, then hands
 * over if the second attempt fails too.
 */

export const MAX_REPLY_CHARS = 600

const DEVANAGARI_DIGITS = '०१२३४५६७८९'
const toAsciiDigits = (s: string) =>
  s.replace(/[०-९]/g, (d) => String(DEVANAGARI_DIGITS.indexOf(d)))

/**
 * The numbers in a text, normalised so "₹4,500", "4500" and "४५००" compare
 * equal and "08:00" matches "8". List markers ("1." at a line start) are not
 * numbers the bot is asserting, so they're skipped.
 */
export function extractNumbers(text: string): string[] {
  const cleaned = toAsciiDigits(text)
    .replace(/^\s*\d{1,2}[.)]\s/gm, ' ')
    .replace(/(\d),(?=\d)/g, '$1')
  return [
    ...new Set((cleaned.match(/\d+(?:\.\d+)?/g) ?? []).map((n) => n.replace(/^0+(?=\d)/, ''))),
  ]
}

/**
 * The spec's most important rule: every number in a reply (fees, dates,
 * seats, timings) must appear in something the bot was given: tool results,
 * retrieved documents, the prompt's hours and time, or the person's own
 * message. Anything else is invented.
 */
export function checkNumbers(reply: string, sources: string[]): string[] {
  const allowed = new Set(sources.flatMap(extractNumbers))
  return extractNumbers(reply).filter((n) => !allowed.has(n))
}

/** The reply must be in the person's script (Devanagari for Devanagari, Roman for Hinglish and English). */
export function checkScript(reply: string, expected: Script): boolean {
  const letters = reply.replace(/[^\p{L}]/gu, '')
  if (letters.length < 8) return true // "OK ji 👍", names, numbers: nothing to judge
  return detectScript(reply) === expected
}

/** Hard cut at the last sentence end before the limit, never mid-word. */
export function enforceLength(reply: string, max = MAX_REPLY_CHARS): string {
  const text = reply.trim()
  if (text.length <= max) return text
  const slice = text.slice(0, max)
  const end = Math.max(...['।', '. ', '! ', '? ', '\n'].map((p) => slice.lastIndexOf(p)))
  if (end > max * 0.4) return slice.slice(0, end + 1).trim()
  return `${slice.slice(0, slice.lastIndexOf(' '))}…`
}

// Promises the institute can't make. Checked only when not negated, so
// "hum naukri ki guarantee nahi dete" (the honest answer) is fine.
const GUARANTEES = [
  /100\s?%\s*(job|placement|selection|naukri|result|pass)/i,
  /(job|placement|naukri|selection|result)\s*(ki\s*)?(guarantee|guaranteed|pakk[ai])/i,
  /(guaranteed|pakk[ai])\s*(job|placement|naukri|selection)/i,
  /(नौकरी|प्लेसमेंट|सिलेक्शन)\s*(की\s*)?(गारंटी|पक्की)/,
]
const NEGATION = /\b(nahi|nahin|na|not|no|never|don't|do not)\b|नहीं|ना\b/i

export function checkForbidden(reply: string, competitors: string[]): string[] {
  const found: string[] = []
  for (const name of competitors) {
    if (name.trim() && reply.toLowerCase().includes(name.toLowerCase()))
      found.push(`competitor:${name}`)
  }
  for (const sentence of reply.split(/(?<=[.!?।\n])/)) {
    if (GUARANTEES.some((re) => re.test(sentence)) && !NEGATION.test(sentence)) {
      found.push(`guarantee:${sentence.trim().slice(0, 60)}`)
    }
  }
  return found
}

const INJECTION = [
  /ignore (all |the )?(previous|above|earlier) (instructions|rules|messages)/i,
  /system prompt/i,
  /(reveal|show|print) (your|the) (prompt|instructions|rules)/i,
  /you are now|act as|pretend (to be|you are)|jailbreak|developer mode/i,
  /pichl[ae] (instructions|rules) (bhool|ignore)/i,
]

/** Flags attempts to rewrite the bot's rules. The bot keeps its rules and answers normally. */
export function looksLikeInjection(text: string): boolean {
  return INJECTION.some((re) => re.test(text))
}

export interface GuardrailInput {
  reply: string
  sources: string[]
  expectedScript: Script
  competitors: string[]
}

export interface GuardrailResult {
  ok: boolean
  reply: string
  violations: string[]
  inventedNumbers: string[]
}

export function runGuardrails(input: GuardrailInput): GuardrailResult {
  const reply = enforceLength(input.reply)
  const inventedNumbers = checkNumbers(reply, input.sources)
  const violations = [
    ...inventedNumbers.map((n) => `invented_number:${n}`),
    ...(checkScript(reply, input.expectedScript)
      ? []
      : [`wrong_script:expected_${input.expectedScript}`]),
    ...checkForbidden(reply, input.competitors),
  ]
  return { ok: violations.length === 0, reply, violations, inventedNumbers }
}

/** What to tell the model when regenerating, one line per problem. */
export function explainViolations(violations: string[]): string {
  return violations
    .map((v) => {
      if (v.startsWith('invented_number:'))
        return `The number ${v.split(':')[1]} is not in the tool results or context. Use only numbers from them, or say the team will confirm.`
      if (v.startsWith('wrong_script:'))
        return v.endsWith('devanagari')
          ? 'Reply in Hindi using Devanagari script, as the person wrote.'
          : 'Reply in Roman letters (Hinglish or English), as the person wrote.'
      if (v.startsWith('competitor:')) return 'Never mention other institutes.'
      if (v.startsWith('guarantee:')) return 'Never promise jobs, selection, marks or results.'
      return v
    })
    .join('\n')
}
