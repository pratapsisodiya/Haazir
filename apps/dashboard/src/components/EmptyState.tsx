import type { Icon } from '@phosphor-icons/react'
import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'
import { JharokhaFrame } from './Jharokha'

interface EmptyStateProps {
  icon: Icon
  title: string
  body: string
  /** One action, at most (§16): what to do next. */
  action?: ReactNode
  className?: string
}

/**
 * A duotone Phosphor icon inside the jharokha arch, in madder (§14.6). No stock
 * illustrations. The copy invites action rather than apologising.
 */
export function EmptyState({ icon: Glyph, title, body, action, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        'mx-auto flex max-w-md flex-col items-center px-4 py-10 text-center',
        className,
      )}
    >
      <JharokhaFrame className="h-28 w-20 bg-madder-50 pb-4">
        <Glyph className="size-10 text-madder-700" weight="duotone" aria-hidden />
      </JharokhaFrame>
      <h2 className="mt-5 text-h2 text-ink">{title}</h2>
      <p className="mt-2 max-w-[42ch] text-body text-ink-muted">{body}</p>
      {action && <div className="mt-6">{action}</div>}
    </div>
  )
}
