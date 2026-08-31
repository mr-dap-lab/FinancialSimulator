import { useState } from 'react'
import { useLocale } from './context/locale'
import { LocaleProvider } from './context/LocaleProvider'
import { AccessGate } from './features/auth/AccessGate'
import { AccountControl } from './features/auth/AccountControl'
import { AuthProvider } from './features/auth/AuthProvider'
import { LoginScreen } from './features/auth/LoginScreen'
import { BudgetFeature } from './features/budget/BudgetFeature'
import { CreditCardFeature } from './features/creditCard/CreditCardFeature'
import { DebtConsolidationFeature } from './features/debtConsolidation/DebtConsolidationFeature'
import { HelpFeature } from './features/help/HelpFeature'
import { LoanFeature } from './features/loan/LoanFeature'
import { RetirementFeature } from './features/retirement/RetirementFeature'
import { SavingsFeature } from './features/savings/SavingsFeature'
import { SavingsGoalFeature } from './features/savingsGoal/SavingsGoalFeature'
import { useHashTab } from './hooks/useHashTab'
import { I18nProvider } from './i18n/I18nProvider'
import { LANGUAGE_LABELS, useI18n } from './i18n/i18n'
import type { Language } from './i18n/i18n'
import { CURRENCY_CODES } from './lib/format'
import type { CurrencyCode } from './lib/format'
import { ThemeProvider } from './theme/ThemeProvider'
import { useTheme } from './theme/theme'
import type { ThemeMode } from './theme/theme'

/**
 * "Financial Simulator" is the product name and stays in English; every
 * feature-level label comes from the active dictionary. The tab labels
 * deliberately drop the "Simulador de" prefix — nesting "simulador" inside
 * "Financial Simulator" is redundant.
 */
const TAB_IDS = ['ahorro', 'meta', 'retiro', 'credito', 'consolidacion', 'tarjeta', 'presupuesto'] as const
type TabId = (typeof TAB_IDS)[number]

/**
 * `/login` and `/ayuda` (`#/login`, `#/ayuda`) are hash-routed screens, not
 * tabs — neither appears in the tab strip, but `useHashTab` still needs to
 * recognise them as valid or its own "unknown hash" normalisation would
 * silently rewrite them back to `#/ahorro` on load, breaking a direct link.
 */
const ROUTE_IDS = [...TAB_IDS, 'login', 'ayuda'] as const
type RouteId = (typeof ROUTE_IDS)[number]

const LightIcon = () => (
  <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
    <path
      fill="currentColor"
      d="M12 7a5 5 0 1 0 0 10 5 5 0 0 0 0-10zm0-5v2m0 18v2M4.2 4.2l1.4 1.4m12.8 12.8 1.4 1.4M2 12h2m18 0h-2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
    />
  </svg>
)

const DarkIcon = () => (
  <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
    <path
      fill="currentColor"
      d="M12 3a9 9 0 1 0 9 9c0-.46-.04-.92-.1-1.36A7 7 0 0 1 12.36 3.1c-.44-.06-.9-.1-1.36-.1z"
    />
  </svg>
)

const SystemIcon = () => (
  <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
    <path
      fill="currentColor"
      d="M21 16V4H3v12h18zm0 2H3a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h18a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2zm-9 3h6v1H6v-1h6z"
    />
  </svg>
)

const THEME_ICONS: Record<ThemeMode, () => React.JSX.Element> = {
  light: LightIcon,
  dark: DarkIcon,
  system: SystemIcon,
}

/** Cycles light → dark → system, which is faster than opening a menu. */
function ThemeToggle() {
  const { mode, setMode } = useTheme()
  const { t } = useI18n()

  const NEXT: Record<ThemeMode, ThemeMode> = { light: 'dark', dark: 'system', system: 'light' }
  const LABELS: Record<ThemeMode, string> = {
    light: t.app.themeLight,
    dark: t.app.themeDark,
    system: t.app.themeSystem,
  }
  const Icon = THEME_ICONS[mode]

  return (
    <button
      type="button"
      onClick={() => setMode(NEXT[mode])}
      aria-label={`${t.app.theme}: ${LABELS[mode]}`}
      title={`${t.app.theme}: ${LABELS[mode]}`}
      className="group relative flex h-10 items-center gap-2 overflow-hidden rounded-full px-3 text-on-surface-variant transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
    >
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-current opacity-0 transition-opacity group-hover:opacity-8 group-active:opacity-10"
      />
      <span className="relative">
        <Icon />
      </span>
      <span className="relative hidden text-sm font-medium sm:inline">{LABELS[mode]}</span>
    </button>
  )
}

