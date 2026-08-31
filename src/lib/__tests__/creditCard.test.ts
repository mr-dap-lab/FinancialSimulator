import { describe, expect, it } from 'vitest'
import { toMonthlyRate } from '../amortize'
import {
  VAT_RATE,
  createCardParams,
  installmentPlan,
  makeDeferredPurchase,
  makeRecurringExpense,
  monthsToZero,
  simulateCard,
  summarizeCard,
} from '../creditCard'
import type { CreditCardParams } from '../creditCard'

const RATE = toMonthlyRate(0.25, 'EA')

const params = (overrides: Partial<CreditCardParams> = {}): CreditCardParams => ({
  ...createCardParams(),
  startDate: '2026-01-15',
  deferredPurchases: [],
  recurringExpenses: [],
  ...overrides,
})

const sum = (values: number[]) => values.reduce((a, b) => a + b, 0)

describe('installmentPlan', () => {
  it('splits an interest-free purchase into identical instalments', () => {
    const plan = installmentPlan(1_200_000, 12, RATE, true)

    expect(plan).toHaveLength(12)
    for (const payment of plan) expect(payment).toBe(100_000)
    expect(sum(plan)).toBeCloseTo(1_200_000, 6)
  })

  it('returns an empty plan for a zero amount or zero instalments', () => {
    expect(installmentPlan(0, 12, RATE, false)).toHaveLength(0)
    expect(installmentPlan(1_000_000, 0, RATE, false)).toHaveLength(0)
  })

  it('sums principal back to the purchase amount when interest is charged', () => {
    const purchase = makeDeferredPurchase('Test', 3_000_000, 1, 12, false)
    const rows = simulateCard(params({ deferredPurchases: [purchase], months: 12 }))

    const principal = sum(
      rows.flatMap((row) => row.charges.filter((c) => c.planId === purchase.id).map((c) => c.principal)),
    )
    expect(principal).toBeCloseTo(3_000_000, 2)
  })
})

describe('reference check — 3,000,000 over 12 cuotas at 25% E.A.', () => {
  it('matches the closed-form instalment', () => {
    const closedForm = (3_000_000 * RATE) / (1 - Math.pow(1 + RATE, -12))
    const plan = installmentPlan(3_000_000, 12, RATE, false)

    expect(plan[0]).toBeCloseTo(closedForm, 6)
  })

  /** Documented sanity anchor, checked after the closed form above. */
  it('lands on the quoted instalment and total', () => {
    const plan = installmentPlan(3_000_000, 12, RATE, false)

    expect(plan[0]).toBeGreaterThan(281_541 - 500)
    expect(plan[0]).toBeLessThan(281_541 + 500)
    expect(sum(plan)).toBeGreaterThan(3_378_492 - 1_000)
    expect(sum(plan)).toBeLessThan(3_378_492 + 1_000)
  })
})

describe('payment strategies', () => {
  it('pago total leaves no interest and no revolving balance', () => {
    const rows = simulateCard(
      params({
        strategy: 'full',
        openingBalance: 2_000_000,
        recurringExpenses: [makeRecurringExpense('Mercado', 400_000, 1, 36, false)],
        months: 24,
      }),
    )

    for (const row of rows) {
      expect(row.revolvingBalance).toBeCloseTo(0, 6)
    }
    // Month 1 charges interest on the balance carried in; nothing after that.
    for (const row of rows.slice(1)) {
      expect(row.interest).toBeCloseTo(0, 6)
    }
  })

  it('a minimum below interest plus fee never reduces the balance', () => {
    const rows = simulateCard(
      params({
        strategy: 'minimum',
        openingBalance: 5_000_000,
        minimumRate: 0,
        minimumFloor: 1_000,
        months: 36,
      }),
    )

    for (let index = 1; index < rows.length; index++) {
      expect(rows[index].revolvingBalance).toBeGreaterThanOrEqual(
        rows[index - 1].revolvingBalance - 0.01,
      )
    }
    expect(monthsToZero(rows)).toBeNull()
  })

  it('never lets a larger fixed payment cost more interest', () => {
    const base = params({ strategy: 'fixed', openingBalance: 5_000_000, months: 60 })

    let previous = Number.POSITIVE_INFINITY
    for (const fixedPayment of [200_000, 400_000, 600_000, 1_000_000, 2_000_000]) {
      const totals = summarizeCard(
        simulateCard({ ...base, fixedPayment }),
        { ...base, fixedPayment },
      )
      expect(totals.totalInterest).toBeLessThanOrEqual(previous + 0.01)
      previous = totals.totalInterest
    }
  })
})

