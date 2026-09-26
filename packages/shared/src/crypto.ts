import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto'

/**
 * AES-256-GCM for secrets at rest: WhatsApp access tokens now, clients'
 * Razorpay keys later (spec §19). Node-only; import from `@haazir/shared/crypto`.
 *
 * Format: `v1.<iv>.<auth tag>.<ciphertext>`, each part base64url. The version
 * prefix leaves room for key rotation (Phase 6) without guessing formats.
 */
const VERSION = 'v1'

function keyFrom(base64Key: string) {
  const key = Buffer.from(base64Key, 'base64')
  if (key.length !== 32) throw new Error('ENCRYPTION_KEY must be 32 bytes, base64 encoded')
  return key
}

export function encryptSecret(plaintext: string, base64Key: string): string {
  const iv = randomBytes(12)
  const cipher = createCipheriv('aes-256-gcm', keyFrom(base64Key), iv)
  const ciphertext = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()])
  return [VERSION, iv, cipher.getAuthTag(), ciphertext]
    .map((part) => (typeof part === 'string' ? part : part.toString('base64url')))
    .join('.')
}

export function decryptSecret(payload: string, base64Key: string): string {
  const [version, iv, tag, ciphertext] = payload.split('.')
  if (version !== VERSION || !iv || !tag || ciphertext === undefined) {
    throw new Error('Not an encrypted secret (expected v1.<iv>.<tag>.<data>)')
  }
  const decipher = createDecipheriv('aes-256-gcm', keyFrom(base64Key), Buffer.from(iv, 'base64url'))
  decipher.setAuthTag(Buffer.from(tag, 'base64url'))
  // Throws if the data or tag was tampered with, or the key is wrong.
  return Buffer.concat([
    decipher.update(Buffer.from(ciphertext, 'base64url')),
    decipher.final(),
  ]).toString('utf8')
}
