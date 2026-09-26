import { describe, expect, it } from 'vitest'
import { signBody, verifySignature, verifySubscription } from '../signature'

const secret = 'app-secret'
const body = Buffer.from('{"object":"whatsapp_business_account","entry":[]}')

describe('verifySignature', () => {
  it('accepts the signature Meta would send', () => {
    expect(verifySignature(body, signBody(body, secret), secret)).toBe(true)
  })

  it('rejects a signature made with another secret', () => {
    expect(verifySignature(body, signBody(body, 'other'), secret)).toBe(false)
  })

  it('rejects when a single byte of the body changed', () => {
    const tampered = Buffer.from(body.toString().replace('[]', '[{}]'))
    expect(verifySignature(tampered, signBody(body, secret), secret)).toBe(false)
  })

  it('checks the raw bytes, so re-serialised JSON does not match', () => {
    const pretty = Buffer.from(JSON.stringify(JSON.parse(body.toString()), null, 2))
    expect(verifySignature(pretty, signBody(body, secret), secret)).toBe(false)
  })

  it('rejects missing, malformed and truncated headers without throwing', () => {
    expect(verifySignature(body, undefined, secret)).toBe(false)
    expect(verifySignature(body, 'sha1=abc', secret)).toBe(false)
    expect(verifySignature(body, 'sha256=nothex', secret)).toBe(false)
    expect(verifySignature(body, signBody(body, secret).slice(0, 20), secret)).toBe(false)
  })
})

describe('verifySubscription', () => {
  const query = {
    'hub.mode': 'subscribe',
    'hub.verify_token': 'tok',
    'hub.challenge': '1158201444',
  }

  it('echoes the challenge when the token matches', () => {
    expect(verifySubscription(query, 'tok')).toBe('1158201444')
  })

  it('refuses a wrong token or mode', () => {
    expect(verifySubscription(query, 'other')).toBeNull()
    expect(verifySubscription({ ...query, 'hub.mode': 'unsubscribe' }, 'tok')).toBeNull()
    expect(verifySubscription({}, 'tok')).toBeNull()
  })
})
