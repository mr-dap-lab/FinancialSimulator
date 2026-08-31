import { describe, expect, it } from 'vitest'
import {
  DEFAULT_LOAN_PARAMS,
  amortize,
  levelPayment,
  makeExtraPayment,
  summarizeLoan,
  toMonthlyRate,
} from '../amortize'
import type { LoanParams } from '../amortize'

const params = (overrides: Partial<LoanParams> = {}): LoanParams => ({
  ...DEFAULT_LOAN_PARAMS,
  disbursementDate: '2026-01-15',
  extraPayments: [],
  ...overrides,
})

const sum = (values: number[]) => values.reduce((a, b) => a + b, 0)

describe('toMonthlyRate', () => {
  it('converts an effective annual rate', () => {
    expect(toMonthlyRate(0.18, 'EA')).toBeCloseTo(0.0138884, 6)
  })

  it('divides a nominal month-vencido rate by exactly 12', () => {
    expect(toMonthlyRate(0.18, 'NOMINAL_MV')).toBe(0.015)
  })

  it('passes a monthly rate straight through', () => {
    expect(toMonthlyRate(0.0125, 'MONTHLY')).toBe(0.0125)
  })
})

describe('amortize — invariants across all systems', () => {
  for (const system of ['french', 'german', 'bullet'] as const) {
    it(`repays exactly the principal and lands on a zero balance (${system})`, () => {
      const rows = amortize(params({ system }))

      expect(sum(rows.map((row) => row.principalPaid + row.extraPayment))).toBeCloseTo(
        50_000_000,
        2,
      )
      expect(rows[rows.length - 1].balance).toBeCloseTo(0, 2)
    })

    it(`charges interest on the prior balance every month (${system})`, () => {
      const rows = amortize(params({ system }))
      const rate = toMonthlyRate(0.18, 'EA')

      for (const row of rows) {
        expect(row.interest).toBeCloseTo(row.openingBalance * rate, 6)
      }
    })
  }
})

describe('amortize — French', () => {
  it('keeps the instalment identical in every month with no extra payments', () => {
    const rows = amortize(params())

    for (const row of rows) {
      expect(row.payment).toBeCloseTo(rows[0].payment, 2)
    }
  })
})

describe('amortize — German', () => {
  it('holds principal constant while the total instalment strictly decreases', () => {
    const rows = amortize(params({ system: 'german' }))

    for (const row of rows) {
      expect(row.principalPaid).toBeCloseTo(rows[0].principalPaid, 2)
    }
    for (let index = 1; index < rows.length; index++) {
      expect(rows[index].totalPayment).toBeLessThan(rows[index - 1].totalPayment)
    }
  })
})

describe('amortize — bullet', () => {
  it('holds the balance at the full principal until the final month', () => {
    const rows = amortize(params({ system: 'bullet' }))

    for (const row of rows.slice(0, -1)) {
      expect(row.balance).toBeCloseTo(50_000_000, 2)
      expect(row.principalPaid).toBe(0)
    }
    expect(rows[rows.length - 1].principalPaid).toBeCloseTo(50_000_000, 2)
    expect(rows[rows.length - 1].balance).toBeCloseTo(0, 2)
  })
})

describe('amortize — grace period', () => {
  it('capitalises interest under a total grace', () => {
    const graceMonths = 6
    const rows = amortize(params({ graceMonths, graceType: 'total' }))
    const rate = toMonthlyRate(0.18, 'EA')

    expect(rows[graceMonths - 1].balance).toBeCloseTo(
      50_000_000 * Math.pow(1 + rate, graceMonths),
      2,
    )
    for (const row of rows.slice(0, graceMonths)) {
      expect(row.totalPayment).toBe(0)
    }
  })

  it('pays interest only and leaves the balance flat under an interest-only grace', () => {
    const graceMonths = 6
    const rows = amortize(params({ graceMonths, graceType: 'interestOnly' }))

    for (const row of rows.slice(0, graceMonths)) {
      expect(row.balance).toBeCloseTo(50_000_000, 2)
      expect(row.payment).toBeCloseTo(row.interest, 6)
    }
    expect(rows[rows.length - 1].balance).toBeCloseTo(0, 2)
  })
})

