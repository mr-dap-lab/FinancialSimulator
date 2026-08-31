/**
 * Debt consolidation model (feature: Consolidación de deudas).
 *
 * Pure and UI-free — no React, no DOM, no imports from `src/features`.
 *
 * This feature reads every quoted rate as Nominal M.V. (`toMonthlyRate(rate,
 * 'NOMINAL_MV')`), with no convention selector anywhere — verified against the
 * reference's own consolidated-loan figure ($5,000 at 11% over 120 months →
 * $68.88, exactly what `amortize()` produces under Nominal M.V., not E.A.).
 * That is the opposite of Crédito's own default convention (E.A.) — a real
 * difference between the two features, not an inconsistency to smooth over.
 */
import { amortize, levelPayment, toMonthlyRate } from './amortize'
import type { LoanParams, LoanRow } from './amortize'
import { todayIso } from './dates'

export const DEBT_RATE_CONVENTION = 'NOMINAL_MV' as const

export interface CreditCardDebt {
  id: string
  balance: number
  /** A fraction, Nominal M.V. */
  rate: number
  useMinimumPayment: boolean
  /** A fraction of the balance, e.g. 0.04. Only used when `useMinimumPayment`. */
  minimumPct: number
  /** Absolute floor under the minimum payment. 0 means no floor. */
  minimumFloor: number
  /** The entered fixed payment, used only when `!useMinimumPayment`. */
  payment: number
}

export interface InstallmentDebt {
  id: string
  balance: number
  /** A fraction, Nominal M.V. */
  rate: number
  payment: number
}

export interface OtherDebt extends InstallmentDebt {
  description: string
}

export interface ConsolidatedLoan {
  balance: number
  /** A fraction, Nominal M.V. */
  rate: number
  months: number
}

export interface DebtConsolidationParams {
  creditCards: CreditCardDebt[]
  autoLoans: InstallmentDebt[]
  otherLoans: OtherDebt[]
  consolidated: ConsolidatedLoan
}

export const MIN_CONSOLIDATED_MONTHS = 12
export const MAX_CONSOLIDATED_MONTHS = 360

/** `months (years yr/yrs)` dropdown steps, matching the reference's own spacing. */
export const CONSOLIDATED_TERM_OPTIONS = [
  12, 24, 36, 48, 60, 72, 84, 96, 108, 120, 180, 240, 300, 360,
] as const

let debtSeq = 0
const nextId = (prefix: string): string => `${prefix}-${++debtSeq}`

export const makeCreditCardDebt = (
  balance: number,
  rate: number,
  useMinimumPayment = true,
  payment = 0,
): CreditCardDebt => ({
  id: nextId('card'),
  balance,
  rate,
  useMinimumPayment,
  minimumPct: 0.04,
  minimumFloor: 0,
  payment,
})

export const makeInstallmentDebt = (balance: number, rate: number, payment: number): InstallmentDebt => ({
  id: nextId('installment'),
  balance,
  rate,
  payment,
})

export const makeOtherDebt = (
  description: string,
  balance: number,
  rate: number,
  payment: number,
): OtherDebt => ({
  id: nextId('other'),
  description,
  balance,
  rate,
  payment,
})

const sumBalances = (params: {
  creditCards: CreditCardDebt[]
  autoLoans: InstallmentDebt[]
  otherLoans: OtherDebt[]
}): number =>
  params.creditCards.reduce((sum, debt) => sum + debt.balance, 0) +
  params.autoLoans.reduce((sum, debt) => sum + debt.balance, 0) +
  params.otherLoans.reduce((sum, debt) => sum + debt.balance, 0)

export const createDebtConsolidationParams = (): DebtConsolidationParams => {
  const creditCards = [makeCreditCardDebt(5_000_000, 0.189, true)]
  const autoLoans = [makeInstallmentDebt(0, 0, 0)]
  const otherLoans = [makeOtherDebt('Préstamo personal', 0, 0, 0)]
  const balance = sumBalances({ creditCards, autoLoans, otherLoans })

  return {
    creditCards,
    autoLoans,
    otherLoans,
    consolidated: { balance, rate: 0.11, months: 120 },
  }
}

/** The live sum of every entered debt balance — the consolidated loan's default. */
export const totalDebtBalance = sumBalances

/**
 * The number of whole months a fixed `payment` takes to retire `balance` at
 * monthly rate `i`, via the closed-form annuity payoff formula (the inverse of
 * `levelPayment`) — no month-by-month loop needed for a quick inline figure.
 *
 * `null` when the payment never covers the interest, so the balance never
 * actually falls (the closed form would take the log of a non-positive
 * number).
 */
export function monthsToPayoff(balance: number, i: number, payment: number): number | null {
  if (balance <= 0) return 0
  if (payment <= balance * i) return null
  if (i === 0) return Math.ceil(balance / payment)
  return Math.ceil(-Math.log(1 - (i * balance) / payment) / Math.log(1 + i))
}

/** Total interest paid over a fixed-payment payoff — the last, smaller instalment is ignored. */
export function fixedPayoffInterest(balance: number, payment: number, months: number): number {
  return Math.max(0, payment * months - balance)
}

const DECLINING_PAYMENT_CAP_MONTHS = 1200

export interface DecliningPayoff {
  months: number | null
  totalInterest: number
}

/**
 * The classic minimum-payment trap: a payment that is a *percentage of the
 * current balance*, recomputed every month, rather than a fixed amount.
 * Simulated month by month — there is no closed form, because the payment
 * itself changes every month.
 *
 * `minPct` and `floor = 0` are a starting default (see the module doc on
 * `DEFAULT_MINIMUM_PCT`), not a verified issuer rule: confirm against a real
 * minimum-payment disclosure before trusting this for anything beyond the one
 * reference case this was checked against (which needed a small floor to
 * reproduce — see `debtConsolidation.test.ts`).
 */
