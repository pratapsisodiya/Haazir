import { pgEnum } from 'drizzle-orm/pg-core'
import { LANGUAGES, ORG_STATUSES, ROLES, VERTICALS } from '@haazir/shared'

// Postgres enums, built from the same lists the API and dashboard validate with.
export const roleEnum = pgEnum('role', ROLES)
export const verticalEnum = pgEnum('vertical', VERTICALS)
export const languageEnum = pgEnum('language', LANGUAGES)
export const orgStatusEnum = pgEnum('org_status', ORG_STATUSES)
export const uiLanguageEnum = pgEnum('ui_language', ['hi', 'en'])
