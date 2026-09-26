import { formatPaise } from '@haazir/shared'
import type { UiLanguage } from './preferences'

export { formatPaise }

const TIMEZONE = 'Asia/Kolkata'

/** "मंगलवार, 6 अक्टूबर" / "Tuesday, 6 October": a date as plain words, in IST. */
export function formatLongDate(date: Date, language: UiLanguage) {
  return new Intl.DateTimeFormat(language === 'hi' ? 'hi-IN' : 'en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    timeZone: TIMEZONE,
  }).format(date)
}

/** Indian digit grouping (1,25,000) with Latin digits in both languages. */
export function formatCount(n: number) {
  return new Intl.NumberFormat('en-IN').format(n)
}