export function monthsToPayoffDeclining(
  balance: number,
  i: number,
  minPct: number,
  floor = 0,
): DecliningPayoff {
  if (balance <= 0) return { months: 0, totalInterest: 0 }

  const epsilon = Math.max(balance * 1e-6, 0.01)
  let remaining = balance
  let totalInterest = 0

  for (let month = 1; month <= DECLINING_PAYMENT_CAP_MONTHS; month++) {
    const interest = remaining * i
    const payment = Math.max(remaining * minPct, floor)
    if (payment <= interest) return { months: null, totalInterest }

    const principal = payment - interest
    remaining -= principal
    totalInterest += interest

    if (remaining <= epsilon) return { months: month, totalInterest }
  }
  return { months: null, totalInterest }
}

export const DEFAULT_MINIMUM_PCT = 0.04

/**
 * One row of the detail table / CSV — every entered debt, current terms.
 *
 * `description` is only ever real text for "Otros" (the user's own free-text
 * field); a card or auto row leaves it blank and carries `categoryIndex`
 * instead (1-based position within its own category), so the UI can build a
 * translated label ("Tarjeta de crédito #2") without the model knowing about
 * language at all.
 */
export interface DebtRow {
  id: string
  type: 'card' | 'auto' | 'other'
  categoryIndex: number
  description: string
  balance: number
  rate: number
  payment: number
  months: number | null
  totalInterest: number | null
}

function creditCardRow(debt: CreditCardDebt, categoryIndex: number): DebtRow {
  const i = toMonthlyRate(debt.rate, DEBT_RATE_CONVENTION)

  if (debt.useMinimumPayment) {
    const firstPayment = Math.max(debt.balance * debt.minimumPct, debt.minimumFloor)
    const { months, totalInterest } = monthsToPayoffDeclining(
      debt.balance,
      i,
      debt.minimumPct,
      debt.minimumFloor,
    )
    return {
      id: debt.id,
      type: 'card',
      categoryIndex,
      description: '',
      balance: debt.balance,
      rate: debt.rate,
      payment: firstPayment,
      months,
      totalInterest: months === null ? null : totalInterest,
    }
  }

  const months = monthsToPayoff(debt.balance, i, debt.payment)
  return {
    id: debt.id,
    type: 'card',
    categoryIndex,
    description: '',
    balance: debt.balance,
    rate: debt.rate,
    payment: debt.payment,
    months,
    totalInterest: months === null ? null : fixedPayoffInterest(debt.balance, debt.payment, months),
  }
}

function installmentRow(
  debt: InstallmentDebt,
  type: 'auto' | 'other',
  categoryIndex: number,
  description: string,
): DebtRow {
  const i = toMonthlyRate(debt.rate, DEBT_RATE_CONVENTION)
  const months = monthsToPayoff(debt.balance, i, debt.payment)
  return {
    id: debt.id,
    type,
    categoryIndex,
    description,
    balance: debt.balance,
    rate: debt.rate,
    payment: debt.payment,
    months,
    totalInterest: months === null ? null : fixedPayoffInterest(debt.balance, debt.payment, months),
  }
}

/** Every entered debt as one flat list, in category order (cards, auto, other). */
export function buildDebtRows(params: DebtConsolidationParams): DebtRow[] {
  return [
    ...params.creditCards.map((debt, index) => creditCardRow(debt, index + 1)),
    ...params.autoLoans.map((debt, index) => installmentRow(debt, 'auto', index + 1, '')),
    ...params.otherLoans.map((debt, index) =>
      installmentRow(debt, 'other', index + 1, debt.description),
    ),
  ]
}

export const currentTotalPayment = (rows: DebtRow[]): number =>
  rows.reduce((sum, row) => sum + row.payment, 0)

/** The last debt to clear determines when the household is actually debt-free. Null if any never pays off. */
export const currentMonthsToPayoff = (rows: DebtRow[]): number | null => {
  if (rows.length === 0) return 0
  if (rows.some((row) => row.months === null)) return null
  return Math.max(...rows.map((row) => row.months as number))
}

export const currentTotalInterest = (rows: DebtRow[]): number | null => {
  if (rows.some((row) => row.totalInterest === null)) return null
  return rows.reduce((sum, row) => sum + (row.totalInterest ?? 0), 0)
}

export function buildConsolidatedLoanParams(consolidated: ConsolidatedLoan): LoanParams {
  return {
    principal: consolidated.balance,
    rate: consolidated.rate,
    rateConvention: DEBT_RATE_CONVENTION,
    months: consolidated.months,
    system: 'french',
    graceMonths: 0,
    graceType: 'interestOnly',
    lifeInsuranceRate: 0,
    assetInsurance: 0,
    adminFee: 0,
    disbursementDate: todayIso(),
    extraPayments: [],
  }
}

/** Reuses `amortize()` directly rather than re-deriving the payment formula. */
export function consolidatedLoanRows(consolidated: ConsolidatedLoan): LoanRow[] {
  return amortize(buildConsolidatedLoanParams(consolidated))
}

export const consolidatedPayment = (rows: LoanRow[]): number => rows[0]?.totalPayment ?? 0

export const consolidatedTotalInterest = (rows: LoanRow[]): number =>
  rows.reduce((sum, row) => sum + row.interest, 0)

/** Re-exported so tests can cross-check `monthsToPayoff` against the same formula `amortize()` uses. */
export { levelPayment }
