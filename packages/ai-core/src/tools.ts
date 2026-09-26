import { tool } from 'ai'
import { and, asc, eq, gte, sql } from 'drizzle-orm'
import { z } from 'zod'
import { batches, courses, type AnyDatabase } from '@haazir/db'
import { formatDate, formatDays, formatTime, rupees } from './facts'

type Course = typeof courses.$inferSelect

export interface ToolContext {
  db: AnyDatabase
  orgId: string
  /** Today in IST, as YYYY-MM-DD. */
  today: string
  /** Every tool result, verbatim: the only place numbers in a reply may come from. */
  facts: string[]
  toolCalls: { name: string; input: unknown; output: unknown }[]
  handoff: { reason: string; summary: string } | null
}

const normalise = (s: string) => s.toLowerCase().replace(/[^\p{L}\p{M}\p{N}]/gu, '')

function distance(a: string, b: string): number {
  const dp = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)])
  for (let j = 1; j <= b.length; j++) dp[0]![j] = j
  for (let i = 1; i <= a.length; i++)
    for (let j = 1; j <= b.length; j++)
      dp[i]![j] = Math.min(
        dp[i - 1]![j]! + 1,
        dp[i]![j - 1]! + 1,
        dp[i - 1]![j - 1]! + (a[i - 1] === b[j - 1] ? 0 : 1),
      )
  return dp[a.length]![b.length]!
}

/**
 * "rscit", "RS CIT", "rs-cit course", "tally", "pyton" all find their course.
 * Returns null rather than guess when nothing is close.
 */
export function matchCourse(list: Course[], query: string): Course | null {
  const q = normalise(query.replace(/\bcourse\b|\bkorse\b|\bclass\b/gi, ''))
  if (!q) return null
  let best: { course: Course; score: number } | null = null
  for (const course of list) {
    const names = [course.shortName, course.name].map(normalise)
    const firstWord = normalise(course.shortName.split(/[\s+]/)[0] ?? '')
    let score = 0
    if (names.includes(q)) score = 4
    else if (names.some((n) => n.startsWith(q) || q.startsWith(n))) score = 3
    else if (firstWord.length >= 4 && (q.includes(firstWord) || firstWord.includes(q))) score = 2
    else if (names.some((n) => distance(n.slice(0, q.length + 1), q) <= (q.length > 5 ? 2 : 1)))
      score = 1
    if (score && (!best || score > best.score)) best = { course, score }
  }
  return best?.course ?? null
}

function record<T>(ctx: ToolContext, name: string, input: unknown, output: T): T {
  ctx.facts.push(JSON.stringify(output))
  ctx.toolCalls.push({ name, input, output })
  return output
}

async function activeCourses(ctx: ToolContext) {
  return ctx.db
    .select()
    .from(courses)
    .where(and(eq(courses.orgId, ctx.orgId), eq(courses.active, true)))
    .orderBy(asc(courses.sort))
}

async function upcomingBatches(
  ctx: ToolContext,
  courseId: string,
  fromDate: string,
  demoOnly: boolean,
) {
  return ctx.db
    .select()
    .from(batches)
    .where(
      and(
        eq(batches.orgId, ctx.orgId),
        eq(batches.courseId, courseId),
        eq(batches.active, true),
        gte(batches.startDate, fromDate),
        demoOnly ? eq(batches.demoAllowed, true) : undefined,
        sql`${batches.seatsFilled} < ${batches.seatsTotal}`,
      ),
    )
    .orderBy(asc(batches.startDate), asc(batches.startTime))
}

const batchFacts = (b: typeof batches.$inferSelect) => ({
  batch_id: b.id,
  name: b.name,
  days: formatDays(b.days),
  time: `${formatTime(b.startTime)} to ${formatTime(b.endTime)}`,
  starts: formatDate(b.startDate),
  seats_left: b.seatsTotal - b.seatsFilled,
  demo_allowed: b.demoAllowed,
})

