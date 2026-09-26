/**
 * Queue names (spec §7), shared so the API enqueues onto exactly the queue the
 * worker listens to. `system` carries housekeeping such as the heartbeat.
 */
export const QUEUES = {
  system: 'system',
  inbound: 'inbound',
  aiReply: 'ai-reply',
  outbound: 'outbound',
  media: 'media',
  ingest: 'ingest',
  campaign: 'campaign',
  reminder: 'reminder',
  summary: 'summary',
  templateSync: 'template-sync',
} as const

export type QueueName = (typeof QUEUES)[keyof typeof QUEUES]

/** Redis key the worker refreshes every minute; the API's /ready reads it. */
export const WORKER_HEARTBEAT_KEY = 'haazir:worker:heartbeat'
