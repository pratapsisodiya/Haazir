import { migrate } from 'drizzle-orm/node-postgres/migrator'
import { loadEnv } from '@haazir/shared/env'
import { createDb } from './client'
import { migrationsFolder } from './paths'

// Applies pending migrations from ./migrations. Safe to run repeatedly.
const env = loadEnv()
const { db, close } = createDb(env.DATABASE_URL, { max: 1 })

try {
  await migrate(db, { migrationsFolder })
  console.log('Migrations applied.')
} finally {
  await close()
}
