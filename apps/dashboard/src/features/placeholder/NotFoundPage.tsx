import { SignpostIcon } from '@phosphor-icons/react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { Page } from '@/app/Page'
import { Button } from '@/components/Button'
import { EmptyState } from '@/components/EmptyState'

export default function NotFoundPage() {
  const { t } = useTranslation()
  return (
    <Page title={t('notFound.title')}>
      <EmptyState
        icon={SignpostIcon}
        title={t('notFound.title')}
        body={t('notFound.body')}
        action={
          <Button asChild>
            <Link to="/">{t('notFound.action')}</Link>
          </Button>
        }
      />
    </Page>
  )
}
