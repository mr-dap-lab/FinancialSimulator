/**
 * Credit card model (feature: Tarjeta de crédito).
 *
 * Pure and UI-free — no React, no DOM, no imports from `src/features`.
 *
 * The rate convention helper is shared with the loan model rather than
 * duplicated, so both features read a quoted rate the same way.
 */
import { toMonthlyRate } from './amortize'
import type { RateConvention } from './amortize'
import { addDays, addMonths, withDayOfMonth } from './dates'

export type PaymentStrategy = 'full' | 'minimum' | 'fixed' | 'percentage'

/** A purchase split into `installments` monthly charges. */
export interface DeferredPurchase {
  id: string
  description: string
  amount: number
  /** 1-based month of the horizon in which the purchase is made. */
  purchaseMonth: number
  installments: number
  /** No finance charge: the amount is split evenly. */
  interestFree: boolean
}

/** A charge that repeats every month over a window. */
export interface RecurringExpense {
  id: string
  description: string
  monthlyAmount: number
  startMonth: number
  /** Inclusive. */
  endMonth: number
  /** When true each month's charge starts its own installment plan. */
  defer: boolean
}

export interface CreditCardParams {
  creditLimit: number
  /** Revolving balance carried in before month 1. */
  openingBalance: number
  /** A fraction, expressed in `rateConvention`. */
  rate: number
  rateConvention: RateConvention
  /** Legal cap, as an effective annual fraction. Display check only. */
  usuryRate: number
  monthlyFee: number
  feeIncludesVat: boolean
  /** Statement cutoff day, 1–28. */
  cutoffDay: number
  months: number
  strategy: PaymentStrategy
  /** `minimum`: share of the revolving balance included in the minimum. */
  minimumRate: number
  /** `minimum`: absolute floor under the payment. */
  minimumFloor: number
  /** `fixed`: the flat monthly payment. */
  fixedPayment: number
  /** `percentage`: share of the statement balance paid. */
  percentagePayment: number
  /** Installments used when a deferred recurring charge spawns a plan. */
  defaultInstallments: number
  deferredPurchases: DeferredPurchase[]
  recurringExpenses: RecurringExpense[]
  /** ISO `yyyy-mm-dd`; only used to label rows with cutoff and due dates. */
  startDate: string
}

/** One installment plan's contribution to a single month. */
export interface InstallmentCharge {
  planId: string
  description: string
  /** 1-based instalment index within the plan. */
  installment: number
  installments: number
  amount: number
  principal: number
  interest: number
  /** Principal still owed on this plan after the month's charge. */
  remainingPrincipal: number
}

export interface CardMonth {
  month: number
  year: number
  monthOfYear: number
  /** ISO statement cutoff date. */
  cutoffDate: string
  /** ISO payment due date — cutoff + 15 days. */
  dueDate: string
  openingRevolving: number
  interest: number
  /** Non-deferred charges that land straight in the revolving balance. */
  revolvingPurchases: number
  fee: number
  /** Sum of every active installment plan's charge this month. */
  installmentCharges: number
  charges: InstallmentCharge[]
  payment: number
  revolvingBalance: number
  /** Revolving balance + principal still owed on open installment plans. */
  totalBalance: number
  /** Principal not yet billed across all open plans. */
  pendingInstallmentPrincipal: number
  /** totalBalance / creditLimit, as a fraction. */
  utilization: number
}

export interface StrategyOutcome {
  strategy: PaymentStrategy
  totalPaid: number
  totalInterest: number
  /** Null when the payment never covers interest plus fee. */
  monthsToZero: number | null
}

export interface CardTotals {
  monthlyRate: number
  months: number
  nextPayment: number
  nextDueDate: string
  totalPaid: number
  totalInterest: number
  totalFees: number
  monthsToZero: number | null
  /** Utilization at the final month. */
  finalUtilization: number
  peakUtilization: number
  /** First month the projection exceeds the limit, if any. */
  overLimitMonth: number | null
  /** True when the quoted rate is above the usury cap. Display only. */
  exceedsUsury: boolean
}

