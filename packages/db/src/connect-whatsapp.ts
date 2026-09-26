import { eq, sql } from 'drizzle-orm'
import { encryptSecret } from '@haazir/shared/crypto'
import { loadEnv } from '@haazir/shared/env'
import { createDb } from './client'
import { organizations, whatsappAccounts } from './schema'

/**
 * Phase 1 is single-tenant: this writes the number configured in .env into
 * whatsapp_accounts for WHATSAPP_ORG_SLUG, with the access token encrypted.
 * From then on everything reads the account from the database, exactly as it
 * will when the super-admin connect screen arrives in Phase 3.
 *
 *   pnpm whatsapp:connect
 */
const env = loadEnv()

const missing = (
  [
    'WHATSAPP_PHONE_NUMBER_ID',
    'WHATSAPP_WABA_ID',
    'WHATSAPP_ACCESS_TOKEN',
    'ENCRYPTION_KEY',
  ] as const
).filter((key) => !env[key])
if (missing.length) {
  console.error(`Set these in .env first: ${missing.join(', ')}`)
  process.exit(1)
}

const { db, close } = createDb(env.DATABASE_URL, { max: 1 })
try {
  const [org] = await db
    .select()
    .from(organizations)
    .where(eq(organizations.slug, env.WHATSAPP_ORG_SLUG))
  if (!org) throw new Error(`No org with slug "${env.WHATSAPP_ORG_SLUG}". Run pnpm db:seed?`)

  const accessTokenEnc = encryptSecret(env.WHATSAPP_ACCESS_TOKEN!, env.ENCRYPTION_KEY!)
  await db
    .insert(whatsappAccounts)
    .values({
      orgId: org.id,
      wabaId: env.WHATSAPP_WABA_ID!,
      phoneNumberId: env.WHATSAPP_PHONE_NUMBER_ID!,
      accessTokenEnc,
    })
    .onConflictDoUpdate({
      target: whatsappAccounts.phoneNumberId,
      set: {
        orgId: org.id,
        wabaId: sql`excluded.waba_id`,
        accessTokenEnc: sql`excluded.access_token_enc`,
        status: 'connected',
        lastError: null,
      },
    })
  console.log(`Connected number ${env.WHATSAPP_PHONE_NUMBER_ID} to ${org.name}.`)
} finally {
  await close()
}
