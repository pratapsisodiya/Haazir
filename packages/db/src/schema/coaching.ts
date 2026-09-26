import { sql } from 'drizzle-orm'
import {
  boolean,
  date,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  time,
  uuid,
} from 'drizzle-orm/pg-core'
import { id, timestamps } from './columns'
import { organizations } from './core'

export const courseModeEnum = pgEnum('course_mode', ['offline', 'online', 'hybrid'])

export interface InstallmentStep {
  label: string
  amountPaise: number
  /** Days after admission this installment falls due. */
  dueOffsetDays: number
}

/**
 * What an institute teaches, with the one fee the bot is allowed to quote
 * (spec §8). The bot reads these through tools, never from documents, so the
 * number in a reply is always the number in this table.
 */
export const courses = pgTable(
  'courses',
  {
    id: id(),
    orgId: uuid()
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),
    name: text().notNull(),
    /** ≤ 24 characters: WhatsApp list rows cut off anything longer. */
    shortName: text().notNull(),
    description: text(),
    durationText: text(),
    mode: courseModeEnum().notNull().default('offline'),
    feeTotalPaise: integer().notNull(),
    installmentPlan: jsonb().$type<InstallmentStep[]>().notNull().default([]),
    brochureKey: text(),
    certificateText: text(),
    active: boolean().notNull().default(true),
    sort: integer().notNull().default(0),
    ...timestamps,
  },
  (t) => [index('courses_org_id_idx').on(t.orgId)],
)

export const batches = pgTable(
  'batches',
  {
    id: id(),
    orgId: uuid()
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),
    courseId: uuid()
      .notNull()
      .references(() => courses.id, { onDelete: 'cascade' }),
    name: text().notNull(),
    /** Weekday codes: mon, tue, wed, thu, fri, sat, sun. */
    days: text()
      .array()
      .notNull()
      .default(sql`'{}'::text[]`),
    startTime: time().notNull(), // IST wall-clock time
    endTime: time().notNull(),
    startDate: date().notNull(),
    seatsTotal: integer().notNull(),
    seatsFilled: integer().notNull().default(0),
    demoAllowed: boolean().notNull().default(true),
    branchLabel: text(),
    active: boolean().notNull().default(true),
    ...timestamps,
  },
  (t) => [index('batches_org_id_idx').on(t.orgId), index('batches_course_id_idx').on(t.courseId)],
)
