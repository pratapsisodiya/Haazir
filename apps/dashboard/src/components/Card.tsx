import type { ComponentProps, ReactNode } from 'react'
import { cn } from '@/lib/cn'

interface CardProps extends Omit<ComponentProps<'section'>, 'title'> {
  title?: ReactNode
  description?: ReactNode
  /** Buttons or links, placed at the bottom. */
  actions?: ReactNode
}

/** Flat, with a sandstone rule for an edge. No shadow and no hover motion (§14.4, §14.7). */
export function Card({ title, description, actions, className, children, ...props }: CardProps) {
  return (
    <section
      className={cn('rounded-card border border-rule bg-surface p-4 sm:p-5', className)}
      {...props}
    >
      {title && <h3 className="text-h3 text-ink">{title}</h3>}
      {description && <p className="mt-1 text-body text-ink-muted">{description}</p>}
      {children && <div className={cn((title || description) && 'mt-4')}>{children}</div>}
      {actions && <div className="mt-4 flex flex-wrap gap-2">{actions}</div>}
    </section>
  )
}
