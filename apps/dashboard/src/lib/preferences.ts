import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type ThemePreference = 'light' | 'dark' | 'system'
export type UiLanguage = 'hi' | 'en'

interface Preferences {
  theme: ThemePreference
  language: UiLanguage
  setTheme(theme: ThemePreference): void
  setLanguage(language: UiLanguage): void
}

/**
 * Per-device UI preferences. Hindi is the default: most owners are Hindi-first.
 * The key and shape are read by the inline script in index.html before React
 * loads, so keep the two in step.
 */
export const usePreferences = create<Preferences>()(
  persist(
    (set) => ({
      theme: 'system',
      language: 'hi',
      setTheme: (theme) => set({ theme }),
      setLanguage: (language) => set({ language }),
    }),
    {
      name: 'haazir-preferences',
      partialize: ({ theme, language }) => ({ theme, language }),
    },
  ),
)

/** Reflects preferences onto <html>: `data-theme` for the tokens, `lang` for screen readers and fonts. */
export function applyPreferences({ theme, language }: Pick<Preferences, 'theme' | 'language'>) {
  const root = document.documentElement
  if (theme === 'system') delete root.dataset.theme
  else root.dataset.theme = theme
  root.lang = language
}
