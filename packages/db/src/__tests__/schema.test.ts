import { PGlite } from '@electric-sql/pglite'
import { eq, sql } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/pglite'
import { migrate } from 'drizzle-orm/pglite/migrator'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { migrationsFolder } from '../paths'
import * as schema from '../schema'
import { memberships, organizations, plans, users } from '../schema'
import { seed } from '../seed'
import { PLANS } from '../seed-data'

// PGlite is real Postgres compiled to WASM, in-process: these tests run the
// actual migration SQL without Docker. CI additionally migrates a real server.
const client = new PGlite()
const db = drizzle({ client, schema, casing: 'snake_case' })

beforeAll(async () => {
  await migrate(db, { migrationsFolder })
})

afterAll(async () => {
  await client.close()
})

describe('migrations', () => {
  it('creates the tables so far (Phase 0 core + Phase 1 WhatsApp)', async () => {
    const result = await db.execute<{ table_name: string }>(
      sql`select table_name from information_schema.tables where table_schema = 'public' order by 1`,
    )
    expect(result.rows.map((r) => r.table_name)).toEqual([
      'contacts',
      'conversations',
      'memberships',
      'messages',
      'organizations',
      'plans',
      'super_admins',
      'users',
      'whatsapp_accounts',
    ])
  })

  it('generates uuids and timestamps in the database', async () => {
    const [org] = await db.insert(organizations).values({ name: 'Test', slug: 'test' }).returning()
    expect(org?.id).toMatch(/^[0-9a-f-]{36}$/)
    expect(org?.createdAt).toBeInstanceOf(Date)
    expect(org?.timezone).toBe('Asia/Kolkata')
    expect(org?.status).toBe('onboarding')
  })

  it('rejects values outside the enums', async () => {
    await expect(
      db.execute(sql`insert into organizations (name, slug, vertical) values ('x', 'x', 'bakery')`),
    ).rejects.toThrow()
  })
})

describe('seed', () => {
  it('is idempotent', async () => {
    await seed(db)
    await seed(db)
    expect(await db.$count(plans)).toBe(PLANS.length)
    expect(await db.$count(users)).toBe(3)
    expect(await db.$count(memberships)).toBe(2)
  })

  it('stores plan money as integer paise', async () => {
    const [growth] = await db.select().from(plans).where(eq(plans.code, 'growth'))
    expect(growth?.setupFeePaise).toBe(1_999_900)
    expect(growth?.monthlyPaise).toBe(499_900)
    expect(growth?.limits.seats).toBe(5)
  })

  it('allows one membership per user per org', async () => {
    const { org, owner } = await seed(db)
    await expect(
      db.insert(memberships).values({ orgId: org.id, userId: owner.id, role: 'admin' }),
    ).rejects.toThrow()
  })

  it('removes memberships when the org is deleted', async () => {
    const [temp] = await db.insert(organizations).values({ name: 'Temp', slug: 'temp' }).returning()
    const [user] = await db.insert(users).values({ name: 'T', email: 't@temp.example' }).returning()
    await db.insert(memberships).values({ orgId: temp!.id, userId: user!.id })
    await db.delete(organizations).where(eq(organizations.id, temp!.id))
    expect(await db.$count(memberships, eq(memberships.userId, user!.id))).toBe(0)
  })
})
