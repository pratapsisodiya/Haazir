import type { ErrorBody, ErrorCode } from '@haazir/shared'

// Dev goes through Vite's proxy (same origin); builds call the API directly.
const BASE = import.meta.env.DEV ? '' : (import.meta.env.VITE_API_URL ?? '')

export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: ErrorCode | 'NETWORK',
    message: string,
    readonly details?: unknown,
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

/**
 * Thin fetch wrapper. Every failure becomes an ApiError with a stable `code`,
 * so screens can branch on `WINDOW_CLOSED` or `PLAN_LIMIT` rather than text.
 */
export async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  let res: Response
  try {
    res = await fetch(`${BASE}${path}`, {
      credentials: 'include',
      ...init,
      headers: { 'content-type': 'application/json', ...init.headers },
    })
  } catch {
    throw new ApiError(0, 'NETWORK', 'Network request failed')
  }

  const body = await res.json().catch(() => null)
  if (res.ok) return body as T

  const error = (body as ErrorBody | null)?.error
  throw new ApiError(
    res.status,
    error?.code ?? 'INTERNAL',
    error?.message ?? res.statusText,
    error?.details,
  )
}
