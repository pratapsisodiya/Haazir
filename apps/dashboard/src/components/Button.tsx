import { Slot } from '@radix-ui/react-slot'
import { CircleNotch } from '@phosphor-icons/react'
import { cva, type VariantProps } from 'class-variance-authority'
import type { ComponentProps } from 'react'
import { cn } from '@/lib/cn'

/**
 * Madder is for brand and the single primary action on a screen (§14.2), so
 * `primary` should appear at most once per screen. Heights never drop below
 * the 44px tap target; `responsive` (the default) is lg on phones, md on desktop.
 * Only colours transition, and only on interaction (§14.7).
 */
const button = cva(
  [
    'inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-control',
    'text-button transition-colors duration-150',
    'disabled:cursor-not-allowed disabled:opacity-50',
    // Loading is busy, not unavailable: keep full colour so it doesn't look broken.
    'aria-busy:cursor-progress aria-busy:opacity-100',
    '[&_svg]:size-5 [&_svg]:shrink-0',
  ],
  {
    variants: {
      variant: {
        primary: 'bg-madder-700 text-paper hover:bg-madder-600',
        secondary: 'border border-ink/70 text-ink hover:bg-ink/5',
        ghost: 'text-ink hover:bg-ink/5',
        danger: 'bg-danger-600 text-paper hover:bg-danger-600/90',
      },
      size: {
        md: 'h-11 px-4',
        lg: 'h-12 px-5',
        responsive: 'h-12 px-5 lg:h-11 lg:px-4',
      },
      block: { true: 'w-full' },
    },
    defaultVariants: { variant: 'primary', size: 'responsive' },
  },
)

export interface ButtonProps extends ComponentProps<'button'>, VariantProps<typeof button> {
  /** Render the child element (e.g. a router Link) with button styling. */
  asChild?: boolean
  /** Shows a spinner, keeps the label, and blocks repeat taps. */
  loading?: boolean
}

export function Button({
  className,
  variant,
  size,
  block,
  asChild = false,
  loading = false,
  disabled,
  children,
  type,
  ...props
}: ButtonProps) {
  const classes = cn(button({ variant, size, block }), className)

  if (asChild) {
    return (
      <Slot className={classes} {...props}>
        {children}
      </Slot>
    )
  }

  return (
    <button
      type={type ?? 'button'}
      className={classes}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading && <CircleNotch className="animate-spin motion-reduce:animate-none" aria-hidden />}
      {children}
    </button>
  )
}

/** Square icon-only button. `label` is required: it's the accessible name. */
export function IconButton({
  label,
  className,
  children,
  ...props
}: ComponentProps<'button'> & { label: string }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={cn(
        'inline-flex size-11 items-center justify-center rounded-control text-ink transition-colors duration-150 hover:bg-ink/5 [&_svg]:size-6',
        className,
      )}
      {...props}
    >
      {children}
    </button>
  )
}
