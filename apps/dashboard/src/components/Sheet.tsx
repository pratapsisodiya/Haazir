import * as Dialog from '@radix-ui/react-dialog'
import { XIcon } from '@phosphor-icons/react'
import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'
import { IconButton } from './Button'

interface SheetProps {
  open: boolean
  onOpenChange(open: boolean): void
  title: string
  closeLabel: string
  children: ReactNode
  className?: string
}

/**
 * Bottom sheet on phones, side panel on desktop (§14.9). Radix handles focus
 * trapping, Escape, scroll lock and returning focus to the trigger. Slides in
 * over 200ms (§14.7); floating, so it gets the indigo shadow.
 */
export function Sheet({ open, onOpenChange, title, closeLabel, children, className }: SheetProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 animate-fade-in bg-[rgb(18_22_42/0.45)]" />
        <Dialog.Content
          aria-describedby={undefined}
          className={cn(
            'fixed inset-x-0 bottom-0 z-50 flex max-h-[88dvh] flex-col rounded-t-sheet bg-surface shadow-float',
            'animate-sheet-up pb-[env(safe-area-inset-bottom)] focus:outline-none',
            'lg:inset-y-0 lg:right-0 lg:left-auto lg:max-h-none lg:w-[400px] lg:animate-sheet-in lg:rounded-none',
            className,
          )}
        >
          <div className="mx-auto mt-2 h-1 w-10 rounded-full bg-rule lg:hidden" aria-hidden />
          <div className="flex items-center justify-between gap-2 py-2 pr-2 pl-5">
            <Dialog.Title className="text-h3 text-ink">{title}</Dialog.Title>
            <Dialog.Close asChild>
              <IconButton label={closeLabel}>
                <XIcon />
              </IconButton>
            </Dialog.Close>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">{children}</div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
