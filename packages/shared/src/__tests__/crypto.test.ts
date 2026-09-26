import { describe, expect, it } from 'vitest'
import { decryptSecret, encryptSecret } from '../crypto'

const key = Buffer.alloc(32, 1).toString('base64')
const otherKey = Buffer.alloc(32, 2).toString('base64')

describe('encryptSecret / decryptSecret', () => {
  it('round-trips, with a fresh IV every time', () => {
    const a = encryptSecret('EAAG-token', key)
    const b = encryptSecret('EAAG-token', key)
    expect(a).not.toBe(b)
    expect(a.startsWith('v1.')).toBe(true)
    expect(decryptSecret(a, key)).toBe('EAAG-token')
    expect(decryptSecret(b, key)).toBe('EAAG-token')
  })

  it('never contains the plaintext', () => {
    expect(encryptSecret('EAAG-token', key)).not.toContain('EAAG')
  })

  it('fails with the wrong key', () => {
    expect(() => decryptSecret(encryptSecret('secret', key), otherKey)).toThrow()
  })

  it('fails if the ciphertext was tampered with', () => {
    const parts = encryptSecret('secret', key).split('.')
    parts[3] = Buffer.from('SECRET').toString('base64url')
    expect(() => decryptSecret(parts.join('.'), key)).toThrow()
  })

  it('rejects things that are not encrypted secrets', () => {
    expect(() => decryptSecret('plain-token', key)).toThrow(/Not an encrypted secret/)
  })
})
