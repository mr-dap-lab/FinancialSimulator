/**
 * Savings projection model (feature: Ahorro).
 *
 * Pure and UI-free: this module must never import React, the DOM, or anything
 * under `src/features`. It is the single source of truth for the savings math.
 */

/** How a rate tier table is evaluated. */
export type RateTierMode = 'age' | 'balance'

/**
 * One row of the rate tier table.
 *
 * `from` means "desde el mes" in `age` mode and "saldo mínimo" in `balance`
 * mode; `annualRate` is a fraction (0.11 === 11 %).
 */
export interface RateTier {
  id: string
  from: number
  annualRate: number
}

/** Everything the user controls in the savings parameters panel. */
export interface SavingsParams {
  /** Fixed monthly contribution, in whole currency units. */
  monthlyContribution: number
  /** Nominal annual rate, as a fraction (0.11 === 11 %). */
  annualRate: number
  /** Projection horizon in years. */
  years: number
  /** Withholding tax on interest, as a fraction (0.07 === 7 %). */
  withholdingRate: number
  /** Annual step-up applied to the contribution, as a fraction. */
  contributionGrowth: number
  /**
   * When false (the default, and what the source spreadsheet does) the monthly
   * credit is the annual interest divided by 12. When true the model instead
   * compounds a true effective monthly rate. See `monthlyInterestOn`.
   */
  realMonthlyCompounding: boolean
  /** When false the projection uses `annualRate` for every month. */
  tiersEnabled: boolean
  tierMode: RateTierMode
  tiers: RateTier[]
}

/** One month of the projected schedule. */
export interface SavingsRow {
  /** 1-based month index over the whole horizon. */
  month: number
  /** 1-based year the month belongs to. */
  year: number
  /** 1..12 position inside the year. */
  monthOfYear: number
  /** Annual rate that applied to this month, as a fraction. */
  annualRate: number
  contribution: number
  /** Gross annualised interest for the month. */
  grossAnnualInterest: number
  /** Withholding. Always <= 0. */
  withholding: number
  netAnnualInterest: number
  /** The amount actually credited to the balance this month. */
  monthlyInterest: number
  balance: number
  /** Running sum of contributions through this month. */
  contributedToDate: number
}

/** Headline figures derived from a schedule. */
export interface SavingsTotals {
  finalBalance: number
  totalContributed: number
  grossInterest: number
  /** Always <= 0. */
  totalWithholding: number
  netInterest: number
  /** finalBalance / totalContributed. 0 when nothing was contributed. */
  multiplier: number
  months: number
}

let tierSeq = 0
/** Ids only need to be stable within a session — they key React lists. */
export const nextTierId = (): string => 'tier-' + ++tierSeq

export const makeTier = (from: number, annualRate: number): RateTier => ({
  id: nextTierId(),
  from,
  annualRate,
})

export const MIN_YEARS = 1
export const MAX_YEARS = 40

export const DEFAULT_SAVINGS_PARAMS: SavingsParams = {
  monthlyContribution: 500_000,
  annualRate: 0.11,
  years: 15,
  withholdingRate: 0.07,
  contributionGrowth: 0,
  realMonthlyCompounding: false,
  tiersEnabled: false,
  tierMode: 'age',
  tiers: [],
}

/** A fresh copy of the defaults, including a first tier bound to the base rate. */
export const createSavingsParams = (): SavingsParams => ({
  ...DEFAULT_SAVINGS_PARAMS,
  tiers: [makeTier(1, DEFAULT_SAVINGS_PARAMS.annualRate)],
})

/**
 * Sorts tiers ascending and pins the first one to the start of its domain
 * (month 1 for `age`, balance 0 for `balance`), which is what makes a tier
 * table total: every month/balance resolves to exactly one tier.
 */
export function normalizeTiers(tiers: RateTier[], mode: RateTierMode): RateTier[] {
  const floor = mode === 'age' ? 1 : 0
  const sorted = [...tiers].sort((a, b) => a.from - b.from)
  if (sorted.length > 0) sorted[0] = { ...sorted[0], from: floor }
  return sorted
}

