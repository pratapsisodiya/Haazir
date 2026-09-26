import { eq } from 'drizzle-orm'
import { whatsappAccounts, type AnyDatabase } from '@haazir/db'
import { decryptSecret } from '@haazir/shared/crypto'
import { GraphClient } from '@haazir/whatsapp'

export type WhatsappAccount = typeof whatsappAccounts.$inferSelect

export interface GraphConfig {
  META_GRAPH_BASE_URL: string
  META_GRAPH_API_VERSION: string
  ENCRYPTION_KEY?: string
}

/** A Graph client acting as one connected number, with its token decrypted just in time. */
export function graphClientFor(account: WhatsappAccount, config: GraphConfig): GraphClient {
  if (!config.ENCRYPTION_KEY) throw new Error('ENCRYPTION_KEY is not set; cannot decrypt the token')
  return new GraphClient({
    baseUrl: config.META_GRAPH_BASE_URL,
    version: config.META_GRAPH_API_VERSION,
    accessToken: decryptSecret(account.accessTokenEnc, config.ENCRYPTION_KEY),
    phoneNumberId: account.phoneNumberId,
  })
}

/** Records that a number stopped working (expired token, banned…) so the UI can say so. */
export async function markAccountError(db: AnyDatabase, accountId: string, error: string) {
  await db
    .update(whatsappAccounts)
    .set({ status: 'error', lastError: error })
    .where(eq(whatsappAccounts.id, accountId))
}