export type CardFranchise = 'visa' | 'mastercard' | 'amex' | 'discover' | 'diners'

export const CARD_FRANCHISES: readonly CardFranchise[] = [
  'visa',
  'mastercard',
  'amex',
  'discover',
  'diners',
]

/**
 * One user-managed card: its own identity (name, franchise) plus its own
 * complete, independently-simulated `CreditCardParams`. The feature keeps a
 * list of these and simulates only whichever one is active — see
 * `useCreditCard`'s own doc comment for why that's the chosen scope.
 */
export interface CardProfile {
  id: string
  name: string
  franchise: CardFranchise
  params: CreditCardParams
}

export const MIN_CARD_MONTHS = 6
export const MAX_CARD_MONTHS = 120
export const VAT_RATE = 0.19
/** Payment due date is the cutoff plus this many days. */
export const DUE_DATE_OFFSET_DAYS = 15

const EPSILON = 0.005

let purchaseSeq = 0
const nextId = (prefix: string): string => `${prefix}-${++purchaseSeq}`

export const makeDeferredPurchase = (
  description: string,
  amount: number,
  purchaseMonth: number,
  installments: number,
  interestFree = false,
): DeferredPurchase => ({
  id: nextId('purchase'),
  description,
  amount,
  purchaseMonth,
  installments,
  interestFree,
})

export const makeRecurringExpense = (
  description: string,
  monthlyAmount: number,
  startMonth: number,
  endMonth: number,
  defer = false,
): RecurringExpense => ({
  id: nextId('recurring'),
  description,
  monthlyAmount,
  startMonth,
  endMonth,
  defer,
})

export const createCardParams = (): CreditCardParams => ({
  creditLimit: 10_000_000,
  openingBalance: 0,
  rate: 0.25,
  rateConvention: 'EA',
  usuryRate: 0.25,
  monthlyFee: 25_000,
  feeIncludesVat: true,
  cutoffDay: 15,
  months: 36,
  strategy: 'minimum',
  minimumRate: 0.05,
  minimumFloor: 50_000,
  fixedPayment: 500_000,
  percentagePayment: 0.1,
  defaultInstallments: 1,
  // Seeded so the app is never empty on first load.
  deferredPurchases: [
    makeDeferredPurchase('Portátil', 3_000_000, 1, 12, false),
    makeDeferredPurchase('Vuelo', 1_800_000, 3, 6, true),
  ],
  recurringExpenses: [makeRecurringExpense('Mercado y suscripciones', 400_000, 1, 36, false)],
  startDate: withDayOfMonth(new Date().toISOString().slice(0, 10), 15),
})

export function createCardProfile(name: string, franchise: CardFranchise = 'visa'): CardProfile {
  return { id: nextId('card'), name, franchise, params: createCardParams() }
}

/**
 * The per-instalment payment schedule for one purchase.
 *
 * Interest-free purchases split evenly; otherwise it is the standard annuity,
 * so the principal components sum back to the purchase amount.
 */
export function installmentPlan(
  amount: number,
  installments: number,
  monthlyRate: number,
  interestFree: boolean,
): number[] {
  const count = Math.max(0, Math.round(installments))
  if (count === 0 || amount <= 0) return []

  if (interestFree || monthlyRate === 0) {
    return new Array(count).fill(amount / count)
  }

  const payment = (amount * monthlyRate) / (1 - Math.pow(1 + monthlyRate, -count))
  return new Array(count).fill(payment)
}

/** The principal/interest split of a plan, month by month. */
function planSchedule(
  amount: number,
  installments: number,
  monthlyRate: number,
  interestFree: boolean,
): { payment: number; principal: number; interest: number; remaining: number }[] {
  const payments = installmentPlan(amount, installments, monthlyRate, interestFree)
  const rate = interestFree ? 0 : monthlyRate
  const schedule: { payment: number; principal: number; interest: number; remaining: number }[] = []

  let remaining = amount
  payments.forEach((payment, index) => {
    const interest = remaining * rate
    // The last instalment absorbs any rounding residue so principal sums exactly.
    const principal = index === payments.length - 1 ? remaining : payment - interest
    remaining = Math.max(0, remaining - principal)
    schedule.push({ payment, principal, interest, remaining })
  })

  return schedule
}

