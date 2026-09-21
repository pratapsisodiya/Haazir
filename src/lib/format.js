// Indian numbering: commas at 2,2,3 and lakh / crore words.
const inr = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 })

export function groupIndian(n) {
  return inr.format(Math.round(n))
}

export function rupees(n) {
  return `₹${groupIndian(n)}`
}

/** 4500000 -> { value: '45', unit: 'lakh' }; 12500000 -> { value: '1.25', unit: 'crore' } */
export function indianShort(n) {
  const v = Math.round(n)
  if (v >= 1_00_00_000) return { value: trim(v / 1_00_00_000), unit: 'crore' }
  if (v >= 1_00_000) return { value: trim(v / 1_00_000), unit: 'lakh' }
  if (v >= 1_000) return { value: trim(v / 1_000), unit: 'thousand' }
  return { value: groupIndian(v), unit: '' }
}

function trim(x) {
  // Two significant decimals below 10, one above, none at 100+.
  const decimals = x >= 100 ? 0 : x >= 10 ? 1 : 2
  return Number(x.toFixed(decimals)).toLocaleString('en-IN')
}