/**
 * The bot's read-only tools (spec §11.3). Every query is scoped to the org;
 * errors come back as short text for the model, never stack traces. Booking
 * and sending tools (book_demo, send_brochure…) arrive in Phase 4.
 */
export function createTools(ctx: ToolContext) {
  const notFound = async (name: string, input: unknown, query: string) => {
    const available = (await activeCourses(ctx)).map((c) => c.shortName)
    return record(ctx, name, input, {
      error: `No course matches "${query}".`,
      available_courses: available,
    })
  }

  return {
    get_courses: tool({
      description: "List the institute's active courses with duration and total fee.",
      inputSchema: z.object({}),
      execute: async (input) => {
        const list = await activeCourses(ctx)
        return record(ctx, 'get_courses', input, {
          courses: list.map((c) => ({
            course: c.shortName,
            duration: c.durationText,
            mode: c.mode,
            total_fee: rupees(c.feeTotalPaise),
          })),
        })
      },
    }),

    get_course_details: tool({
      description:
        'Full details of one course: what it covers, duration, mode, total fee, installments, certificate.',
      inputSchema: z.object({ course: z.string().describe('Course name as the person wrote it') }),
      execute: async (input) => {
        const course = matchCourse(await activeCourses(ctx), input.course)
        if (!course) return notFound('get_course_details', input, input.course)
        return record(ctx, 'get_course_details', input, {
          course: course.name,
          short_name: course.shortName,
          description: course.description,
          duration: course.durationText,
          mode: course.mode,
          total_fee: rupees(course.feeTotalPaise),
          installments: course.installmentPlan.map((i) => ({
            label: i.label,
            amount: rupees(i.amountPaise),
            due: i.dueOffsetDays === 0 ? 'at admission' : `${i.dueOffsetDays} days after admission`,
          })),
          certificate: course.certificateText,
        })
      },
    }),

    get_batches: tool({
      description: 'Upcoming batches of a course with days, timings, start date and seats left.',
      inputSchema: z.object({
        course: z.string(),
        from_date: z.string().optional().describe('YYYY-MM-DD; defaults to today'),
      }),
      execute: async (input) => {
        const course = matchCourse(await activeCourses(ctx), input.course)
        if (!course) return notFound('get_batches', input, input.course)
        const list = await upcomingBatches(ctx, course.id, input.from_date ?? ctx.today, false)
        return record(ctx, 'get_batches', input, {
          course: course.shortName,
          batches: list.map(batchFacts),
          ...(list.length
            ? {}
            : { note: 'No upcoming batch with seats. The team will confirm the next one.' }),
        })
      },
    }),

    check_demo_slots: tool({
      description: 'Batches of a course where a free demo class is allowed and seats are left.',
      inputSchema: z.object({
        course: z.string(),
        date: z.string().optional().describe('YYYY-MM-DD'),
      }),
      execute: async (input) => {
        const course = matchCourse(await activeCourses(ctx), input.course)
        if (!course) return notFound('check_demo_slots', input, input.course)
        const list = await upcomingBatches(ctx, course.id, input.date ?? ctx.today, true)
        return record(ctx, 'check_demo_slots', input, {
          course: course.shortName,
          demo_slots: list.map(batchFacts),
          booking: 'The team confirms the demo date and time on WhatsApp.',
        })
      },
    }),

    handoff_to_human: tool({
      description:
        'Hand the chat to a person at the institute. Use when a fact is missing, the person is upset, asks for a human, or asks something sensitive.',
      inputSchema: z.object({
        reason: z.enum(['missing_info', 'upset', 'asked_for_human', 'sensitive', 'other']),
        summary: z
          .string()
          .describe('One line for the staff, e.g. "Hostel ke baare mein poochh rahe hain"'),
      }),
      execute: async (input) => {
        ctx.handoff = { reason: input.reason, summary: input.summary }
        ctx.toolCalls.push({ name: 'handoff_to_human', input, output: 'ok' })
        return 'Handed over. Tell the person the team will reply shortly; do not answer the question yourself.'
      },
    }),
  }
}

export type HaazirTools = ReturnType<typeof createTools>
