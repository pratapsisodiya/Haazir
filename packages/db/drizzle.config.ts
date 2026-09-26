import { defineConfig } from 'drizzle-kit'

// `generate` only diffs the schema against the migrations folder; it never
// connects. `migrate` runs through src/migrate.ts so it uses the validated env.
export default defineConfig({
  dialect: 'postgresql',
  schema: './src/schema/index.ts',
  out: './migrations',
  casing: 'snake_case',
  strict: true,
  verbose: true,
})
