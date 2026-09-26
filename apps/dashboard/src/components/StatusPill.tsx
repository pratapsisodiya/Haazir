import {
  CheckCircleIcon,
  CircleDashedIcon,
  ClockIcon,
  RobotIcon,
  UserIcon,
  WarningCircleIcon,
  type Icon,
} from '@phosphor-icons/react'
import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

export type StatusTone = 'success' | 'attention' | 'danger' | 'neutral' | 'bot' | 'human'

/**
 * Status is never colour alone (§14.2): every tone carries an icon and a text
 * label, so it reads in greyscale, in sunlight, and to screen readers.
 *
 * - success   paid, connected, approved          (blue pottery)
 * - attention due, pending                       (marigold)
 * - danger    overdue, failed, rejected
 * - neutral   draft, closed
 * - bot       the bot is handling this chat      (pottery)
 * - human     a person on the team has taken over (madder)
 */
const TONES: Record<StatusTone, { className: string; icon: Icon }> = {
  success: { className: 'bg-pottery-50 text-pottery-600', icon: CheckCircleIcon },
  attention: { className: 'bg-marigold-50 text-ink [&_svg]:text-marigold-500', icon: ClockIcon },
  danger: { className: 'bg-danger-600/10 text-danger-600', icon: WarningCircleIcon },
  neutral: { className: 'bg-ink/5 text-ink-muted', icon: CircleDashedIcon },
  bot: { className: 'bg-pottery-50 text-pottery-600', icon: RobotIcon },
  human: { className: 'bg-madder-50 text-madder-700', icon: UserIcon },
}

interface StatusPillProps {
  tone: StatusTone
  children: ReactNode
  /** Override the tone's default icon. */
  icon?: Icon
  className?: string
}

export function StatusPill({ tone, children, icon, className }: StatusPillProps) {
  const { className: toneClass, icon: DefaultIcon } = TONES[tone]
  const Glyph = icon ?? DefaultIcon
  return (
    <span
      className={cn(
        'inline-flex h-7 items-center gap-1 rounded-full pr-2.5 pl-2 text-small font-semibold whitespace-nowrap',
        toneClass,
        className,
      )}
    >
      <Glyph className="size-4 shrink-0" weight="bold" aria-hidden />
      {children}
    </span>
  )
}
