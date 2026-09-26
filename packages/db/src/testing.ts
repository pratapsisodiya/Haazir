import { PGlite } from '@electric-sql/pglite'
import { vector } from '@electric-sql/pglite-pgvector'
import { drizzle } from 'drizzle-orm/pglite'
import { migrate } from 'drizzle-orm/pglite/migrator'
import type { AnyDatabase } from './client'
import { migrationsFolder } from './paths'
import * as schema from './schema'

/**
 * A real Postgres (PGlite, in-process WASM) with pgvector, fully migrated.
 * For tests only: no Docker, a fresh database per call, gone when closed.
 */
export async function createTestDb() {
  const client = new PGlite({ extensions: { vector } })
  const db = drizzle({ client, schema, casing: 'snake_case' })
  await migrate(db, { migrationsFolder })
  return { db: db as unknown as AnyDatabase, client, close: () => client.close() }
}
