import type { ComponentProps } from 'react'
import { cn } from '@/lib/cn'

/** The logo outline: a pointed, cusped Rajasthani arch with a door notch at its base. */
const LOGO_PATH =
  'M26 86V58q6.7-4.4 4-12 7.5-3.8 6-12 7.8-3.5 7-12 7-1.8 7-9 0 7.2 7 9-.8 8.5 7 12-1.5 8.2 6 12-2.7 7.6 4 12v28H58v-8H42v8H26Z'

/** Same arch without the notch, normalised to 0..1 so it can clip any box. */
const FRAME_PATH =
  'M0 1V0.6164Q0.1396 0.5562 0.0833 0.4521Q0.2396 0.4 0.2083 0.2877Q0.3708 0.2397 0.3542 0.1233Q0.5 0.0986 0.5 0Q0.5 0.0986 0.6458 0.1233Q0.6292 0.2397 0.7917 0.2877Q0.7604 0.4 0.9167 0.4521Q0.8604 0.5562 1 0.6164V1H0Z'

export const JHAROKHA_CLIP_ID = 'jharokha-arch'

/**
 * Render once near the root. Anything with `[clip-path:url(#jharokha-arch)]`
 * is then cut to the arch: contact avatars in the inbox and empty-state frames
 * (§14.5), instead of the usual circle.
 */
export function JharokhaClipPath() {
  return (
    <svg width="0" height="0" className="absolute" aria-hidden focusable="false">
      <clipPath id={JHAROKHA_CLIP_ID} clipPathUnits="objectBoundingBox">
        <path d={FRAME_PATH} />
      </clipPath>
    </svg>
  )
}

export function JharokhaFrame({ className, children, ...props }: ComponentProps<'div'>) {
  return (
    <div
      className={cn('flex items-end justify-center [clip-path:url(#jharokha-arch)]', className)}
      {...props}
    >
      {children}
    </div>
  )
}

/** Madder tile with the arch cut from it, in the page's paper colour. */
export function LogoMark({ size = 32, className }: { size?: number; className?: string }) {
  return (
    <svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      className={cn('shrink-0', className)}
      aria-hidden
    >
      <rect width="100" height="100" rx="24" className="fill-madder-700" />
      <path
        d={LOGO_PATH}
        transform="translate(50 50) scale(.66) translate(-50 -50)"
        className="fill-paper"
      />
    </svg>
  )
}

export function Wordmark({ className }: { className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-2.5', className)}>
      <LogoMark />
      <span className="font-display-tight text-h2 text-ink">Haazir</span>
    </span>
  )
}
