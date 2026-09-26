import { and, eq, sql } from 'drizzle-orm'
import { conversations, messages, whatsappAccounts } from '@haazir/db'
import { queueOutbound, type AiReplyJob } from '@haazir/messaging'
import { AppError } from '@haazir/shared'
import type { Deps } from '../deps'

/** Phase 1's whole brain. Phase 2 replaces this processor with the real pipeline (spec §11). */
export const ECHO_REPLY = 'Namaste! Haazir se jawab.'

/**
 * The `ai-reply` queue. Marks the message read with a typing indicator (so the
 * sender sees someone is on it), then queues the reply through the outbound
 * gate. Does nothing if staff have taken over the chat.
 */
export async function processAiReply(deps: Deps, job: AiReplyJob) {
  const [row] = await deps.db
    .select({ conversation: conversations, message: messages, account: whatsappAccounts })
    .from(messages)
    .innerJoin(conversations, eq(conversations.id, messages.conversationId))
    .innerJoin(whatsappAccounts, eq(whatsappAccounts.id, conversations.whatsappAccountId))
    .where(eq(messages.id, job.messageId))
  if (!row || row.conversation.orgId !== job.orgId) {
    deps.log.warn({ job }, 'ai-reply for a missing message skipped')
    return { replied: false }
  }
  if (row.conversation.mode !== 'bot') return { replied: false }

  // A retried or re-queued job must not answer the same message twice.
  const [already] = await deps.db
    .select({ id: messages.id })
    .from(messages)
    .where(
      and(
        eq(messages.conversationId, row.conversation.id),
        eq(messages.direction, 'out'),
        sql`${messages.interactive}->>'inReplyToMessageId' = ${job.messageId}`,
      ),
    )
    .limit(1)
  if (already) return { replied: false }

  // Best effort: a failed read receipt must not stop the reply.
  if (row.message.waMessageId) {
    await deps
      .graph(row.account)
      .markRead(row.message.waMessageId, { typing: true })
      .catch((err: Error) => deps.log.warn({ err: err.message }, 'markRead failed'))
  }

  try {
    await queueOutbound(
      { db: deps.db, outboundQueue: deps.queues.outbound },
      {
        orgId: job.orgId,
        conversationId: row.conversation.id,
        content: { kind: 'text', body: ECHO_REPLY },
        sentBy: 'bot',
        inReplyToMessageId: job.messageId,
        now: deps.now(),
      },
    )
  } catch (err) {
    // Opted out or window closed: correct not to reply, nothing to retry.
    if (err instanceof AppError && (err.code === 'OPTED_OUT' || err.code === 'WINDOW_CLOSED')) {
      deps.log.info({ code: err.code, conversationId: row.conversation.id }, 'reply not sent')
      return { replied: false }
    }
    throw err
  }
  return { replied: true }
}
