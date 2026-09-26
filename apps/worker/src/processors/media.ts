import { eq } from 'drizzle-orm'
import { conversations, messages, whatsappAccounts } from '@haazir/db'
import type { MediaJob } from '@haazir/messaging'
import { extensionFor } from '@haazir/storage'
import type { Deps } from '../deps'

/** WhatsApp's own ceiling is 100 MB (documents); anything claiming more is refused. */
const MAX_BYTES = 100 * 1024 * 1024

/**
 * The `media` queue: copies an inbound photo, voice note or document from
 * Meta into our storage. Meta's copy is only kept for a limited time and its
 * download URL expires within minutes, so this runs as soon as it arrives.
 * Transcribing voice notes joins this step in Phase 2.
 */
export async function processMedia(deps: Deps, job: MediaJob) {
  const [row] = await deps.db
    .select({ message: messages, account: whatsappAccounts })
    .from(messages)
    .innerJoin(conversations, eq(conversations.id, messages.conversationId))
    .innerJoin(whatsappAccounts, eq(whatsappAccounts.id, conversations.whatsappAccountId))
    .where(eq(messages.id, job.messageId))
  if (!row || row.message.orgId !== job.orgId) {
    deps.log.warn({ job }, 'media for a missing message skipped')
    return { stored: false }
  }
  if (row.message.mediaKey) return { stored: false } // done by an earlier attempt

  const graph = deps.graph(row.account)
  const info = await graph.getMedia(job.mediaId)
  if (info.fileSize !== undefined && info.fileSize > MAX_BYTES) {
    deps.log.warn({ messageId: row.message.id, size: info.fileSize }, 'media too large, not stored')
    return { stored: false }
  }

  const mime = info.mimeType ?? job.mimeType ?? 'application/octet-stream'
  const key = `orgs/${job.orgId}/media/${row.message.id}.${extensionFor(mime)}`
  const res = await graph.downloadMedia(info.url)
  const { size } = await deps.storage.put(key, res.body!, mime)

  await deps.db
    .update(messages)
    .set({ mediaKey: key, mediaMime: mime })
    .where(eq(messages.id, row.message.id))
  return { stored: true, key, size }
}
