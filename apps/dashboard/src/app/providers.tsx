import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useEffect, useState, type ReactNode } from 'react'
import { I18nextProvider } from 'react-i18next'
import { JharokhaClipPath } from '@/components/Jharokha'
import i18n from '@/lib/i18n'
import { applyPreferences, usePreferences } from '@/lib/preferences'

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          // On patchy 4G, refetching on every tab switch is wasted data.
          queries: { staleTime: 30_000, refetchOnWindowFocus: false, retry: 1 },
        },
      }),
  )

  const theme = usePreferences((s) => s.theme)
  const language = usePreferences((s) => s.language)

  useEffect(() => {
    applyPreferences({ theme, language })
    void i18n.changeLanguage(language)
  }, [theme, language])

  return (
    <QueryClientProvider client={queryClient}>
      <I18nextProvider i18n={i18n}>
        <JharokhaClipPath />
        {children}
      </I18nextProvider>
    </QueryClientProvider>
  )
}
