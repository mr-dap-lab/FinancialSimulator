/**
 * Locale-aware formatting shared by every feature.
 *
 * `Intl.NumberFormat` construction is expensive relative to a single format
 * call, and the schedule tables format thousands of cells per keystroke, so the
 * formatters are memoised per locale/currency pair.
 */

export const DEFAULT_LOCALE = 'es-CO'
export const DEFAULT_CURRENCY = 'COP'

interface Bundle {
  currency: Intl.NumberFormat
  integer: Intl.NumberFormat
  abbrev: Intl.NumberFormat
  ratio: Intl.NumberFormat
  symbol: string
}

const cache = new Map<string, Bundle>()

function bundle(locale: string, currency: string): Bundle {
  const key = `${locale}|${currency}`
  const cached = cache.get(key)
  if (cached) return cached

  const currencyFmt = new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  })

  const created: Bundle = {
    currency: currencyFmt,
    integer: new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }),
    abbrev: new Intl.NumberFormat(locale, { maximumFractionDigits: 1 }),
    ratio: new Intl.NumberFormat(locale, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }),
    symbol:
      currencyFmt
        .formatToParts(1)
        .filter((part) => part.type === 'currency')
        .map((part) => part.value)
        .join('') || '$',
  }

  cache.set(key, created)
  return created
}

/**
 * Thousands separators, no decimals, negatives in parentheses.
 *
 * The red treatment for negatives is a presentation concern and belongs to the
 * component rendering the value — use `isNegative` to drive it.
 */
export function formatCurrency(
  value: number,
  locale: string = DEFAULT_LOCALE,
  currency: string = DEFAULT_CURRENCY,
): string {
  const { currency: fmt } = bundle(locale, currency)
  const rounded = Math.round(value)
  if (rounded < 0) return `(${fmt.format(Math.abs(value))})`
  // Normalise -0 so a rounded-away negative does not render as "-$ 0".
  return fmt.format(rounded === 0 ? 0 : value)
}

/** `$5M`, `$10M`, `$500K` — for chart axis labels. */
export function formatAbbrev(
  value: number,
  locale: string = DEFAULT_LOCALE,
  currency: string = DEFAULT_CURRENCY,
): string {
  const { abbrev, integer, symbol } = bundle(locale, currency)
  const abs = Math.abs(value)
  const sign = value < 0 ? '-' : ''

  if (abs >= 1_000_000_000) return `${sign}${symbol}${abbrev.format(abs / 1_000_000_000)}B`
  if (abs >= 1_000_000) return `${sign}${symbol}${abbrev.format(abs / 1_000_000)}M`
  if (abs >= 1_000) return `${sign}${symbol}${abbrev.format(abs / 1_000)}K`
  return `${sign}${symbol}${integer.format(abs)}`
}

/** `11%` / `11,5%` from a fraction. */
export function formatPercent(
  value: number,
  locale: string = DEFAULT_LOCALE,
  fractionDigits = 1,
): string {
  return new Intl.NumberFormat(locale, {
    style: 'percent',
    minimumFractionDigits: 0,
    maximumFractionDigits: fractionDigits,
  }).format(value)
}

/** `1,83x`. */
export function formatMultiplier(value: number, locale: string = DEFAULT_LOCALE): string {
  return `${bundle(locale, DEFAULT_CURRENCY).ratio.format(value)}x`
}

/** Plain grouped integer, no currency symbol. */
export function formatInteger(value: number, locale: string = DEFAULT_LOCALE): string {
  return bundle(locale, DEFAULT_CURRENCY).integer.format(value)
}

export function currencySymbol(
  locale: string = DEFAULT_LOCALE,
  currency: string = DEFAULT_CURRENCY,
): string {
  return bundle(locale, currency).symbol
}

export const isNegative = (value: number): boolean => Math.round(value) < 0

/** The decimal separator this locale uses, so inputs can accept it. */
export function decimalSeparator(locale: string): string {
  return (
    new Intl.NumberFormat(locale)
      .formatToParts(1.1)
      .find((part) => part.type === 'decimal')?.value ?? '.'
  )
}

/** Parses user-typed digits into a whole number, tolerating any grouping. */
/**
 * A string of ~310+ digits overflows `Number()` to `Infinity` — reachable from
 * a pathological paste into a currency field. Truncating to 15 digits first
 * (comfortably above any real amount this app projects) keeps the conversion
 * inside a safe integer range unconditionally, rather than trusting every
 * caller to clamp the result afterwards.
 */
export function parseInteger(raw: string): number {
  const digits = raw.replace(/[^\d]/g, '').slice(0, 15)
  if (digits === '') return 0
  const value = Number(digits)
  return Number.isFinite(value) ? value : 0
}

/**
 * Parses a decimal the user typed, accepting either separator so an es-CO user
 * can type "11,5" and an en-US user "11.5".
 */
export function parseDecimal(raw: string): number | null {
  const cleaned = raw.replace(/\s/g, '').replace(',', '.')
  if (cleaned === '' || cleaned === '-' || cleaned === '.') return null
  const value = Number(cleaned)
  return Number.isFinite(value) ? value : null
}

/**
 * `Math.max`/`Math.min` propagate a `NaN` argument straight through instead of
 * clamping it, so a `NaN` reaching this function (a malformed paste, a stray
 * `Number('')` somewhere upstream) would otherwise write `NaN` into a
 * parameter. Falling back to `min` keeps every caller's guarantee that the
 * result is always a real, in-range number.
 */
export const clamp = (value: number, min: number, max: number): number =>
  Number.isFinite(value) ? Math.min(max, Math.max(min, value)) : min

export const MONTH_NAMES = [
  'Ene',
  'Feb',
  'Mar',
  'Abr',
  'May',
  'Jun',
  'Jul',
  'Ago',
  'Sep',
  'Oct',
  'Nov',
  'Dic',
] as const

/**
 * The exactly-five currencies the app supports, chosen in the top bar (see
 * `App.tsx`'s `CurrencySelector`) — no open-ended locale/currency pairing.
 *
 * Deliberately carries no locale of its own: `LocaleProvider` always formats
 * using `LANGUAGE_LOCALES[language]` for grouping and symbol placement (see
 * its own doc comment) — separators follow the UI language, never the
 * selected currency — so a currency option is just a code plus a label.
 */
export const CURRENCY_CODES = ['USD', 'EUR', 'GBP', 'KYD', 'COP'] as const
export type CurrencyCode = (typeof CURRENCY_CODES)[number]
