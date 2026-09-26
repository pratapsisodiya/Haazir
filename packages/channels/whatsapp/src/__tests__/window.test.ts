import { describe, expect, it } from 'vitest'
import { checkOutbound, extendWindow, isWindowOpen, SERVICE_WINDOW_MS } from '../window'

const t0 = new Date('2026-10-06T18:10:00Z') // 11:40 PM in Sikar

describe('service window', () => {
  it('opens for 24 hours from an inbound message', () => {
    expect(extendWindow(null, t0).getTime()).toBe(t0.getTime() + SERVICE_WINDOW_MS)
  })

  it('extends on a later message but never shortens', () => {
    const later = new Date(t0.getTime() + 60_000)
    const current = extendWindow(null, later)
    expect(extendWindow(current, t0)).toEqual(current) // a late-arriving older message
    expect(extendWindow(extendWindow(null, t0), later)).toEqual(current)
  })

  it('is open until the expiry moment, and closed from it', () => {
    const expires = extendWindow(null, t0)
    expect(isWindowOpen(expires, new Date(expires.getTime() - 1))).toBe(true)
    expect(isWindowOpen(expires, expires)).toBe(false)
    expect(isWindowOpen(null, t0)).toBe(false)
  })
})

describe('checkOutbound', () => {
  const open = extendWindow(null, t0)
  const inside = new Date(t0.getTime() + 60 * 60_000)
  const after = new Date(t0.getTime() + 25 * 60 * 60_000)

  it('allows a free-form reply inside the window', () => {
    expect(
      checkOutbound({
        kind: 'freeform',
        optInStatus: 'unknown',
        windowExpiresAt: open,
        now: inside,
      }),
    ).toEqual({ ok: true })
  })

  it('blocks free-form after the window, and says to use a template', () => {
    const result = checkOutbound({
      kind: 'freeform',
      optInStatus: 'opted_in',
      windowExpiresAt: open,
      now: after,
    })
    expect(result).toMatchObject({ ok: false, code: 'WINDOW_CLOSED' })
  })

  it('allows a template after the window', () => {
    expect(
      checkOutbound({
        kind: 'template',
        optInStatus: 'opted_in',
        windowExpiresAt: open,
        now: after,
      }),
    ).toEqual({ ok: true })
  })

  it('blocks everything to someone who opted out, even inside the window', () => {
    for (const kind of ['freeform', 'template'] as const) {
      expect(
        checkOutbound({ kind, optInStatus: 'opted_out', windowExpiresAt: open, now: inside }),
      ).toMatchObject({ ok: false, code: 'OPTED_OUT' })
    }
  })

  it('lets the one opt-out confirmation through', () => {
    expect(
      checkOutbound({
        kind: 'freeform',
        optInStatus: 'opted_out',
        windowExpiresAt: open,
        now: inside,
        isOptOutConfirmation: true,
      }),
    ).toEqual({ ok: true })
  })
})
