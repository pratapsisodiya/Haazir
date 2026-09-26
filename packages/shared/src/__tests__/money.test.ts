import { describe, expect, it } from 'vitest'
import { formatPaise, parseRupeesToPaise } from '../money'

describe('formatPaise', () => {
  it('uses Indian grouping and hides zero paise', () => {
    expect(formatPaise(1850000)).toBe('₹18,500')
    expect(formatPaise(12500000)).toBe('₹1,25,000')
    expect(formatPaise(0)).toBe('₹0')
  })

  it('always shows two digits when there are paise', () => {
    expect(formatPaise(1850050)).toBe('₹18,500.50')
    expect(formatPaise(1850005)).toBe('₹18,500.05')
  })

  it('refuses fractional paise', () => {
    expect(() => formatPaise(10.5)).toThrow(TypeError)
  })
})

describe('parseRupeesToPaise', () => {
  it('accepts the ways people type money', () => {
    expect(parseRupeesToPaise('18500')).toBe(1850000)
    expect(parseRupeesToPaise('18,500')).toBe(1850000)
    expect(parseRupeesToPaise('₹ 1,25,000')).toBe(12500000)
    expect(parseRupeesToPaise('18500.5')).toBe(1850050)
    expect(parseRupeesToPaise('18500.05')).toBe(1850005)
  })

  it('returns null for anything else', () => {
    expect(parseRupeesToPaise('')).toBeNull()
    expect(parseRupeesToPaise('abc')).toBeNull()
    expect(parseRupeesToPaise('-5')).toBeNull()
    expect(parseRupeesToPaise('1.234')).toBeNull()
  })
})
