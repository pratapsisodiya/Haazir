import { CalendarPlusIcon, PaperPlaneTiltIcon, UsersThreeIcon } from '@phosphor-icons/react'
import { useQuery } from '@tanstack/react-query'
import type { TFunction } from 'i18next'
import { useEffect } from 'react'
import { Button } from '@/components/Button'
import { Card } from '@/components/Card'
import { EmptyState } from '@/components/EmptyState'
import { Input } from '@/components/Input'
import { Wordmark } from '@/components/Jharokha'
import { LanguageToggle, ThemeToggle } from '@/components/LanguageToggle'
import { LedgerCard } from '@/components/LedgerCard'
import { StatusPill } from '@/components/StatusPill'
import { formatLongDate } from '@/lib/format'
import i18n from '@/lib/i18n'
import type { UiLanguage } from '@/lib/preferences'

const PANELS: { theme: 'light' | 'dark'; lang: UiLanguage; label: string }[] = [
  { theme: 'light', lang: 'hi', label: 'Light theme, Hindi' },
  { theme: 'light', lang: 'en', label: 'Light theme, English' },
  { theme: 'dark', lang: 'hi', label: 'Dark theme, Hindi' },
  { theme: 'dark', lang: 'en', label: 'Dark theme, English' },
]

/**
 * Dev-only gallery (§14.9): every component in both themes and both languages
 * at once, so a change can be checked against Section 14 in one screenshot.
 * Each panel sets its own `data-theme` and `lang`; the tokens are scoped to
 * that attribute, so the panels don't depend on the global preference.
 */
export default function ComponentsPage() {
  useEffect(() => {
    document.title = 'Components | Haazir'
  }, [])

  return (
    <div className="mx-auto max-w-[1600px] px-4 py-6 sm:px-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Wordmark />
          <h1 className="mt-3 text-h1">Components</h1>
          <p className="text-body text-ink-muted">Section 14 of the spec, rendered.</p>
          <ApiStatus />
        </div>
        <div className="flex w-full max-w-md gap-4">
          <LanguageToggle className="flex-1" />
          <ThemeToggle className="flex-1" />
        </div>
      </header>

      <div className="mt-6 grid gap-4 xl:grid-cols-2">
        {PANELS.map((panel) => (
          <section
            key={panel.label}
            data-theme={panel.theme}
            lang={panel.lang}
            aria-label={panel.label}
            className="rounded-card border border-rule bg-paper p-4 text-ink sm:p-6"
          >
            <p className="text-small font-semibold text-ink-muted">{panel.label}</p>
            <Gallery t={i18n.getFixedT(panel.lang)} lang={panel.lang} />
          </section>
        ))}
      </div>
    </div>
  )
}

