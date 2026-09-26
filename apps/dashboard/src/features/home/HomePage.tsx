import { NotebookIcon } from '@phosphor-icons/react'
import { useTranslation } from 'react-i18next'
import { Page } from '@/app/Page'
import { EmptyState } from '@/components/EmptyState'

/**
 * "Aaj ka hisaab" (§16.3). Until WhatsApp is connected there are no real
 * numbers, and showing zeros would claim "nothing happened today", so it's an
 * honest empty state. The LedgerCard itself is on /dev/components.
 */
export default function HomePage() {
  const { t } = useTranslation()
  return (
    <Page title={t('home.title')}>
      <EmptyState icon={NotebookIcon} title={t('home.emptyTitle')} body={t('home.emptyBody')} />
    </Page>
  )
}
