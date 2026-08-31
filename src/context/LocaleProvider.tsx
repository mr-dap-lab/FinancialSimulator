import { useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { useI18n } from '../i18n/i18n'
import { LANGUAGE_LOCALES } from '../i18n/i18n'
import {
  DEFAULT_CURRENCY,
  currencySymbol,
  formatAbbrev,
  formatCurrency,
  formatInteger,
  formatMultiplier,
  formatPercent,
} from '../lib/format'
import { LocaleContext } from './locale'
import type { LocaleContextValue } from './locale'

export function LocaleProvider({ children }: { children: ReactNode }) {
  const { language } = useI18n()
  const [currency, setCurrency] = useState(DEFAULT_CURRENCY)
  const locale = LANGUAGE_LOCALES[language]

  const value = useMemo<LocaleContextValue>(
    () => ({
      locale,
      currency,
      setCurrency,
      formatCurrency: (input) => formatCurrency(input, locale, currency),
      formatAbbrev: (input) => formatAbbrev(input, locale, currency),
      formatPercent: (input, fractionDigits) => formatPercent(input, locale, fractionDigits),
      formatMultiplier: (input) => formatMultiplier(input, locale),
      formatInteger: (input) => formatInteger(input, locale),
      currencySymbol: currencySymbol(locale, currency),
    }),
    [locale, currency],
  )

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>
}
