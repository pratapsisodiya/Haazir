import { drizzle, type NodePgDatabase } from 'drizzle-orm/node-postgres'
import type { PgDatabase, PgQueryResultHKT } from 'drizzle-orm/pg-core'
import pg from 'pg'
import * as schema from './schema'

export type Database = NodePgDatabase<typeof schema>

/** Any Drizzle Postgres database with our schema: node-postgres in the apps, PGlite in tests. */
export type AnyDatabase = PgDatabase<PgQueryResultHKT, typeof schema>

export interface DbHandle {
  db: Database
  pool: pg.Pool
  /** Round-trips to Postgres. Used by `/ready`. */
  ping(): Promise<void>
  close(): Promise<void>
}

export function createDb(url: string, options: { max?: number } = {}): DbHandle {
  const pool = new pg.Pool({ connectionString: url, max: options.max ?? 10 })
  const db = drizzle({ client: pool, schema, casing: 'snake_case' })
  return {
    db,
    pool,
    async ping() {
      await pool.query('select 1')
    },
    close: () => pool.end(),
  }
}