describe('amortize — extra payments', () => {
  const base = params()

  it('reduceTerm shortens the schedule and cuts total interest', () => {
    const plain = summarizeLoan(amortize(base), base)

    const withExtra = params({
      extraPayments: [makeExtraPayment(12, 5_000_000, 'reduceTerm')],
    })
    const faster = summarizeLoan(amortize(withExtra), withExtra)

    expect(faster.months).toBeLessThan(plain.months)
    expect(faster.totalInterest).toBeLessThan(plain.totalInterest)
  })

  it('reducePayment keeps the term and lowers the instalment', () => {
    const plain = amortize(base)
    const withExtra = params({
      extraPayments: [makeExtraPayment(12, 5_000_000, 'reducePayment')],
    })
    const rows = amortize(withExtra)

    expect(rows).toHaveLength(plain.length)
    expect(rows[12].payment).toBeLessThan(plain[12].payment)
    expect(rows[rows.length - 1].balance).toBeCloseTo(0, 2)
  })

  it('clamps a payment larger than the balance and closes the loan', () => {
    const withExtra = params({
      extraPayments: [makeExtraPayment(6, 999_000_000, 'reduceTerm')],
    })
    const rows = amortize(withExtra)

    expect(rows).toHaveLength(6)
    expect(rows[5].balance).toBeCloseTo(0, 2)
    expect(sum(rows.map((row) => row.principalPaid + row.extraPayment))).toBeCloseTo(50_000_000, 2)
  })

  it('reports interest and months saved against the no-extras baseline', () => {
    const withExtra = params({
      extraPayments: [makeExtraPayment(12, 5_000_000, 'reduceTerm')],
    })
    const totals = summarizeLoan(amortize(withExtra), withExtra, amortize(base))

    expect(totals.savings).not.toBeNull()
    expect(totals.savings!.interest).toBeGreaterThan(0)
    expect(totals.savings!.months).toBeGreaterThan(0)
  })

  it('reports no savings when there are no extra payments', () => {
    expect(summarizeLoan(amortize(base), base, amortize(base)).savings).toBeNull()
  })
})

describe('reference check — 50,000,000 at 18% E.A. over 60 months, French', () => {
  const reference = params()

  it('matches the closed-form annuity payment', () => {
    const rate = toMonthlyRate(0.18, 'EA')
    const closedForm = (50_000_000 * rate) / (1 - Math.pow(1 + rate, -60))
    const rows = amortize(reference)

    expect(levelPayment(50_000_000, rate, 60)).toBeCloseTo(closedForm, 6)
    expect(rows[0].payment).toBeCloseTo(closedForm, 2)
  })

  /** Documented sanity anchor, checked after the closed form above. */
  it('lands on the quoted instalment and total interest', () => {
    const totals = summarizeLoan(amortize(reference), reference)

    expect(totals.firstPayment).toBeGreaterThan(1_233_660 - 1_000)
    expect(totals.firstPayment).toBeLessThan(1_233_660 + 1_000)
    expect(totals.totalInterest).toBeGreaterThan(24_019_600 - 50_000)
    expect(totals.totalInterest).toBeLessThan(24_019_600 + 50_000)
  })
})

describe('amortize — insurance and charges', () => {
  it('adds life insurance on the opening balance plus the flat charges', () => {
    const withCharges = params({
      lifeInsuranceRate: 0.0005,
      assetInsurance: 30_000,
      adminFee: 12_000,
    })
    const rows = amortize(withCharges)

    for (const row of rows) {
      expect(row.lifeInsurance).toBeCloseTo(row.openingBalance * 0.0005, 6)
      expect(row.fixedCharges).toBeCloseTo(42_000, 6)
      expect(row.insurance).toBeCloseTo(row.lifeInsurance + 42_000, 6)
      expect(row.totalPayment).toBeCloseTo(row.payment + row.insurance + row.extraPayment, 6)
    }
  })

  it('produces no rows for a zero principal or zero term', () => {
    expect(amortize(params({ principal: 0 }))).toHaveLength(0)
    expect(amortize(params({ months: 0 }))).toHaveLength(0)
  })
})
