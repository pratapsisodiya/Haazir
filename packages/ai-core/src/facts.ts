import { formatPaise } from '@haazir/shared'

/** Weekday codes as the bot says them. */
const DAY = {
  mon: 'Mon',
  tue: 'Tue',
  wed: 'Wed',
  thu: 'Thu',
  fri: 'Fri',
  sat: 'Sat',
  sun: 'Sun',
} as const
const ORDER = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']

/** ['mon','tue','wed','thu','fri','sat'] → "Mon–Sat"; ['mon','wed','fri'] → "Mon, Wed, Fri". */
export function formatDays(days: string[]): string {
  const sorted = [...days].sort((a, b) => ORDER.indexOf(a) - ORDER.indexOf(b))
  const idx = sorted.map((d) => ORDER.indexOf(d))
  const consecutive = idx.every((v, i) => i === 0 || v === idx[i - 1]! + 1)
  const label = (d: string) => DAY[d as keyof typeof DAY] ?? d
  if (sorted.length >= 3 && consecutive) return `${label(sorted[0]!)}–${label(sorted.at(-1)!)}`
  return sorted.map(label).join(', ')
}

/** "17:00:00" → "5:00 PM". */
export function formatTime(t: string): string {
  const [h = 0, m = 0] = t.split(':').map(Number)
  const suffix = h >= 12 ? 'PM' : 'AM'
  return `${h % 12 === 0 ? 12 : h % 12}:${String(m).padStart(2, '0')} ${suffix}`
}

/** "2026-10-05" → "5 Oct 2026". Dates are wall-clock dates in IST; no timezone maths. */
export function formatDate(iso: string): string {
  const [y, mo, d] = iso.split('-').map(Number)
  const month = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ][mo! - 1]
  return `${d} ${month} ${y}`
}

export const rupees = formatPaise
