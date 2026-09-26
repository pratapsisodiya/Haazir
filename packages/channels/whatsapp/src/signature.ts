import { createHmac, timingSafeEqual } from 'node:crypto'

/**
 * Meta signs every webhook POST with HMAC-SHA256 of the raw body, keyed with
 * the app secret, sent as `X-Hub-Signature-256: sha256=<hex>` (spec §10).
 * It must be checked against the exact bytes received: re-serialising parsed
 * JSON changes whitespace and key order and would never match.
 */
export function verifySignature(
  rawBody: Buffer,
  header: string | undefined,
  appSecret: string,
): boolean {
  if (!header?.startsWith('sha256=')) return false
  const received = Buffer.from(header.slice('sha256='.length), 'hex')
  const expected = createHmac('sha256', appSecret).update(rawBody).digest()
  // Length check first: timingSafeEqual throws on unequal lengths.
  return received.length === expected.length && timingSafeEqual(received, expected)
}

/** For tests and the local mock: produces the header Meta would send. */
export function signBody(rawBody: Buffer | string, appSecret: string): string {
  return `sha256=${createHmac('sha256', appSecret).update(rawBody).digest('hex')}`
}

/**
 * The GET handshake when the webhook URL is saved in the Meta dashboard:
 * echo `hub.challenge` only if the verify token matches ours.
 */
export function verifySubscription(
  query: Record<string, unknown>,
  verifyToken: string,
): string | null {
  const mode = query['hub.mode']
  const token = query['hub.verify_token']
  const challenge = query['hub.challenge']
  if (mode !== 'subscribe' || typeof token !== 'string' || typeof challenge !== 'string') {
    return null
  }
  const a = Buffer.from(token)
  const b = Buffer.from(verifyToken)
  return a.length === b.length && timingSafeEqual(a, b) ? challenge : null
}
