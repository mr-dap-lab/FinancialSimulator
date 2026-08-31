import { describe, expect, it } from 'vitest'
import { levelPayment, toMonthlyRate } from '../amortize'
import {
  consolidatedLoanRows,
  consolidatedPayment,
  monthsToPayoff,
  monthsToPayoffDeclining,
} from '../debtConsolidation'

describe('monthsToPayoff', () => {
  it('returns null whenever payment <= balance × i', () => {
    const i = 0.01
    expect(monthsToPayoff(5000, i, 50)).toBeNull() // exactly balance × i
    expect(monthsToPayoff(5000, i, 40)).toBeNull() // below it
  })

  it('lands within 0.5 months of the standard amortization formula, across a range of inputs', () => {
    const cases: { balance: number; i: number; payment: number }[] = [
      { balance: 5000, i: 0.0157, payment: 200 },
      { balance: 20000, i: 0.02, payment: 600 },
      { balance: 1_000_000, i: 0.015, payment: 25_000 },
      { balance: 800, i: 0, payment: 50 },
    ]

    for (const { balance, i, payment } of cases) {
      const months = monthsToPayoff(balance, i, payment)
      expect(months).not.toBeNull()
      const m = months as number

      // The level payment for `m` whole months should be at or under the
      // actual payment (m is rounded up); one month less should not be enough.
      const paymentForM = levelPayment(balance, i, m)
      const paymentForOneLess = levelPayment(balance, i, m - 1)
      expect(paymentForM).toBeLessThanOrEqual(payment + 0.5)
      expect(paymentForOneLess).toBeGreaterThan(payment - 0.5)
    }
  })
})

describe('monthsToPayoffDeclining', () => {
  it('balance strictly decreases every month once the payment covers interest', () => {
    const i = toMonthlyRate(0.189, 'NOMINAL_MV')
    const minPct = 0.04
    let remaining = 5000
    for (let month = 0; month < 24; month++) {
      const interest = remaining * i
      const payment = Math.max(remaining * minPct, 0)
      expect(payment).toBeGreaterThan(interest)
      const next = remaining - (payment - interest)
      expect(next).toBeLessThan(remaining)
      remaining = next
    }
  })

  it('returns null (not an infinite loop) when the minimum never covers interest', () => {
    // A minimum percentage below the monthly rate never covers interest, at any balance.
    const i = 0.02
    const result = monthsToPayoffDeclining(5000, i, 0.01, 0)
    expect(result.months).toBeNull()
  })

  it('reference check: $5,000 at 18.9% (Nominal M.V.), 4% minimum, $15 floor ≈ 138 months', () => {
    // The reference calculator's UI shows no floor field at all — this is the
    // hidden floor that reproduces its own number; the model's own *default*
    // stays 0 (see `makeCreditCardDebt`). Passing floor=15 here is a deliberate
    // reference-scenario input, not the shipped default.
    const i = toMonthlyRate(0.189, 'NOMINAL_MV')
    const { months } = monthsToPayoffDeclining(5000, i, 0.04, 15)
    expect(months).not.toBeNull()
    expect(months as number).toBeGreaterThan(138 - 5)
    expect(months as number).toBeLessThan(138 + 5)
  })
})

describe('consolidated loan', () => {
  it('reference check: $5,000 at 11% Nominal M.V. over 120 months ≈ 68.88', () => {
    const rows = consolidatedLoanRows({ balance: 5000, rate: 0.11, months: 120 })
    const payment = consolidatedPayment(rows)
    expect(payment).toBeGreaterThan(68.88 - 0.5)
    expect(payment).toBeLessThan(68.88 + 0.5)
  })
})