function LanguageToggle() {
  const { language, setLanguage, t } = useI18n()

  return (
    <div
      role="radiogroup"
      aria-label={t.app.language}
      className="flex h-10 items-center overflow-hidden rounded-full border border-outline"
    >
      {(Object.keys(LANGUAGE_LABELS) as Language[]).map((code) => {
        const selected = code === language
        return (
          <button
            key={code}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => setLanguage(code)}
            className={
              'group relative h-full overflow-hidden px-3 text-sm font-medium transition-colors ' +
              'focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 ' +
              'focus-visible:outline-primary ' +
              (selected
                ? 'bg-secondary-container text-on-secondary-container'
                : 'text-on-surface-variant')
            }
          >
            <span
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 bg-current opacity-0 transition-opacity group-hover:opacity-8"
            />
            <span className="relative uppercase">{code}</span>
          </button>
        )
      })}
    </div>
  )
}

/**
 * The five supported currencies — every formatted amount, chart, and CSV
 * across all seven features reads from `useLocale()`, so switching here
 * re-renders everything live. Separators still follow the UI language, not
 * this choice — see `LocaleProvider`'s own doc comment for why.
 */
function CurrencySelector() {
  const { t } = useI18n()
  const { currency, setCurrency } = useLocale()

  const options = CURRENCY_CODES.map((code) => ({ code, label: CURRENCY_LABEL(t)[code] }))

  return (
    <div className="relative">
      <select
        aria-label={t.app.currency}
        value={currency}
        onChange={(event) => setCurrency(event.target.value)}
        className="h-10 cursor-pointer appearance-none rounded-full border border-outline bg-transparent pr-8 pl-3 text-sm font-medium text-on-surface focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
      >
        {options.map((option) => (
          <option key={option.code} value={option.code} className="bg-surface-container text-on-surface">
            {option.label}
          </option>
        ))}
      </select>
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 right-2 flex items-center"
      >
        <svg viewBox="0 0 24 24" className="h-4 w-4 text-on-surface-variant">
          <path fill="currentColor" d="M7.41 8.59 12 13.17l4.59-4.58L18 10l-6 6-6-6z" />
        </svg>
      </span>
    </div>
  )
}

const CURRENCY_LABEL = (t: ReturnType<typeof useI18n>['t']): Record<CurrencyCode, string> => ({
  USD: t.app.currencyUSD,
  EUR: t.app.currencyEUR,
  GBP: t.app.currencyGBP,
  KYD: t.app.currencyKYD,
  COP: t.app.currencyCOP,
})

