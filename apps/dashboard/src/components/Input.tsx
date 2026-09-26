import { WarningCircle } from '@phosphor-icons/react'
import { useId, type ComponentProps } from 'react'
import { cn } from '@/lib/cn'

interface InputProps extends ComponentProps<'input'> {
  /** Always visible above the field: placeholders are not labels. */
  label: string
  hint?: string
  /** What went wrong and how to fix it. Replaces the hint while shown. */
  error?: string
}

/**
 * 16px text so iOS doesn't zoom on focus; 48px tall for thumbs. Hint and error
 * are wired to the input with aria-describedby, so screen readers read them.
 */
export function Input({ label, hint, error, className, id, ...props }: InputProps) {
  const autoId = useId()
  const inputId = id ?? autoId
  const noteId = `${inputId}-note`
  const note = error ?? hint

  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <label htmlFor={inputId} className="text-small font-semibold text-ink">
        {label}
      </label>
      <input
        id={inputId}
        aria-invalid={error ? true : undefined}
        aria-describedby={note ? noteId : undefined}
        className={cn(
          'h-12 w-full rounded-control border bg-surface px-3.5 text-body text-ink',
          'placeholder:text-ink-muted/80 transition-colors duration-150',
          'focus-visible:border-focus focus-visible:outline-2 focus-visible:outline-offset-0',
          'disabled:cursor-not-allowed disabled:opacity-60',
          error ? 'border-danger-600' : 'border-rule hover:border-ink-muted/60',
        )}
        {...props}
      />
      {note && (
        <p
          id={noteId}
          className={cn(
            'flex items-start gap-1.5 text-small',
            error ? 'text-danger-600' : 'text-ink-muted',
          )}
        >
          {error && <WarningCircle className="mt-0.5 size-4 shrink-0" weight="bold" aria-hidden />}
          {note}
        </p>
      )}
    </div>
  )
}
