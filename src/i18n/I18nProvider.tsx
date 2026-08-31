import { useCallback, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { en } from './en'
import { es } from './es'
import { I18nContext, LANGUAGE_LOCALES, LANGUAGE_STORAGE_KEY } from './i18n'
import type { Language } from './i18n'

const DICTIONARIES = { es, en }

/** Stored choice first, then the browser's language, then Spanish. */
function initialLanguage(): Language {
  try {
    const stored = localStorage.getItem(LANGUAGE_STORAGE_KEY)
    if (stored === 'es' || stored === 'en') return stored
  } catch {
    // Fall through to detection.
  }
  return typeof navigator !== 'undefined' && navigator.language?.startsWith('en') ? 'en' : 'es'
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(initialLanguage)

  // Keeps <html lang> and the browser tab title in step, including on the
  // very first render, where the language may have come from browser
  // detection rather than a click.
  useEffect(() => {
    document.documentElement.lang = LANGUAGE_LOCALES[language]
    document.title = DICTIONARIES[language].app.title
  }, [language])

  const setLanguage = useCallback((next: Language) => {
    setLanguageState(next)
    try {
      localStorage.setItem(LANGUAGE_STORAGE_KEY, next)
    } catch {
      // A refused write only costs the preference on next load.
    }
  }, [])

  const value = useMemo(
    () => ({
      language,
      setLanguage,
      t: DICTIONARIES[language],
      dateLocale: LANGUAGE_LOCALES[language],
    }),
    [language, setLanguage],
  )

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}