describe('recurring expenses', () => {
  it('stops charging after the end month', () => {
    const rows = simulateCard(
      params({
        strategy: 'full',
        months: 12,
        recurringExpenses: [makeRecurringExpense('Gimnasio', 150_000, 1, 6, false)],
      }),
    )

    for (const row of rows.slice(0, 6)) expect(row.revolvingPurchases).toBeCloseTo(150_000, 6)
    for (const row of rows.slice(6)) expect(row.revolvingPurchases).toBe(0)
  })

  it('spawns an installment plan per month when deferred', () => {
    const rows = simulateCard(
      params({
        months: 12,
        defaultInstallments: 3,
        recurringExpenses: [makeRecurringExpense('Mercado', 300_000, 1, 4, true)],
      }),
    )

    expect(rows[0].revolvingPurchases).toBe(0)
    expect(rows[0].charges).toHaveLength(1)
    // Months 1..4 each start a 3-instalment plan, so month 3 carries three.
    expect(rows[2].charges).toHaveLength(3)
    expect(rows[11].charges).toHaveLength(0)
  })
})

describe('utilization', () => {
  it('never goes negative and equals revolving plus pending installment principal', () => {
    const rows = simulateCard(
      params({
        months: 24,
        deferredPurchases: [makeDeferredPurchase('Portátil', 3_000_000, 1, 12, false)],
        recurringExpenses: [makeRecurringExpense('Mercado', 400_000, 1, 24, false)],
      }),
    )

    for (const row of rows) {
      expect(row.utilization).toBeGreaterThanOrEqual(0)
      expect(row.totalBalance).toBeCloseTo(
        row.revolvingBalance + row.pendingInstallmentPrincipal,
        6,
      )
      expect(row.totalBalance).toBeGreaterThanOrEqual(0)
    }
  })
})

describe('fees and the usury check', () => {
  it('adds VAT to the monthly fee when enabled', () => {
    const withVat = simulateCard(params({ monthlyFee: 25_000, feeIncludesVat: true, months: 3 }))
    const withoutVat = simulateCard(params({ monthlyFee: 25_000, feeIncludesVat: false, months: 3 }))

    expect(withVat[0].fee).toBeCloseTo(25_000 * (1 + VAT_RATE), 6)
    expect(withoutVat[0].fee).toBeCloseTo(25_000, 6)
  })

  it('flags a rate above the usury cap without changing any computed value', () => {
    const under = params({ rate: 0.25, usuryRate: 0.25, openingBalance: 2_000_000, months: 12 })
    const over = { ...under, usuryRate: 0.2 }

    expect(summarizeCard(simulateCard(under), under).exceedsUsury).toBe(false)
    expect(summarizeCard(simulateCard(over), over).exceedsUsury).toBe(true)
    // Only the flag differs: every projected figure is identical.
    expect(simulateCard(over)).toEqual(simulateCard(under))
  })
})

describe('dates', () => {
  it('puts the due date 15 days after the cutoff', () => {
    const rows = simulateCard(params({ cutoffDay: 15, startDate: '2026-01-15', months: 3 }))

    expect(rows[0].cutoffDate).toBe('2026-01-15')
    expect(rows[0].dueDate).toBe('2026-01-30')
    expect(rows[1].cutoffDate).toBe('2026-02-15')
  })
})

describe('simulateCard — edge cases', () => {
  it('produces no rows for a zero horizon', () => {
    expect(simulateCard(params({ months: 0 }))).toHaveLength(0)
  })

  it('keeps the balance identity every month', () => {
    const rows = simulateCard(
      params({
        months: 24,
        openingBalance: 1_000_000,
        deferredPurchases: [makeDeferredPurchase('Vuelo', 1_800_000, 3, 6, true)],
        recurringExpenses: [makeRecurringExpense('Mercado', 400_000, 1, 24, false)],
      }),
    )

    for (const row of rows) {
      const statement =
        row.openingRevolving + row.interest + row.revolvingPurchases + row.fee
      expect(row.revolvingBalance).toBeCloseTo(
        Math.max(0, statement + row.installmentCharges - row.payment),
        6,
      )
    }
  })
})
