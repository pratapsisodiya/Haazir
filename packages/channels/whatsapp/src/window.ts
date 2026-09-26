/**
 * WhatsApp's customer-service window: after a contact messages the business,
 * free-form replies are allowed for 24 hours. Outside it, only an approved
 * template may be sent (spec §10).
 */
export const SERVICE_WINDOW_MS = 24 * 60 * 60 * 1000

/** The window after an inbound message. Never shortens an existing window. */
export function extendWindow(current: Date | null, inboundAt: Date): Date {
  const next = new Date(inboundAt.getTime() + SERVICE_WINDOW_MS)
  return current && current > next ? current : next
}

export function isWindowOpen(expiresAt: Date | null, now: Date = new Date()): boolean {
  return expiresAt !== null && now < expiresAt
}

export type OutboundKind = 'freeform' | 'template'

export type GateResult =
  { ok: true } | { ok: false; code: 'OPTED_OUT' | 'WINDOW_CLOSED'; reason: string }

/**
 * The rules every send must pass, as a pure function so they're tested once
 * and applied everywhere (the outbound service is the only caller). Plan limits
 * and per-number throughput are checked there too, where the data lives.
 */
export function checkOutbound(input: {
  kind: OutboundKind
  optInStatus: 'opted_in' | 'opted_out' | 'unknown'
  windowExpiresAt: Date | null
  now?: Date
  /** The single confirmation sent right after someone opts out. */
  isOptOutConfirmation?: boolean
}): GateResult {
  if (input.optInStatus === 'opted_out' && !input.isOptOutConfirmation) {
    return { ok: false, code: 'OPTED_OUT', reason: 'Contact has opted out of messages' }
  }
  if (input.kind === 'freeform' && !isWindowOpen(input.windowExpiresAt, input.now)) {
    return {
      ok: false,
      code: 'WINDOW_CLOSED',
      reason: 'The 24-hour reply window is closed; send an approved template instead',
    }
  }
  return { ok: true }
}
