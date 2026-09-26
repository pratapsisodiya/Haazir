import { extractNumbers, type Decision } from '@haazir/ai-core'
import type { EvalCase, Expectation } from './cases'

/** "₹4,500" contains "4500"; "RS-CIT" contains "rs-cit"; Devanagari digits count. */
export function normalise(s: string): string {
  return s
    .replace(/[०-९]/g, (d) => String('०१२३४५६७८९'.indexOf(d)))
    .replace(/(\d),(?=\d)/g, '$1')
    .toLowerCase()
}

const MAX_CHARS = 600

export interface TurnResult {
  user: string
  reply: string
  kind: Decision['kind']
  failures: string[]
  /** Numbers in the reply that appear nowhere in the institute's data. */
  inventedNumbers: string[]
}

export function evaluateTurn(
  expect: Expectation,
  decision: Decision,
  userText: string,
  factsCorpus: string,
): TurnResult {
  const reply = 'content' in decision ? decision.content.body : ''
  const trace = 'trace' in decision ? decision.trace : null
  const text = normalise(reply)
  const failures: string[] = []

  const intents = expect.intent === undefined ? null : [expect.intent].flat()
  if (intents && !intents.includes(trace?.intent as never)) {
    failures.push(`intent: wanted ${intents.join('|')}, got ${trace?.intent ?? 'none'}`)
  }
  if (expect.language && trace?.language !== expect.language) {
    failures.push(`language: wanted ${expect.language}, got ${trace?.language ?? 'none'}`)
  }
  if (expect.script && reply) {
    const deva = (reply.match(/[ऀ-ॿ]/g) ?? []).length
    const latin = (reply.match(/[A-Za-z]/g) ?? []).length
    const got = deva > 0 && deva >= latin * 0.3 ? 'devanagari' : 'latin'
    if (got !== expect.script) failures.push(`script: wanted ${expect.script}, got ${got}`)
  }
  if (expect.kind && decision.kind !== expect.kind) {
    failures.push(`kind: wanted ${expect.kind}, got ${decision.kind}`)
  }
  if (expect.handoff !== undefined && (decision.kind === 'handoff') !== expect.handoff) {
    failures.push(
      expect.handoff
        ? `handoff: wanted a handoff, got ${decision.kind}`
        : `handoff: unexpected handoff (${decision.kind === 'handoff' ? decision.reason : ''})`,
    )
  }
  if (
    expect.handoff_reason &&
    (decision.kind !== 'handoff' || decision.reason !== expect.handoff_reason)
  ) {
    failures.push(`handoff_reason: wanted ${expect.handoff_reason}`)
  }
  for (const needle of expect.must_include ?? []) {
    if (!text.includes(normalise(needle))) failures.push(`must_include: "${needle}"`)
  }
  if (
    expect.must_include_any?.length &&
    !expect.must_include_any.some((n) => text.includes(normalise(n)))
  ) {
    failures.push(
      `must_include_any: one of ${expect.must_include_any.map((n) => `"${n}"`).join(', ')}`,
    )
  }
  for (const needle of expect.must_not_include ?? []) {
    if (text.includes(normalise(needle))) failures.push(`must_not_include: "${needle}"`)
  }
  if (reply.length > (expect.max_chars ?? MAX_CHARS)) {
    failures.push(`length: ${reply.length} > ${expect.max_chars ?? MAX_CHARS}`)
  }

  // Independent of the bot's own guardrail: every number sent must exist in
  // the institute's data or the person's message. Any miss fails the run.
  const allowed = new Set([...extractNumbers(factsCorpus), ...extractNumbers(userText)])
  const inventedNumbers = extractNumbers(reply).filter((n) => !allowed.has(n))
  for (const n of inventedNumbers) failures.push(`invented number: ${n}`)

  return { user: userText, reply, kind: decision.kind, failures, inventedNumbers }
}

export interface CaseResult {
  case: EvalCase
  turns: TurnResult[]
  passed: boolean
  error?: string
}

export interface Summary {
  total: number
  passed: number
  passRate: number
  inventedNumberFailures: number
  byTag: { tag: string; total: number; passed: number }[]
  ok: boolean
}

export const PASS_RATE_REQUIRED = 0.85

export function summarise(results: CaseResult[]): Summary {
  const passed = results.filter((r) => r.passed).length
  const tags = new Map<string, { total: number; passed: number }>()
  for (const r of results) {
    for (const tag of r.case.tags) {
      const t = tags.get(tag) ?? { total: 0, passed: 0 }
      t.total++
      if (r.passed) t.passed++
      tags.set(tag, t)
    }
  }
  const inventedNumberFailures = results.filter((r) =>
    r.turns.some((t) => t.inventedNumbers.length),
  ).length
  const passRate = results.length ? passed / results.length : 0
  return {
    total: results.length,
    passed,
    passRate,
    inventedNumberFailures,
    byTag: [...tags.entries()]
      .map(([tag, t]) => ({ tag, ...t }))
      .sort((a, b) => a.tag.localeCompare(b.tag)),
    ok: passRate >= PASS_RATE_REQUIRED && inventedNumberFailures === 0,
  }
}

export function formatReport(results: CaseResult[], summary: Summary): string {
  const pct = (n: number, d: number) => (d ? `${Math.round((n / d) * 100)}%` : '-')
  const lines = ['', 'Category            Passed   Rate', '─'.repeat(36)]
  for (const t of summary.byTag) {
    lines.push(
      `${t.tag.padEnd(18)}  ${`${t.passed}/${t.total}`.padStart(6)}  ${pct(t.passed, t.total).padStart(5)}`,
    )
  }
  lines.push('─'.repeat(36))
  lines.push(
    `${'TOTAL'.padEnd(18)}  ${`${summary.passed}/${summary.total}`.padStart(6)}  ${pct(summary.passed, summary.total).padStart(5)}`,
  )
  lines.push(`Invented-number failures: ${summary.inventedNumberFailures}`)

  const failed = results.filter((r) => !r.passed)
  if (failed.length) {
    lines.push('', 'Failures:')
    for (const r of failed) {
      lines.push(`  ✗ ${r.case.id}${r.error ? `  (error: ${r.error})` : ''}`)
      for (const t of r.turns.filter((t) => t.failures.length)) {
        lines.push(`      user:  ${t.user}`)
        lines.push(`      bot:   ${t.reply.replace(/\s+/g, ' ').slice(0, 160) || `(${t.kind})`}`)
        for (const f of t.failures) lines.push(`      - ${f}`)
      }
    }
  }
  lines.push(
    '',
    summary.ok
      ? `PASS: ${pct(summary.passed, summary.total)} ≥ ${PASS_RATE_REQUIRED * 100}% and no invented numbers.`
      : `FAIL: need ≥ ${PASS_RATE_REQUIRED * 100}% and zero invented numbers.`,
  )
  return lines.join('\n')
}
