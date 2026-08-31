import { createContext, useContext } from 'react'
import type { Dictionary } from './es'

export type Language = 'es' | 'en'

/** BCP-47 tag used for date formatting when a language is selected. */
export const LANGUAGE_LOCALES: Record<Language, string> = {
  es: 'es-CO',
  en: 'en-US',
}

export const LANGUAGE_LABELS: Record<Language, string> = {
  es: 'Español',
  en: 'English',
}

export const LANGUAGE_STORAGE_KEY = 'fs.language'

export interface I18nContextValue {
  language: Language
  setLanguage: (language: Language) => void
  /** The active dictionary. Read it directly: `t.savings.finalBalance`. */
  t: Dictionary
  /** Locale for dates and month names — follows the UI language. */
  dateLocale: string
}

export const I18nContext = createContext<I18nContextValue | null>(null)

export function useI18n(): I18nContextValue {
  const context = useContext(I18nContext)
  if (!context) throw new Error('useI18n must be used inside an I18nProvider')
  return context
}

/** Shorthand for the common case of only needing the dictionary. */
export function useT(): Dictionary {
  return useI18n().t
}
