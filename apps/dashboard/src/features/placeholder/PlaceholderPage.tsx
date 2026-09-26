import { HammerIcon } from '@phosphor-icons/react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { Page } from '@/app/Page'
import { Button } from '@/components/Button'
import { EmptyState } from '@/components/EmptyState'

/** Stands in for screens that later phases build (§22), so every nav link lands somewhere. */
export function PlaceholderPage({ navKey }: { navKey: string }) {
  const { t } = useTranslation()
  return (
    <Page title={t(`nav.${navKey}`)}>
      <EmptyState
        icon={HammerIcon}
        title={t('placeholder.title')}
        body={t('placeholder.body')}
        action={
          <Button asChild variant="secondary">
            <Link to="/">{t('placeholder.action')}</Link>
          </Button>
        }
      />
    </Page>
  )
}
