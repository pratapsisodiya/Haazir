/** Values shared by the database schema, the API and the dashboard. */

export const ROLES = ['owner', 'admin', 'agent'] as const
export type Role = (typeof ROLES)[number]

export const VERTICALS = ['coaching', 'clinic', 'real_estate', 'retail', 'hotel', 'other'] as const
export type Vertical = (typeof VERTICALS)[number]

export const LANGUAGES = ['hi', 'en', 'hinglish'] as const
export type Language = (typeof LANGUAGES)[number]

export const ORG_STATUSES = ['onboarding', 'active', 'paused', 'cancelled'] as const
export type OrgStatus = (typeof ORG_STATUSES)[number]

export const DEFAULT_TIMEZONE = 'Asia/Kolkata'

/** Shape of `plans.limits`. The values live in the database, editable by super admin. */
export interface PlanLimits {
  seats: number
  numbers: number
  aiReplies: number
  /** Campaigns per month. `null` means no cap. */
  campaigns: number | null
  features: string[]
}

/** Per-weekday opening hours, `HH:mm` 24-hour. `null` means closed that day. */
export type BusinessHours = Record<
  'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun',
  { open: string; close: string } | null
>
