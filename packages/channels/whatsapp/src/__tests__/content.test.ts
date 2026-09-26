import { describe, expect, it } from 'vitest'
import { bodyOf, buildMessagePayload, ContentLimitError } from '../content'

const to = '919812345678'

describe('buildMessagePayload', () => {
  it('builds a text message, quoting the message it replies to', () => {
    expect(buildMessagePayload(to, { kind: 'text', body: 'Namaste!' }, 'wamid.IN1')).toEqual({
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to,
      context: { message_id: 'wamid.IN1' },
      type: 'text',
      text: { body: 'Namaste!', preview_url: false },
    })
  })

  it('builds reply buttons', () => {
    const payload = buildMessagePayload(to, {
      kind: 'buttons',
      body: 'Demo class kab?',
      buttons: [
        { id: 'mon', title: 'Somvar' },
        { id: 'tue', title: 'Mangalvar' },
      ],
    })
    expect(payload).toMatchObject({
      type: 'interactive',
      interactive: {
        type: 'button',
        body: { text: 'Demo class kab?' },
        action: { buttons: [{ type: 'reply', reply: { id: 'mon', title: 'Somvar' } }, {}] },
      },
    })
  })

  it('refuses a fourth button, naming the limit', () => {
    const buttons = ['a', 'b', 'c', 'd'].map((id) => ({ id, title: id }))
    expect(() => buildMessagePayload(to, { kind: 'buttons', body: 'x', buttons })).toThrow(
      /1 to 3 buttons \(got 4\)/,
    )
  })

  it('refuses a button title over 20 characters, counting Devanagari correctly', () => {
    expect(() =>
      buildMessagePayload(to, {
        kind: 'buttons',
        body: 'x',
        buttons: [{ id: 'a', title: 'Mujhe demo class chahiye' }],
      }),
    ).toThrow(ContentLimitError)
    // 6 code points, 18 UTF-8 bytes: fine.
    expect(() =>
      buildMessagePayload(to, {
        kind: 'buttons',
        body: 'x',
        buttons: [{ id: 'a', title: 'हाँ जी' }],
      }),
    ).not.toThrow()
  })

  it('refuses more than 10 list rows and row titles over 24 characters', () => {
    const rows = Array.from({ length: 11 }, (_, i) => ({ id: `r${i}`, title: `Course ${i}` }))
    expect(() =>
      buildMessagePayload(to, {
        kind: 'list',
        body: 'x',
        buttonLabel: 'Courses',
        sections: [{ rows }],
      }),
    ).toThrow(/1 to 10 list rows/)
    expect(() =>
      buildMessagePayload(to, {
        kind: 'list',
        body: 'x',
        buttonLabel: 'Courses',
        sections: [{ rows: [{ id: 'a', title: 'Web Development with React and Node' }] }],
      }),
    ).toThrow(/Row title/)
  })

  it('refuses empty text and oversized text', () => {
    expect(() => buildMessagePayload(to, { kind: 'text', body: '  ' })).toThrow(/can't be empty/)
    expect(() => buildMessagePayload(to, { kind: 'text', body: 'x'.repeat(4097) })).toThrow(/4096/)
  })

  it('builds a template with language and components', () => {
    expect(
      buildMessagePayload(to, {
        kind: 'template',
        name: 'demo_reminder',
        language: 'hi',
        components: [{ type: 'body', parameters: [{ type: 'text', text: '5 PM' }] }],
      }),
    ).toMatchObject({
      type: 'template',
      template: { name: 'demo_reminder', language: { code: 'hi' } },
    })
  })

  it('needs exactly one of media id or link', () => {
    expect(() => buildMessagePayload(to, { kind: 'image' })).toThrow(/exactly one/)
    expect(
      buildMessagePayload(to, { kind: 'document', mediaId: '1', filename: 'fees.pdf' }),
    ).toMatchObject({
      document: { id: '1', filename: 'fees.pdf' },
    })
  })
})

describe('bodyOf', () => {
  it('stores what a person would read', () => {
    expect(bodyOf({ kind: 'text', body: 'Hi' })).toBe('Hi')
    expect(bodyOf({ kind: 'image', link: 'x', caption: 'Brochure' })).toBe('Brochure')
    expect(bodyOf({ kind: 'template', name: 't', language: 'hi' })).toBeNull()
  })
})
