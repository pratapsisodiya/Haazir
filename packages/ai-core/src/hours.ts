import type { BusinessHours } from '@haazir/shared'
import { formatTime } from './facts'

type Day = keyof BusinessHours
const DAYS: Day[] = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat']

/** Weekday and HH:mm in the org's timezone (IST by default), whatever the server's clock zone. */
export function localParts(now: Date, timeZone = 'Asia/Kolkata') {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-GB', {
      timeZone,
      weekday: 'short',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    })
      .formatToParts(now)
      .map((p) => [p.type, p.value]),
  )
  const day = parts.weekday!.toLowerCase().slice(0, 3) as Day
  return {
    day,
    time: `${parts.hour}:${parts.minute}`,
    date: `${parts.year}-${parts.month}-${parts.day}`,
  }
}

export function hoursToday(hours: BusinessHours | null, now: Date, timeZone?: string): string {
  if (!hours) return 'not set'
  const today = hours[localParts(now, timeZone).day]
  return today ? `${formatTime(today.open)} to ${formatTime(today.close)}` : 'closed today'
}

export function isOpen(hours: BusinessHours | null, now: Date, timeZone?: string): boolean {
  if (!hours) return true // unknown hours: don't claim we're closed
  const { day, time } = localParts(now, timeZone)
  const today = hours[day]
  return !!today && time >= today.open && time < today.close
}

/** "kal subah 8:00 AM" style: when the next opening is, for the after-hours message. */
export function nextOpening(hours: BusinessHours | null, now: Date, timeZone?: string) {
  if (!hours) return null
  const { day, time } = localParts(now, timeZone)
  const start = DAYS.indexOf(day)
  for (let offset = 0; offset < 8; offset++) {
    const d = DAYS[(start + offset) % 7]!
    const h = hours[d]
    if (!h) continue
    if (offset === 0 && time >= h.open) continue
    return { offsetDays: offset, day: d, time: formatTime(h.open) }
  }
  return null
}

export function describeOpening(
  next: ReturnType<typeof nextOpening>,
  lang: 'hi' | 'en' | 'hinglish',
): string {
  if (!next) return lang === 'en' ? 'soon' : lang === 'hi' ? 'जल्द' : 'jald'
  const when = {
    en: next.offsetDays === 0 ? 'today' : next.offsetDays === 1 ? 'tomorrow' : `on ${next.day}`,
    hinglish: next.offsetDays === 0 ? 'aaj' : next.offsetDays === 1 ? 'kal' : `${next.day} ko`,
    hi: next.offsetDays === 0 ? 'आज' : next.offsetDays === 1 ? 'कल' : `${next.day} को`,
  }[lang]
  return lang === 'en'
    ? `${when} from ${next.time}`
    : `${when} ${next.time} ${lang === 'hi' ? 'से' : 'se'}`
}