function Gallery({ t, lang }: { t: TFunction; lang: UiLanguage }) {
  return (
    <div className="mt-4 flex flex-col gap-8">
      <Block title="Colour">
        <div className="flex flex-wrap gap-2">
          {[
            'bg-ink',
            'bg-ink-muted',
            'bg-paper',
            'bg-surface',
            'bg-rule',
            'bg-madder-700',
            'bg-madder-600',
            'bg-madder-50',
            'bg-pottery-600',
            'bg-pottery-50',
            'bg-marigold-500',
            'bg-marigold-50',
            'bg-danger-600',
            'bg-focus',
          ].map((swatch) => (
            <span
              key={swatch}
              title={swatch.replace('bg-', '')}
              className={`size-9 rounded-control border border-rule ${swatch}`}
            />
          ))}
        </div>
      </Block>

      <Block title="Type">
        <p className="font-display text-display tabular">₹18,500</p>
        <p className="font-display-tight text-h1">{t('sample.ledgerTitle')}</p>
        <p className="font-display-tight text-h2">{t('sample.emptyLeadsTitle')}</p>
        <p className="text-h3">{t('sample.courseTitle')}</p>
        <p className="text-body">{t('sample.emptyLeadsBody')}</p>
        <p className="text-small text-ink-muted">{t('sample.studentNameHint')}</p>
      </Block>

      <Block title="LedgerCard">
        <LedgerCard
          title={t('sample.ledgerTitle')}
          date={formatLongDate(new Date('2026-10-06T09:00:00+05:30'), lang)}
          rows={[
            { label: t('sample.enquiries'), value: 23, to: '#' },
            { label: t('sample.botReplies'), value: 21, hint: t('sample.botRepliesHint') },
            { label: t('sample.demos'), value: 5 },
            { label: t('sample.admissions'), value: 2 },
            { label: t('sample.fees'), value: 1_850_000, kind: 'money' },
          ]}
        />
      </Block>

      <Block title="Button">
        <div className="flex flex-wrap gap-2">
          <Button>
            <CalendarPlusIcon aria-hidden />
            {t('sample.bookDemo')}
          </Button>
          <Button variant="secondary">
            <PaperPlaneTiltIcon aria-hidden />
            {t('sample.sendReminder')}
          </Button>
          <Button variant="ghost">{t('sample.cancel')}</Button>
          <Button variant="danger">{t('sample.deleteData')}</Button>
        </div>
        <div className="mt-2 flex flex-wrap gap-2">
          <Button size="md" loading>
            {t('sample.sending')}
          </Button>
          <Button size="md" variant="secondary" disabled>
            {t('sample.sendReminder')}
          </Button>
          <Button size="lg" variant="secondary">
            {t('sample.bookDemo')}
          </Button>
        </div>
      </Block>

      <Block title="Input">
        <div className="grid gap-4 sm:grid-cols-2">
          <Input label={t('sample.studentName')} hint={t('sample.studentNameHint')} />
          <Input
            label={t('sample.fee')}
            inputMode="numeric"
            defaultValue="0"
            error={t('sample.feeError')}
          />
        </div>
      </Block>

      <Block title="StatusPill">
        <div className="flex flex-wrap gap-2">
          <StatusPill tone="success">{t('sample.paid')}</StatusPill>
          <StatusPill tone="attention">{t('sample.due')}</StatusPill>
          <StatusPill tone="danger">{t('sample.overdue')}</StatusPill>
          <StatusPill tone="bot">{t('sample.bot')}</StatusPill>
          <StatusPill tone="human">{t('sample.you')}</StatusPill>
          <StatusPill tone="neutral">{t('sample.draft')}</StatusPill>
        </div>
      </Block>

      <Block title="Card">
        <Card
          title={t('sample.courseTitle')}
          description={t('sample.courseBody')}
          actions={
            <Button variant="secondary" size="md">
              {t('sample.bookDemo')}
            </Button>
          }
        />
      </Block>

      <Block title="EmptyState">
        <div className="rounded-card border border-rule bg-surface">
          <EmptyState
            icon={UsersThreeIcon}
            title={t('sample.emptyLeadsTitle')}
            body={t('sample.emptyLeadsBody')}
            action={<Button variant="secondary">{t('sample.emptyLeadsAction')}</Button>}
          />
        </div>
      </Block>
    </div>
  )
}

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="mb-3 font-sans text-small font-semibold text-ink-muted" lang="en">
        {title}
      </h2>
      {children}
    </div>
  )
}

/** Proves the dashboard → Vite proxy → API → Postgres/Redis path in one glance. */
function ApiStatus() {
  const { data, isError, isPending } = useQuery({
    queryKey: ['ready'],
    queryFn: async () => {
      const res = await fetch('/ready')
      return (await res.json()) as { status: string; checks: Record<string, string> }
    },
    retry: false,
    refetchInterval: 10_000,
  })

  if (isPending) return null
  const ready = !isError && data?.status === 'ready'
  return (
    <p className="mt-3 flex flex-wrap items-center gap-2 text-small text-ink-muted">
      <StatusPill tone={ready ? 'success' : 'danger'}>
        {ready ? 'API ready' : 'API not ready'}
      </StatusPill>
      {data &&
        Object.entries(data.checks).map(([name, state]) => (
          <span key={name}>
            {name}: {state}
          </span>
        ))}
    </p>
  )
}
