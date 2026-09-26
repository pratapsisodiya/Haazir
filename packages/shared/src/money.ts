/**
 * Money is stored as integer paise everywhere (spec §8). These are the only two
 * places that cross between paise and what a person reads or types.
 */

const whole = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
})
const withPaise = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

/** 1850000 → "₹18,500"; 1850050 → "₹18,500.50" (Indian grouping: ₹1,25,000). */
export function formatPaise(paise: number): string {
  if (!Number.isInteger(paise)) throw new TypeError(`paise must be an integer, got ${paise}`)
  return (paise % 100 === 0 ? whole : withPaise).format(paise / 100)
}

/** "18,500" / "18500.50" / "₹ 18,500" → 1850050. Returns null for anything that isn't money. */
export function parseRupeesToPaise(input: string): number | null {
  const cleaned = input.replace(/[₹,\s]/g, '')
  if (!/^\d+(\.\d{1,2})?$/.test(cleaned)) return null
  const [whole, fraction = ''] = cleaned.split('.')
  return Number(whole) * 100 + Number(fraction.padEnd(2, '0'))
}
