import { useTranslation } from 'react-i18next'
import { usePreferences, type UiLanguage } from '@/lib/preferences'
import { SegmentedControl } from './SegmentedControl'

/** Each language is named in its own script, so it can be found by someone who can't read the other. */
export function LanguageToggle({ className }: { className?: string }) {
  const { t } = useTranslation()
  const language = usePreferences((s) => s.language)
  const setLanguage = usePreferences((s) => s.setLanguage)
  return (
    <SegmentedControl<UiLanguage>
      className={className}
      legend={t('prefs.language')}
      value={language}
      onChange={setLanguage}
      options={[
        { value: 'hi', label: 'हिंदी', lang: 'hi' },
        { value: 'en', label: 'English', lang: 'en' },
      ]}
    />
  )
}

export function ThemeToggle({ className }: { className?: string }) {
  const { t } = useTranslation()
  const theme = usePreferences((s) => s.theme)
  const setTheme = usePreferences((s) => s.setTheme)
  return (
    <SegmentedControl
      className={className}
      legend={t('prefs.theme')}
      value={theme}
      onChange={setTheme}
      options={[
        { value: 'light', label: t('prefs.light') },
        { value: 'dark', label: t('prefs.dark') },
        { value: 'system', label: t('prefs.system') },
      ]}
    />
  )
}
