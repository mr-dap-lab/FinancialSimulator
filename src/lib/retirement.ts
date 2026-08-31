/**
 * Retirement model (feature: Retiro).
 *
 * Pure and UI-free — no React, no DOM, no imports from `src/features`.
 *
 * Two phases, two different annuity conventions on purpose:
 * - Accumulation: annuity-due (contribution at the *start* of each year),
 *   same convention as `savingsGoal.ts`.
 * - Withdrawal: ordinary annuity (income at the *end* of each month) — the
 *   one place this app departs from "period start," because that is the only
 *   convention that reproduces the reference calculator's own numbers here.
 */
import { toMonthlyRate } from './amortize'

export interface RetirementParams {
  startingBalance: number
  annualContribution: number
  currentAge: number
  retirementAge: number
  retirementYears: number
  /** `contribution[t] = annualContribution × (1 + inflation) ^ (t - 1)`. */
  growContributionsWithInflation: boolean
  /** Governs which tax branch applies — see `resolveEffectiveRates`. */
  taxDeferred: boolean
  returnBeforeRetirement: number
  returnDuringRetirement: number
  currentTaxRate: number
  retirementTaxRate: number
  inflation: number
}

export const MIN_CURRENT_AGE = 18
export const MAX_CURRENT_AGE = 90
export const MIN_RETIREMENT_AGE = 40
export const MAX_RETIREMENT_AGE = 90
export const MIN_RETIREMENT_YEARS = 1
export const MAX_RETIREMENT_YEARS = 50

export const DEFAULT_RETIREMENT_PARAMS: RetirementParams = {
  startingBalance: 250_000_000,
  annualContribution: 24_000_000,
  currentAge: 45,
  retirementAge: 65,
  retirementYears: 30,
  growContributionsWithInflation: false,
  taxDeferred: true,
  returnBeforeRetirement: 0.07,
  returnDuringRetirement: 0.04,
  currentTaxRate: 0,
  retirementTaxRate: 0,
  inflation: 0.03,
}

export const createRetirementParams = (): RetirementParams => ({ ...DEFAULT_RETIREMENT_PARAMS })

/**
 * Tax-deferred: contributions grow at the stated rate untaxed, and the
 * withdrawal itself is taxed later (`resolveMonthlyIncome` below).
 * Not tax-deferred: there is no later withdrawal tax, so the rate is taxed
 * every year instead — this is what keeps either branch from taxing twice.
 */
export function resolveEffectiveRates(
  params: RetirementParams,
): { before: number; during: number } {
  return {
    before: params.taxDeferred
      ? params.returnBeforeRetirement
      : params.returnBeforeRetirement * (1 - params.currentTaxRate),
    during: params.taxDeferred
      ? params.returnDuringRetirement
      : params.returnDuringRetirement * (1 - params.retirementTaxRate),
  }
}

/**
 * Future value of a starting balance plus a *sequence* of annuity-due
 * contributions (one per year, contributed before that year's growth) —
 * `contributions[i]` is the amount contributed in year `i + 1`. This is
 * `savingsGoal.fv` generalised from a flat contribution to a schedule, which
 * is what supporting inflation-growing contributions needs.
 */
export function accumulate(startingBalance: number, contributions: number[], rate: number): number {
  let balance = startingBalance
  for (const contribution of contributions) {
    balance = (balance + contribution) * (1 + rate)
  }
  return balance
}

/** The annual contribution schedule for the accumulation phase. */
export function buildContributionSchedule(params: RetirementParams): number[] {
  const years = Math.max(0, params.retirementAge - params.currentAge)
  return Array.from({ length: years }, (_, index) =>
    params.growContributionsWithInflation
      ? params.annualContribution * Math.pow(1 + params.inflation, index)
      : params.annualContribution,
  )
}

/**
 * The ordinary-annuity monthly payment that fully depletes `balance` over
 * `months` at monthly rate `i` — income paid at the end of each month, unlike
 * every annuity-due elsewhere in this app. `i === 0` falls back to simple
 * linear drawdown, where the annuity formula divides by zero.
 */
export function monthlyIncomeFromBalance(balance: number, i: number, months: number): number {
  if (months <= 0) return 0
  if (i === 0) return balance / months
  return (balance * i) / (1 - Math.pow(1 + i, -months))
}

/** The goal's value in today's purchasing power, discounted by `years` of inflation. */
export function purchasingPowerToday(amount: number, inflation: number, years: number): number {
  return amount / Math.pow(1 + inflation, years)
}

