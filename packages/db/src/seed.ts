import { pathToFileURL } from 'node:url'
import { eq, sql } from 'drizzle-orm'
import { loadEnv } from '@haazir/shared/env'
import { createDb, type AnyDatabase } from './client'
import { memberships, organizations, plans, superAdmins, users } from './schema'
import { DEMO_ORG, DEMO_USERS, PLANS } from './seed-data'

/**
 * Idempotent: running it twice leaves the same rows. Grows each phase (courses,
 * contacts, leads, messages…) until it matches the demo institute in spec §8.
 */
export async function seed(db: AnyDatabase) {
  await db
    .insert(plans)
    .values(PLANS)
    .onConflictDoUpdate({
      target: plans.code,
      set: {
        name: sql`excluded.name`,
        setupFeePaise: sql`excluded.setup_fee_paise`,
        monthlyPaise: sql`excluded.monthly_paise`,
        limits: sql`excluded.limits`,
        sort: sql`excluded.sort`,
      },
    })

  const [growth] = await db.select().from(plans).where(eq(plans.code, 'growth'))

  await db
    .insert(organizations)
    .values({ ...DEMO_ORG, planId: growth?.id })
    .onConflictDoNothing({ target: organizations.slug })
  const [org] = await db.select().from(organizations).where(eq(organizations.slug, DEMO_ORG.slug))
  if (!org) throw new Error('demo org missing after insert')

  const upsertUser = async (u: (typeof DEMO_USERS)[keyof typeof DEMO_USERS]) => {
    await db.insert(users).values(u).onConflictDoNothing({ target: users.email })
    const [row] = await db.select().from(users).where(eq(users.email, u.email))
    if (!row) throw new Error(`user ${u.email} missing after insert`)
    return row
  }

  const owner = await upsertUser(DEMO_USERS.owner)
  const staff = await upsertUser(DEMO_USERS.staff)
  const admin = await upsertUser(DEMO_USERS.superAdmin)

  await db
    .insert(memberships)
    .values([
      { orgId: org.id, userId: owner.id, role: 'owner' },
      { orgId: org.id, userId: staff.id, role: 'agent' },
    ])
    .onConflictDoNothing()

  await db.insert(superAdmins).values({ userId: admin.id }).onConflictDoNothing()

  return { org, owner, staff, admin }
}

// Run directly: `pnpm db:seed`
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const env = loadEnv()
  const { db, close } = createDb(env.DATABASE_URL, { max: 1 })
  try {
    const { org } = await seed(db)
    console.log(`Seeded: ${org.name}, ${org.city} (${PLANS.length} plans, 3 users).`)
  } finally {
    await close()
  }
}
