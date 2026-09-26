/**
 * pnpm evals: runs the coaching conversations in evals/cases against the
 * configured models (spec §11.7). Prints a score table; exits 1 if the pass
 * rate is under 85% or any reply contains an invented number.
 *
 *   pnpm evals                     all cases
 *   pnpm evals --only fees         cases whose id or tag contains "fees"
 *   pnpm evals --require-key       fail (instead of skipping) when no AI key is set; for CI
 */
import { mkdirSync, writeFileSync } from 'node:fs'
import { parseArgs } from 'node:util'
import { createModels, missingAiConfig } from '@haazir/ai-core'
import { loadEnv } from '@haazir/shared/env'
import { loadCases } from './cases'
import { createFixture, runCases } from './runner'
import { formatReport, summarise } from './score'

const { values } = parseArgs({
  options: {
    only: { type: 'string' },
    concurrency: { type: 'string', default: '4' },
    'require-key': { type: 'boolean' },
  },
})

const env = loadEnv()
const missing = missingAiConfig(env)
if (missing.length) {
  const message = `Evals skipped: AI is not configured (missing ${missing.join(', ')}).`
  if (values['require-key']) {
    console.error(message)
    process.exit(1)
  }
  console.log(message)
  process.exit(0)
}

const models = createModels(env)
const all = loadCases()
const cases = values.only
  ? all.filter((c) => c.id.includes(values.only!) || c.tags.some((t) => t.includes(values.only!)))
  : all

console.log(
  `Running ${cases.length} cases with ${env.LLM_PROVIDER} (${models.ids.fast} / ${models.ids.smart})…`,
)
const fixture = await createFixture(models)
const started = Date.now()
const results = await runCases(fixture, models, cases, {
  concurrency: Number(values.concurrency),
  onResult: (r) => process.stdout.write(r.passed ? '.' : 'F'),
})
await fixture.close()

const summary = summarise(results)
console.log(formatReport(results, summary))
console.log(`\n${Math.round((Date.now() - started) / 1000)}s`)

mkdirSync(new URL('../results', import.meta.url), { recursive: true })
writeFileSync(
  new URL('../results/latest.json', import.meta.url),
  JSON.stringify({ at: new Date().toISOString(), models: models.ids, summary, results }, null, 2),
)
process.exit(summary.ok ? 0 : 1)