export interface RetirementResult {
  effectiveReturnBeforeRetirement: number
  effectiveReturnDuringRetirement: number
  monthlyRateDuringRetirement: number
  contributions: number[]
  /** Balance at the moment retirement starts. */
  balanceAtRetirement: number
  monthlyIncomeBeforeTax: number
  monthlyIncomeAfterTax: number
  /** `monthlyIncomeAfterTax` in today's purchasing power — the headline figure. */
  monthlyIncomeToday: number
}

export function evaluateRetirement(params: RetirementParams): RetirementResult {
  const { before, during } = resolveEffectiveRates(params)
  const contributions = buildContributionSchedule(params)
  const balanceAtRetirement = accumulate(params.startingBalance, contributions, before)

  const im = toMonthlyRate(during, 'EA')
  const months = Math.max(0, Math.round(params.retirementYears * 12))
  const monthlyIncomeBeforeTax = monthlyIncomeFromBalance(balanceAtRetirement, im, months)

  // Tax-deferred: the withdrawal is taxed now. Not deferred: the growth rate
  // was already taxed every year above, so the withdrawal itself is not
  // taxed again.
  const monthlyIncomeAfterTax = params.taxDeferred
    ? monthlyIncomeBeforeTax * (1 - params.retirementTaxRate)
    : monthlyIncomeBeforeTax

  const yearsToRetirement = Math.max(0, params.retirementAge - params.currentAge)

  return {
    effectiveReturnBeforeRetirement: before,
    effectiveReturnDuringRetirement: during,
    monthlyRateDuringRetirement: im,
    contributions,
    balanceAtRetirement,
    monthlyIncomeBeforeTax,
    monthlyIncomeAfterTax,
    monthlyIncomeToday: purchasingPowerToday(monthlyIncomeAfterTax, params.inflation, yearsToRetirement),
  }
}

export interface AccumulationYearRow {
  year: number
  age: number
  contribution: number
  balance: number
}

/** One row per year of the accumulation phase, ages `currentAge` to `retirementAge - 1`. */
export function buildAccumulationSchedule(params: RetirementParams): AccumulationYearRow[] {
  const { before } = resolveEffectiveRates(params)
  const contributions = buildContributionSchedule(params)

  const rows: AccumulationYearRow[] = []
  let balance = params.startingBalance
  contributions.forEach((contribution, index) => {
    balance = (balance + contribution) * (1 + before)
    rows.push({ year: index + 1, age: params.currentAge + index, contribution, balance })
  })
  return rows
}

export interface RetirementYearRow {
  year: number
  age: number
  /** The January instalment for that year, representative of the monthly income. */
  monthlyIncome: number
  remainingBalance: number
}

/** One row per year of the withdrawal phase, ages `retirementAge` to `retirementAge + retirementYears - 1`. */
export function buildRetirementSchedule(
  params: RetirementParams,
  result: RetirementResult,
): RetirementYearRow[] {
  const months = Math.max(0, Math.round(params.retirementYears * 12))
  const im = result.monthlyRateDuringRetirement
  const payment = result.monthlyIncomeBeforeTax

  const rows: RetirementYearRow[] = []
  let balance = result.balanceAtRetirement
  for (let month = 1; month <= months; month++) {
    balance = balance * (1 + im) - payment
    if (month % 12 === 0) {
      const year = month / 12
      rows.push({
        year,
        age: params.retirementAge + year - 1,
        monthlyIncome: result.monthlyIncomeAfterTax,
        remainingBalance: Math.max(0, balance),
      })
    }
  }
  return rows
}

export interface RetirementMonthPoint {
  month: number
  age: number
  balance: number
}

/**
 * Month-by-month depletion of the balance through the withdrawal phase —
 * feeds the optional "Saldo durante el retiro" chart, which the reference
 * calculator does not show but the model already has everything needed for.
 */
export function buildRetirementDepletion(
  params: RetirementParams,
  result: RetirementResult,
): RetirementMonthPoint[] {
  const months = Math.max(0, Math.round(params.retirementYears * 12))
  const im = result.monthlyRateDuringRetirement
  const payment = result.monthlyIncomeBeforeTax

  const points: RetirementMonthPoint[] = [
    { month: 0, age: params.retirementAge, balance: result.balanceAtRetirement },
  ]
  let balance = result.balanceAtRetirement
  for (let month = 1; month <= months; month++) {
    balance = Math.max(0, balance * (1 + im) - payment)
    points.push({ month, age: params.retirementAge + month / 12, balance })
  }
  return points
}
