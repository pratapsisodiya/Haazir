import { useTranslation } from 'react-i18next'
import { Page } from '@/app/Page'
import { Card } from '@/components/Card'
import { LanguageToggle, ThemeToggle } from '@/components/LanguageToggle'

/**
 * Settings (§16.15). Phase 0 has the display preferences; business profile,
 * hours, notifications, WhatsApp, payments and privacy tools arrive in later phases.
 */
export default function SettingsPage() {
  const { t } = useTranslation()
  return (
    <Page title={t('nav.settings')}>
      <Card
        title={t('settings.display')}
        description={t('settings.displayBody')}
        className="max-w-xl"
      >
        <div className="flex flex-col gap-5">
          <LanguageToggle />
          <ThemeToggle />
        </div>
      </Card>
    </Page>
  )
}
