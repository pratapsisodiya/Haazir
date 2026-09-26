/**
 * The slice of a BullMQ Queue the domain code uses. A real `Queue` satisfies
 * it; tests pass an in-memory recorder instead of needing Redis.
 */
export interface JobQueue<T> {
  add(name: string, data: T, opts?: { jobId?: string; delay?: number }): Promise<unknown>
}

export interface OutboundJob {
  messageId: string
}

export interface AiReplyJob {
  orgId: string
  conversationId: string
  messageId: string
}

export interface MediaJob {
  orgId: string
  messageId: string
  mediaId: string
  mimeType?: string
}

export interface InboundJob {
  payload: unknown
  receivedAt: string
}

export interface IngestJob {
  orgId: string
  sourceId: string
}
