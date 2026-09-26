import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import en from '../locales/en.json'
import hi from '../locales/hi.json'
import { usePreferences } from './preferences'

export const resources = { hi: { translation: hi }, en: { translation: en } } as const

// Both languages are bundled: together they're a few KB, and switching
// language must work offline on a patchy 4G connection.
void i18n.use(initReactI18next).init({
  resources,
  lng: usePreferences.getState().language,
  fallbackLng: 'hi',
  interpolation: { escapeValue: false }, // React already escapes
  returnNull: false,
})

export default i18n
