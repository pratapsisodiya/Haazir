import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { formatCount, formatPaise } from '@/lib/format'
import { cn } from '@/lib/cn'
import { useCountUp } from '@/lib/motion'

export interface LedgerRow {
  label: string
  value: number
  /** `money` values are integer paise and count up in whole rupees. */
  kind?: 'count' | 'money'
  /** A quiet note beside the label, e.g. the average reply time. */
  hint?: string
  /** Tapping the row opens the filtered list behind the number. */
  to?: string
}

interface LedgerCardProps {
  title: string
  /** Plain words ("Tuesday, 6 October"), never a dotted meta string. */
  date?: string
  rows: LedgerRow[]
  footer?: ReactNode
  className?: string
}

/**
 * The one bold element in the app (§14.1): a bahi-khata page with a madder
 * binding strip, ruled every 44px, the day's numbers written large. Each row
 * is exactly one ruled line tall, so figures sit on the rules like ink.
 */
export function LedgerCard({ title, date, rows, footer, className }: LedgerCardProps) {
  return (
    <section
      className={cn(
        'relative overflow-hidden rounded-ledger border border-rule bg-surface',
        className,
      )}
    >
      <span className="absolute inset-y-0 left-0 w-1 bg-madder-700" aria-hidden />
      <header className="pt-4 pr-4 pb-3 pl-6">
        <h2 className="text-h2 text-ink">{title}</h2>
        {date && <p className="text-small text-ink-muted">{date}</p>}
      </header>
      <dl className="ledger-rules border-t border-rule">
        {rows.map((row) => (
          <LedgerLine key={row.label} row={row} />
        ))}
      </dl>
      {footer && <div className="border-t border-rule py-3 pr-4 pl-6">{footer}</div>}
    </section>
  )
}

function LedgerLine({ row }: { row: LedgerRow }) {
  const animated = useCountUp(row.value)
  const shown =
    row.kind === 'money'
      ? formatPaise(Math.round(animated / 100) * 100)
      : formatCount(Math.round(animated))

  const final = row.kind === 'money' ? formatPaise(row.value) : formatCount(row.value)
  const label = (
    <>
      {row.label}
      {row.hint && <span className="ml-2 text-small text-ink-muted">({row.hint})</span>}
    </>
  )

  // A <dl> may only hold dt/dd (or divs of them), so a tappable row is a link
  // inside the dt, stretched over the whole line with a pseudo-element.
  return (
    <div
      className={cn(
        'relative flex h-11 items-center justify-between gap-4 pr-4 pl-6',
        row.to && 'transition-colors duration-150 hover:bg-madder-50/60',
      )}
    >
      <dt className="min-w-0 text-body text-ink">
        {row.to ? (
          <Link to={row.to} className="after:absolute after:inset-0">
            {label}
          </Link>
        ) : (
          label
        )}
      </dt>
      <dd className="font-display text-display text-ink tabular">
        {/* Screen readers get the final figure, not every frame of the count-up. */}
        <span className="sr-only">{final}</span>
        <span aria-hidden>{shown}</span>
      </dd>
    </div>
  )
}
