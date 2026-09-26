import { describe, expect, it } from 'vitest'
import { loadCases } from '../cases'

const cases = loadCases()

describe('eval cases', () => {
  it('has at least the 60 coaching cases the spec asks for, with unique ids', () => {
    expect(cases.length).toBeGreaterThanOrEqual(60)
    expect(new Set(cases.map((c) => c.id)).size).toBe(cases.length)
  })

  it('covers every category in spec §11.7', () => {
    const tags = new Set(cases.flatMap((c) => c.tags))
    for (const required of [
      'fees',
      'timings',
      'location',
      'demo',
      'devanagari',
      'spelling',
      'voice',
      'not_in_kb',
      'angry',
      'injection',
      'discount',
      'competitor',
      'opt_out',
    ]) {
      expect(tags, required).toContain(required)
    }
  })

  it('makes every not-in-KB question expect a handoff', () => {
    for (const c of cases.filter((c) => c.tags.includes('not_in_kb'))) {
      expect(c.turns.at(-1)!.expect.handoff, c.id).toBe(true)
    }
  })
})
