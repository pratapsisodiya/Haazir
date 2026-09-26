import { loadEnv } from '@haazir/shared/env'

/** Validated once, at import. A bad value stops the API before it listens. */
export const env = loadEnv()
