/**
 * Loan amortization model (feature: Crédito).
 *
 * Pure and UI-free — no React, no DOM, no imports from `src/features`.
 */
import { addMonths, todayIso } from './dates'

/** How the quoted rate should be read before it becomes a monthly rate. */
export type RateConvention = 'EA' | 'NOMINAL_MV' | 'MONTHLY'

export type AmortizationSystem = 'french' | 'german' | 'bullet'

/** During grace, either pay the interest or roll it into the balance. */
export type GraceType = 'interestOnly' | 'total'

/** Whether an extra payment buys a shorter term or a smaller instalment. */
export type ExtraPaymentEffect = 'reduceTerm' | 'reducePayment'

export interface ExtraPayment {
  id: string
  month: number
  amount: number
  effect: ExtraPaymentEffect
}

export interface LoanParams {
  principal: number
  /** A fraction, expressed in `rateConvention` (0.18 === 18 %). */
  rate: number
  rateConvention: RateConvention
  /** Term in months. */
  months: number
  system: AmortizationSystem
  graceMonths: number
  graceType: GraceType
  /** Monthly life insurance as a fraction of the outstanding balance. */
  lifeInsuranceRate: number
  /** Flat monthly asset/all-risk insurance. */
  assetInsurance: number
  /** Flat monthly administration or origination fee. */
  adminFee: number
  /** ISO `yyyy-mm-dd`. Used only to label rows with real dates. */
  disbursementDate: string
  extraPayments: ExtraPayment[]
}

export interface LoanRow {
  month: number
  year: number
  monthOfYear: number
  /** ISO `yyyy-mm-dd` for this instalment. */
  date: string
  openingBalance: number
  /** Principal + interest, before insurance and charges. */
  payment: number
  interest: number
  principalPaid: number
  extraPayment: number
  lifeInsurance: number
  /** Asset insurance + admin fee. */
  fixedCharges: number
  /** Life insurance + fixed charges — the "Seguros" column. */
  insurance: number
  /** What actually leaves the account: payment + insurance + extra. */
  totalPayment: number
  balance: number
  /** True while the loan is inside its grace period. */
  isGrace: boolean
}

export interface LoanTotals {
  monthlyRate: number
  /** The instalment for the first amortising month. */
  firstPayment: number
  lastPayment: number
  /** True when every instalment is the same, i.e. French with no extras. */
  levelPayment: boolean
  totalPaid: number
  totalInterest: number
  totalInsurance: number
  totalExtra: number
  /** (interest + insurance) / principal. */
  creditCost: number
  months: number
  /** ISO date of the final instalment. */
  lastDate: string
  /** Versus the same loan without extra payments. Null when there are none. */
  savings: { interest: number; months: number } | null
  /** First month where principal repaid exceeds interest. Null if never. */
  crossoverMonth: number | null
}

export const MIN_LOAN_MONTHS = 6
export const MAX_LOAN_MONTHS = 360

/** Balances below this are treated as zero — the loan is closed. */
const EPSILON = 0.005

let extraSeq = 0
export const nextExtraPaymentId = (): string => 'extra-' + ++extraSeq

export const makeExtraPayment = (
  month: number,
  amount: number,
  effect: ExtraPaymentEffect = 'reduceTerm',
): ExtraPayment => ({ id: nextExtraPaymentId(), month, amount, effect })

export const DEFAULT_LOAN_PARAMS: Omit<LoanParams, 'disbursementDate'> = {
  principal: 50_000_000,
  rate: 0.18,
  rateConvention: 'EA',
  months: 60,
  system: 'french',
  graceMonths: 0,
  graceType: 'interestOnly',
  lifeInsuranceRate: 0,
  assetInsurance: 0,
  adminFee: 0,
  extraPayments: [],
}

export const createLoanParams = (): LoanParams => ({
  ...DEFAULT_LOAN_PARAMS,
  disbursementDate: todayIso(),
  extraPayments: [],
})

/**
 * Normalises a quoted rate to a monthly effective rate.
 *
 * This runs before anything else in the model, so every downstream formula can
 * assume a plain monthly rate.
 */
export function toMonthlyRate(rate: number, convention: RateConvention): number {
  switch (convention) {
    case 'EA':
      return Math.pow(1 + rate, 1 / 12) - 1
    case 'NOMINAL_MV':
      return rate / 12
    case 'MONTHLY':
      return rate
  }
}

/**
 * The level payment that retires `balance` over `months` at `monthlyRate`.
 *
 * Falls back to straight-line at a zero rate, where the annuity formula divides
 * by zero.
 */
export function levelPayment(balance: number, monthlyRate: number, months: number): number {
  if (months <= 0) return 0
  if (monthlyRate === 0) return balance / months
  return (balance * monthlyRate) / (1 - Math.pow(1 + monthlyRate, -months))
}

/** Merges extras that land on the same month; the earliest row's effect wins. */
function extrasByMonth(extraPayments: ExtraPayment[]): Map<number, ExtraPayment> {
  const merged = new Map<number, ExtraPayment>()
  for (const extra of [...extraPayments].sort((a, b) => a.month - b.month)) {
    if (extra.amount <= 0) continue
    const existing = merged.get(extra.month)
    if (existing) existing.amount += extra.amount
    else merged.set(extra.month, { ...extra })
  }
  return merged
}

/**
 * Builds the amortization schedule.
 *
 * The instalment is *recomputed* from the outstanding balance and the remaining
 * term whenever an extra payment lands with `reducePayment`, rather than being
 * patched — that is what keeps the schedule internally consistent and the final
 * balance exactly zero.
 */