interface ActivePlan {
  id: string
  description: string
  startMonth: number
  installments: number
  schedule: ReturnType<typeof planSchedule>
}

/** Expands the purchases and recurring expenses into concrete installment plans. */
function buildPlans(params: CreditCardParams, monthlyRate: number): ActivePlan[] {
  const plans: ActivePlan[] = []

  for (const purchase of params.deferredPurchases) {
    if (purchase.amount <= 0 || purchase.installments <= 0) continue
    plans.push({
      id: purchase.id,
      description: purchase.description || 'Compra',
      startMonth: purchase.purchaseMonth,
      installments: purchase.installments,
      schedule: planSchedule(
        purchase.amount,
        purchase.installments,
        monthlyRate,
        purchase.interestFree,
      ),
    })
  }

  for (const expense of params.recurringExpenses) {
    if (!expense.defer || expense.monthlyAmount <= 0) continue
    const installments = Math.max(1, Math.round(params.defaultInstallments))
    // Each month's charge spawns its own plan.
    for (let month = expense.startMonth; month <= expense.endMonth; month++) {
      plans.push({
        id: `${expense.id}-m${month}`,
        description: expense.description || 'Gasto recurrente',
        startMonth: month,
        installments,
        schedule: planSchedule(expense.monthlyAmount, installments, monthlyRate, false),
      })
    }
  }

  return plans
}

/** Non-deferred recurring charges landing in month `month`. */
function revolvingPurchasesIn(params: CreditCardParams, month: number): number {
  return params.recurringExpenses.reduce(
    (total, expense) =>
      !expense.defer && month >= expense.startMonth && month <= expense.endMonth
        ? total + expense.monthlyAmount
        : total,
    0,
  )
}

/**
 * The payment for a month under the active strategy.
 *
 * `statementBalance` already includes interest, new revolving charges and the
 * fee; `installmentsDue` is billed separately and is always payable in full.
 */
function resolvePayment(
  params: CreditCardParams,
  statementBalance: number,
  installmentsDue: number,
  interest: number,
  fee: number,
): number {
  const total = statementBalance + installmentsDue
  if (total <= EPSILON) return 0

  switch (params.strategy) {
    case 'full':
      return total
    case 'fixed':
      return Math.min(params.fixedPayment, total)
    case 'percentage':
      return Math.min(Math.max(total * params.percentagePayment, 0), total)
    case 'minimum': {
      const revolvingShare = statementBalance * params.minimumRate + interest + fee
      const due = Math.max(revolvingShare, installmentsDue, params.minimumFloor)
      return Math.min(due, total)
    }
  }
}

/**
 * Projects the card month by month.
 *
 * Interest accrues on the prior revolving balance before the payment lands,
 * which is how issuers post it and the conservative reading.
 */
