import { useId } from 'react'
import { cn } from '@/lib/cn'

interface Option<T extends string> {
  value: T
  label: string
  /** Set when the label is in a different language from the page (हिंदी on an English page). */
  lang?: string
}

interface SegmentedControlProps<T extends string> {
  legend: string
  value: T
  options: Option<T>[]
  onChange(value: T): void
  className?: string
}

/**
 * Real radio buttons underneath, so arrow keys, screen readers and forms all
 * work without extra code. The selected segment swaps colour in 150ms.
 */
export function SegmentedControl<T extends string>({
  legend,
  value,
  options,
  onChange,
  className,
}: SegmentedControlProps<T>) {
  const name = useId()
  return (
    <fieldset className={cn('min-w-0', className)}>
      <legend className="mb-1.5 text-small font-semibold text-ink">{legend}</legend>
      <div className="flex rounded-control border border-rule bg-paper p-1">
        {options.map((option) => (
          <label
            key={option.value}
            lang={option.lang}
            className={cn(
              'relative flex h-10 min-w-0 flex-1 cursor-pointer items-center justify-center rounded-[7px] px-2 text-small font-semibold transition-colors duration-150',
              'has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-focus',
              value === option.value
                ? 'bg-surface text-ink ring-1 ring-rule'
                : 'text-ink-muted hover:text-ink',
            )}
          >
            <input
              type="radio"
              name={name}
              value={option.value}
              checked={value === option.value}
              onChange={() => onChange(option.value)}
              className="sr-only"
            />
            <span className="truncate">{option.label}</span>
          </label>
        ))}
      </div>
    </fieldset>
  )
}
