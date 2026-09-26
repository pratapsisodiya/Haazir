import { useEffect, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'

/** Page frame: the H1 in Anek semi-condensed, content capped at 1200px (§14.4). */
export function Page({ title, children }: { title: string; children: ReactNode }) {
  const { t } = useTranslation()
  useEffect(() => {
    document.title = `${title} | ${t('app.name')}`
  }, [title, t])

  return (
    <div className="mx-auto w-full max-w-[1200px] px-4 pt-5 pb-8 sm:px-6 lg:px-8 lg:pt-8">
      <h1 className="text-h1 text-ink">{title}</h1>
      <div className="mt-5 lg:mt-6">{children}</div>
    </div>
  )
}