function Shell() {
  const [active, setActive] = useHashTab<RouteId>(ROUTE_IDS, 'ahorro')
  const { t } = useI18n()

  // The tab the user was on right before "Iniciar sesión" — where /login
  // returns to, whether by finishing sign-in or by the escape hatch.
  // Adjusted during render rather than in an effect — React's documented
  // pattern for deriving state from a changed prop/value without the extra
  // post-commit render pass a `useEffect` would add: calling `setState` here,
  // guarded by the `prevActive` comparison, re-renders immediately with the
  // new value before anything paints, so there's no visible flash and no
  // second effect-timing pass.
  const [prevActive, setPrevActive] = useState(active)
  const [lastRealTab, setLastRealTab] = useState<TabId>(
    active === 'login' || active === 'ayuda' ? 'ahorro' : active,
  )
  if (active !== prevActive) {
    setPrevActive(active)
    if (active !== 'login' && active !== 'ayuda') setLastRealTab(active)
  }

  const tabs: { id: TabId; label: string }[] = [
    { id: 'ahorro', label: t.app.tabs.savings },
    { id: 'meta', label: t.app.tabs.savingsGoal },
    { id: 'retiro', label: t.app.tabs.retirement },
    { id: 'credito', label: t.app.tabs.loan },
    { id: 'consolidacion', label: t.app.tabs.debtConsolidation },
    { id: 'tarjeta', label: t.app.tabs.card },
    { id: 'presupuesto', label: t.app.tabs.budget },
  ]

  return (
    <div className="min-h-screen bg-surface text-on-surface">
      {/* M3 top app bar + primary tabs */}
      <header className="sticky top-0 z-20 bg-surface-container shadow-e1">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="flex h-16 items-center gap-3">
            <span
              aria-hidden="true"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-container text-sm font-medium text-on-primary-container"
            >
              FS
            </span>
            {/* M3 title-large */}
            <h1 className="truncate text-xl leading-7 font-normal">{t.app.title}</h1>
            <div className="ml-auto flex items-center gap-2">
              <LanguageToggle />
              <CurrencySelector />
              <ThemeToggle />
              <button
                type="button"
                onClick={() => setActive('ayuda')}
                aria-label={t.help.title}
                title={t.help.title}
                className="group relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full text-on-surface-variant transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              >
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 bg-current opacity-0 transition-opacity group-hover:opacity-8 group-active:opacity-10"
                />
                <svg viewBox="0 0 24 24" className="relative h-5 w-5" aria-hidden="true">
                  <path
                    fill="currentColor"
                    d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm1 17h-2v-2h2zm2.07-7.75-.9.92C13.45 12.9 13 13.5 13 15h-2v-.5c0-1.1.45-2.1 1.17-2.83l1.24-1.26c.37-.36.59-.86.59-1.41a2 2 0 1 0-4 0H8a4 4 0 1 1 8 0c0 .8-.32 1.53-.83 2.06z"
                  />
                </svg>
              </button>
              <AccountControl onRequestSignIn={() => setActive('login')} />
            </div>
          </div>

          <nav aria-label={t.app.navLabel} className="-mx-4 overflow-x-auto px-4 sm:-mx-6 sm:px-6">
            <ul className="flex min-w-max">
              {tabs.map((tab) => {
                const selected = tab.id === active
                return (
                  <li key={tab.id}>
                    <a
                      href={`#/${tab.id}`}
                      aria-current={selected ? 'page' : undefined}
                      onClick={(event) => {
                        event.preventDefault()
                        setActive(tab.id)
                      }}
                      className={
                        'group relative flex h-12 items-center px-4 text-sm font-medium ' +
                        'whitespace-nowrap transition-colors ' +
                        (selected ? 'text-primary' : 'text-on-surface-variant hover:text-on-surface')
                      }
                    >
                      <span
                        aria-hidden="true"
                        className="pointer-events-none absolute inset-0 bg-current opacity-0 transition-opacity group-hover:opacity-8"
                      />
                      <span className="relative">{tab.label}</span>
                      {/* M3 active indicator */}
                      <span
                        aria-hidden="true"
                        className={
                          'absolute inset-x-2 bottom-0 h-[3px] rounded-t-[3px] transition-opacity ' +
                          (selected ? 'bg-primary opacity-100' : 'opacity-0')
                        }
                      />
                    </a>
                  </li>
                )
              })}
            </ul>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-5 sm:px-6 sm:py-8">
        {active === 'login' ? (
          <LoginScreen onReturn={() => setActive(lastRealTab)} />
        ) : active === 'ayuda' ? (
          <HelpFeature onReturn={() => setActive(lastRealTab)} />
        ) : (
          <>
            {active === 'ahorro' && <SavingsFeature />}
            {active === 'meta' && <SavingsGoalFeature />}
            {active === 'retiro' && <RetirementFeature />}
            {active === 'credito' && <LoanFeature />}
            {active === 'consolidacion' && <DebtConsolidationFeature />}
            {active === 'tarjeta' && <CreditCardFeature />}
            {active === 'presupuesto' && <BudgetFeature />}
          </>
        )}
      </main>

      <footer className="mx-auto max-w-7xl px-4 pb-8 text-xs text-on-surface-variant sm:px-6">
        {t.app.footer}
      </footer>
    </div>
  )
}

export default function App() {
  return (
    <ThemeProvider>
      <I18nProvider>
        <LocaleProvider>
          <AuthProvider>
            <AccessGate>
              <Shell />
            </AccessGate>
          </AuthProvider>
        </LocaleProvider>
      </I18nProvider>
    </ThemeProvider>
  )
}
