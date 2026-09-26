import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { courses, organizations, type AnyDatabase } from '@haazir/db'
import { seed } from '@haazir/db/seed'
import { createTestDb } from '@haazir/db/testing'
import { formatDays, formatTime } from '../facts'
import { createTools, matchCourse, type ToolContext } from '../tools'

let db: AnyDatabase
let close: () => Promise<void>
let orgId: string

beforeAll(async () => {
  ;({ db, close } = await createTestDb())
  orgId = (await seed(db)).org.id
})
afterAll(() => close())

const ctxFor = (org = orgId): ToolContext => ({
  db,
  orgId: org,
  today: new Date().toISOString().slice(0, 10),
  facts: [],
  toolCalls: [],
  handoff: null,
})

// Tools run through the SDK in production; here we call execute directly.
const run = async (ctx: ToolContext, name: keyof ReturnType<typeof createTools>, input: object) =>
  (createTools(ctx)[name].execute as (i: object, o: object) => Promise<unknown>)(input, {
    toolCallId: 't',
    messages: [],
  })

describe('matchCourse', () => {
  it.each([
    ['rscit', 'RS-CIT'],
    ['RS CIT course', 'RS-CIT'],
    ['rs-cit', 'RS-CIT'],
    ['tally', 'Tally Prime + GST'],
    ['Tally GST', 'Tally Prime + GST'],
    ['pyton', 'Python + AI'],
    ['web dev', 'Web Development'],
  ])('%s → %s', async (query, expected) => {
    const list = await db.select().from(courses)
    expect(matchCourse(list, query)?.shortName).toBe(expected)
  })

  it('returns null rather than guessing', async () => {
    const list = await db.select().from(courses)
    expect(matchCourse(list, 'nursing')).toBeNull()
  })
})

describe('tools', () => {
  it('get_course_details returns the fee from the database, formatted, and records it as a fact', async () => {
    const ctx = ctxFor()
    const out = (await run(ctx, 'get_course_details', { course: 'tally' })) as Record<
      string,
      unknown
    >
    expect(out.total_fee).toBe('₹8,500')
    expect(out.installments).toEqual([
      { label: 'Pehli kisht', amount: '₹4,500', due: 'at admission' },
      { label: 'Doosri kisht', amount: '₹4,000', due: '30 days after admission' },
    ])
    expect(ctx.facts[0]).toContain('₹8,500')
  })

  it('get_batches lists upcoming batches with seats left', async () => {
    const out = (await run(ctxFor(), 'get_batches', { course: 'rscit' })) as {
      batches: { seats_left: number; time: string }[]
    }
    expect(out.batches).toHaveLength(2)
    expect(out.batches[0]).toMatchObject({ seats_left: 8, time: '8:00 AM to 9:30 AM' })
  })

  it('check_demo_slots skips batches without demos', async () => {
    const out = (await run(ctxFor(), 'check_demo_slots', { course: 'tally' })) as {
      demo_slots: { name: string }[]
    }
    expect(out.demo_slots.map((s) => s.name)).toEqual(['Tally Subah'])
  })

  it('an unknown course comes back as short text with the real options', async () => {
    const out = await run(ctxFor(), 'get_course_details', { course: 'nursing' })
    expect(out).toMatchObject({ error: 'No course matches "nursing".' })
    expect((out as { available_courses: string[] }).available_courses).toContain('RS-CIT')
  })

  it("only ever reads the current org's data", async () => {
    const [other] = await db
      .insert(organizations)
      .values({ name: 'Other', slug: 'other-org' })
      .returning()
    const out = (await run(ctxFor(other!.id), 'get_courses', {})) as { courses: unknown[] }
    expect(out.courses).toEqual([])
  })

  it('handoff_to_human sets the flag the pipeline acts on', async () => {
    const ctx = ctxFor()
    await run(ctx, 'handoff_to_human', { reason: 'missing_info', summary: 'Hostel ke baare mein' })
    expect(ctx.handoff).toEqual({ reason: 'missing_info', summary: 'Hostel ke baare mein' })
  })
})

describe('formatting', () => {
  it('writes days and times the way people read them', () => {
    expect(formatDays(['mon', 'tue', 'wed', 'thu', 'fri', 'sat'])).toBe('Mon–Sat')
    expect(formatDays(['fri', 'mon', 'wed'])).toBe('Mon, Wed, Fri')
    expect(formatTime('17:00:00')).toBe('5:00 PM')
    expect(formatTime('00:30')).toBe('12:30 AM')
  })
})