export function amortize(params: LoanParams): LoanRow[] {
  const totalMonths = Math.max(0, Math.round(params.months))
  if (totalMonths === 0 || params.principal <= 0) return []

  const rate = toMonthlyRate(params.rate, params.rateConvention)
  const grace = Math.min(Math.max(0, Math.round(params.graceMonths)), totalMonths)
  const extras = extrasByMonth(params.extraPayments)
  const fixedCharges = params.assetInsurance + params.adminFee

  const rows: LoanRow[] = []
  let balance = params.principal

  interface RowInput {
    month: number
    openingBalance: number
    payment: number
    interest: number
    principalPaid: number
    extraPayment: number
    isGrace: boolean
  }

  const pushRow = ({
    month,
    openingBalance,
    payment,
    interest,
    principalPaid,
    extraPayment,
    isGrace,
  }: RowInput) => {
    const lifeInsurance = openingBalance * params.lifeInsuranceRate
    const insurance = lifeInsurance + fixedCharges
    rows.push({
      month,
      year: Math.floor((month - 1) / 12) + 1,
      monthOfYear: ((month - 1) % 12) + 1,
      date: addMonths(params.disbursementDate, month),
      openingBalance,
      payment,
      interest,
      principalPaid,
      extraPayment,
      lifeInsurance,
      fixedCharges,
      insurance,
      // Extras are cash out the door in that month, so they belong in the total.
      totalPayment: payment + insurance + extraPayment,
      balance,
      isGrace,
    })
  }

  // --- Grace period -------------------------------------------------------
  for (let month = 1; month <= grace; month++) {
    const openingBalance = balance
    const interest = openingBalance * rate

    if (params.graceType === 'total') {
      // Interest is capitalised: nothing is paid and the balance grows.
      balance = openingBalance + interest
    } else {
      balance = openingBalance
    }

    const extra = extras.get(month)
    const extraPayment = extra ? Math.min(extra.amount, balance) : 0
    balance -= extraPayment

    pushRow({
      month,
      openingBalance,
      // Under a total grace nothing is paid; the interest is capitalised above.
      payment: params.graceType === 'total' ? 0 : interest,
      interest,
      principalPaid: 0,
      extraPayment,
      isGrace: true,
    })
  }

  // --- Amortization -------------------------------------------------------
  const amortizingMonths = totalMonths - grace
  if (amortizingMonths <= 0) return rows

  // Both of these are recomputed whenever a `reducePayment` extra lands.
  let payment = levelPayment(balance, rate, amortizingMonths)
  let principalStep = balance / amortizingMonths

  for (let month = grace + 1; month <= totalMonths && balance > EPSILON; month++) {
    const openingBalance = balance
    const interest = openingBalance * rate
    const isFinalScheduledMonth = month === totalMonths

    let principalPaid: number
    if (isFinalScheduledMonth) {
      // Absorb any rounding residue so the balance lands exactly on zero.
      principalPaid = openingBalance
    } else if (params.system === 'german') {
      principalPaid = Math.min(principalStep, openingBalance)
    } else if (params.system === 'bullet') {
      principalPaid = 0
    } else {
      principalPaid = Math.min(payment - interest, openingBalance)
    }

    const afterScheduled = openingBalance - principalPaid
    const extra = extras.get(month)
    const extraPayment = extra ? Math.min(extra.amount, afterScheduled) : 0

    balance = afterScheduled - extraPayment
    if (balance < EPSILON) balance = 0

    pushRow({
      month,
      openingBalance,
      payment: interest + principalPaid,
      interest,
      principalPaid,
      extraPayment,
      isGrace: false,
    })

    if (extra && extra.effect === 'reducePayment' && balance > EPSILON) {
      // Keep the original end date and shrink the instalment instead.
      const monthsLeft = totalMonths - month
      payment = levelPayment(balance, rate, monthsLeft)
      principalStep = monthsLeft > 0 ? balance / monthsLeft : balance
    }
  }

  return rows
}

export function summarizeLoan(
  rows: LoanRow[],
  params: LoanParams,
  /** The same loan with `extraPayments: []`, for the savings card. */
  baseline?: LoanRow[],
): LoanTotals {
  const totals = rows.reduce(
    (acc, row) => {
      acc.totalPaid += row.totalPayment
      acc.totalInterest += row.interest
      acc.totalInsurance += row.insurance
      acc.totalExtra += row.extraPayment
      return acc
    },
    { totalPaid: 0, totalInterest: 0, totalInsurance: 0, totalExtra: 0 },
  )

  const amortizing = rows.filter((row) => !row.isGrace)
  const first = amortizing[0] ?? rows[0]
  const last = rows[rows.length - 1]

  const levelPaymentSchedule =
    params.system === 'french' &&
    amortizing.length > 0 &&
    amortizing.every((row) => Math.abs(row.payment - amortizing[0].payment) < 0.01)

  const crossover = rows.find((row) => row.principalPaid > row.interest)

  let savings: LoanTotals['savings'] = null
  if (baseline && baseline.length > 0 && totals.totalExtra > 0) {
    const baselineInterest = baseline.reduce((sum, row) => sum + row.interest, 0)
    savings = {
      interest: baselineInterest - totals.totalInterest,
      months: baseline.length - rows.length,
    }
  }

  return {
    ...totals,
    monthlyRate: toMonthlyRate(params.rate, params.rateConvention),
    firstPayment: first?.totalPayment ?? 0,
    lastPayment: last?.totalPayment ?? 0,
    levelPayment: levelPaymentSchedule,
    creditCost:
      params.principal > 0 ? (totals.totalInterest + totals.totalInsurance) / params.principal : 0,
    months: rows.length,
    lastDate: last?.date ?? params.disbursementDate,
    savings,
    crossoverMonth: crossover?.month ?? null,
  }
}