/**
 * Resolves the annual rate for a month.
 *
 * In `age` mode it is the tier with the largest `from` <= month; in `balance`
 * mode the largest `from` <= the *prior* month's balance, so the rate steps up
 * as the fund grows.
 */
export function resolveRate(
  params: SavingsParams,
  month: number,
  previousBalance: number,
): number {
  if (!params.tiersEnabled || params.tiers.length <= 1) return params.annualRate

  const tiers = normalizeTiers(params.tiers, params.tierMode)
  const key = params.tierMode === 'age' ? month : previousBalance

  let rate = tiers[0].annualRate
  for (const tier of tiers) {
    if (tier.from <= key) rate = tier.annualRate
    else break
  }
  return rate
}

/**
 * The monthly credit, before withholding.
 *
 * Default: the annual interest on the base, divided by 12 — this is what the
 * source spreadsheet does, so it stays the default.
 *
 * `realMonthlyCompounding`: the effective monthly rate implied by the annual
 * rate, `(1 + r)^(1/12) - 1`, which is what "compounding monthly" actually
 * means. It is deliberately *not* `r / 12`: applying `r / 12` net of the same
 * withholding reproduces the default formula exactly, so the toggle would do
 * nothing.
 */
function monthlyInterestOn(base: number, annualRate: number, real: boolean): number {
  return real
    ? base * (Math.pow(1 + annualRate, 1 / 12) - 1)
    : (base * annualRate) / 12
}

/**
 * Projects the fund month by month.
 *
 * Month 1 seeds its interest off the contribution rather than a zero prior
 * balance, because there is no prior balance yet. That is intentional and
 * matches the source spreadsheet.
 */
export function simulate(params: SavingsParams): SavingsRow[] {
  const months = Math.max(0, Math.round(params.years * 12))
  const rows: SavingsRow[] = []

  let balance = 0
  let contributedToDate = 0

  for (let month = 1; month <= months; month++) {
    const year = Math.floor((month - 1) / 12) + 1
    const previousBalance = balance

    const contribution =
      params.monthlyContribution * Math.pow(1 + params.contributionGrowth, year - 1)
    const annualRate = resolveRate(params, month, previousBalance)

    // No prior balance in month 1, so the contribution stands in for it.
    const base = month === 1 ? contribution : previousBalance

    const grossMonthly = monthlyInterestOn(base, annualRate, params.realMonthlyCompounding)
    // Reported as an annual figure so the column means the same thing in both modes.
    const grossAnnualInterest = grossMonthly * 12
    const withholding = -grossAnnualInterest * params.withholdingRate
    const netAnnualInterest = grossAnnualInterest + withholding
    const monthlyInterest = netAnnualInterest / 12

    balance = previousBalance + contribution + monthlyInterest
    contributedToDate += contribution

    rows.push({
      month,
      year,
      monthOfYear: ((month - 1) % 12) + 1,
      annualRate,
      contribution,
      grossAnnualInterest,
      withholding,
      netAnnualInterest,
      monthlyInterest,
      balance,
      contributedToDate,
    })
  }

  return rows
}

/** Rolls a schedule up into the headline figures shown in the summary cards. */
export function summarizeSavings(rows: SavingsRow[]): SavingsTotals {
  const totals = rows.reduce(
    (acc, row) => {
      acc.totalContributed += row.contribution
      acc.grossInterest += row.grossAnnualInterest / 12
      acc.totalWithholding += row.withholding / 12
      acc.netInterest += row.monthlyInterest
      return acc
    },
    { totalContributed: 0, grossInterest: 0, totalWithholding: 0, netInterest: 0 },
  )

  const finalBalance = rows.length > 0 ? rows[rows.length - 1].balance : 0

  return {
    ...totals,
    finalBalance,
    multiplier: totals.totalContributed > 0 ? finalBalance / totals.totalContributed : 0,
    months: rows.length,
  }
}
