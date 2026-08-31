import { createContext, useContext } from 'react'

/**
 * The currency is global — every feature formats against the same one —
 * while each feature owns its own parameters. The context hands out
 * pre-bound formatters so no component has to thread `locale`/`currency`
 * through by hand.
 *
 * `locale` is deliberately not user-settable here: it drives thousands/decimal
 * *separator style*, and that follows the active UI language (`useI18n()`),
 * not the selected currency — someone reading the app in English sees
 * "$1,234.56" even when the currency is Colombian pesos, not "$1.234,56".
 * `LocaleProvider` derives it from `LANGUAGE_LOCALES[language]`; it's exposed
 * here read-only for the few consumers (`Inputs.tsx`) that need it to parse
 * what the user types.
 */
export interface LocaleContextValue {
  locale: string
  currency: string
  setCurrency: (currency: string) => void
  formatCurrency: (value: number) => string
  formatAbbrev: (value: number) => string
  formatPercent: (value: number, fractionDigits?: number) => string
  formatMultiplier: (value: number) => string
  formatInteger: (value: number) => string
  currencySymbol: string
}

export const LocaleContext = createContext<LocaleContextValue | null>(null)

export function useLocale(): LocaleContextValue {
  const context = useContext(LocaleContext)
  if (!context) throw new Error('useLocale must be used inside a LocaleProvider')
  return context
}