export function simulateCard(params: CreditCardParams): CardMonth[] {
  const months = Math.max(0, Math.round(params.months))
  if (months === 0) return []

  const monthlyRate = toMonthlyRate(params.rate, params.rateConvention)
  const plans = buildPlans(params, monthlyRate)
  const fee = params.monthlyFee * (params.feeIncludesVat ? 1 + VAT_RATE : 1)

  const rows: CardMonth[] = []
  let revolving = params.openingBalance

  for (let month = 1; month <= months; month++) {
    const openingRevolving = revolving
    const interest = openingRevolving * monthlyRate
    const revolvingPurchases = revolvingPurchasesIn(params, month)

    const charges: InstallmentCharge[] = []
    let installmentCharges = 0
    let pendingInstallmentPrincipal = 0

    for (const plan of plans) {
      const index = month - plan.startMonth
      if (index >= 0 && index < plan.schedule.length) {
        const entry = plan.schedule[index]
        charges.push({
          planId: plan.id,
          description: plan.description,
          installment: index + 1,
          installments: plan.installments,
          amount: entry.payment,
          principal: entry.principal,
          interest: entry.interest,
          remainingPrincipal: entry.remaining,
        })
        installmentCharges += entry.payment
        pendingInstallmentPrincipal += entry.remaining
      } else if (index < 0) {
        // Bought later in the horizon: nothing billed and nothing outstanding yet.
        continue
      }
    }

    const statementBalance = openingRevolving + interest + revolvingPurchases + fee
    const payment = resolvePayment(params, statementBalance, installmentCharges, interest, fee)

    revolving = Math.max(0, statementBalance + installmentCharges - payment)
    if (revolving < EPSILON) revolving = 0

    const totalBalance = revolving + pendingInstallmentPrincipal
    const cutoffDate = withDayOfMonth(addMonths(params.startDate, month - 1), params.cutoffDay)

    rows.push({
      month,
      year: Math.floor((month - 1) / 12) + 1,
      monthOfYear: ((month - 1) % 12) + 1,
      cutoffDate,
      dueDate: addDays(cutoffDate, DUE_DATE_OFFSET_DAYS),
      openingRevolving,
      interest,
      revolvingPurchases,
      fee,
      installmentCharges,
      charges,
      payment,
      revolvingBalance: revolving,
      totalBalance,
      pendingInstallmentPrincipal,
      utilization: params.creditLimit > 0 ? totalBalance / params.creditLimit : 0,
    })
  }

  return rows
}

/**
 * The month the balance first reaches zero, or null when it never does.
 *
 * Returning null rather than the horizon is deliberate: a payment that does not
 * cover interest plus fee never retires the balance, and the UI has to say so
 * instead of showing a number that looks like an answer.
 */
export function monthsToZero(rows: CardMonth[]): number | null {
  const cleared = rows.find((row) => row.totalBalance <= EPSILON)
  return cleared ? cleared.month : null
}

/** Runs the same purchases under another strategy, for the comparison strip. */
export function compareStrategies(params: CreditCardParams): Record<
  'minimum' | 'fixed' | 'full',
  StrategyOutcome
> {
  const run = (strategy: 'minimum' | 'fixed' | 'full'): StrategyOutcome => {
    const rows = simulateCard({ ...params, strategy })
    return {
      strategy,
      totalPaid: rows.reduce((sum, row) => sum + row.payment, 0),
      totalInterest: rows.reduce((sum, row) => sum + row.interest, 0),
      monthsToZero: monthsToZero(rows),
    }
  }

  return { minimum: run('minimum'), fixed: run('fixed'), full: run('full') }
}

export function summarizeCard(rows: CardMonth[], params: CreditCardParams): CardTotals {
  const totals = rows.reduce(
    (acc, row) => {
      acc.totalPaid += row.payment
      acc.totalInterest += row.interest
      acc.totalFees += row.fee
      return acc
    },
    { totalPaid: 0, totalInterest: 0, totalFees: 0 },
  )

  const first = rows[0]
  const last = rows[rows.length - 1]
  const overLimit = rows.find((row) => row.utilization > 1)

  return {
    ...totals,
    monthlyRate: toMonthlyRate(params.rate, params.rateConvention),
    months: rows.length,
    nextPayment: first?.payment ?? 0,
    nextDueDate: first?.dueDate ?? params.startDate,
    monthsToZero: monthsToZero(rows),
    finalUtilization: last?.utilization ?? 0,
    peakUtilization: rows.reduce((peak, row) => Math.max(peak, row.utilization), 0),
    overLimitMonth: overLimit?.month ?? null,
    // A display check only: the projection runs either way.
    exceedsUsury: params.rateConvention === 'EA' && params.rate > params.usuryRate,
  }
}
