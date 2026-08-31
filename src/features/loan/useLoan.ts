import { useCallback, useMemo, useState } from 'react'
import { amortize, createLoanParams, summarizeLoan, toMonthlyRate } from '../../lib/amortize'
import type { LoanParams, LoanRow, LoanTotals } from '../../lib/amortize'

export interface LoanController {
  params: LoanParams
  update: (patch: Partial<LoanParams>) => void
  reset: () => void
  rows: LoanRow[]
  totals: LoanTotals
  monthlyRate: number
  /** The same loan without extra payments, for the overlay and savings card. */
  baseline: LoanRow[]
  hasExtraPayments: boolean
  warnings: LoanWarning[]
}

/** Translatable descriptors — the hook stays language-agnostic. */
export type LoanWarning =
  | { code: 'graceCoversTerm' }
  | { code: 'extraBeyondTerm'; months: number }

/** Flags configurations that are legal but probably not what the user meant. */
function validate(params: LoanParams, rows: LoanRow[]): LoanWarning[] {
  const warnings: LoanWarning[] = []

  if (params.graceMonths >= params.months) {
    warnings.push({ code: 'graceCoversTerm' })
  }

  const beyondTerm = params.extraPayments.filter((extra) => extra.month > rows.length)
  if (beyondTerm.length > 0 && rows.length > 0) {
    warnings.push({ code: 'extraBeyondTerm', months: rows.length })
  }

  return warnings
}

export function useLoan(): LoanController {
  const [params, setParams] = useState<LoanParams>(createLoanParams)

  const update = useCallback((patch: Partial<LoanParams>) => {
    setParams((previous) => ({ ...previous, ...patch }))
  }, [])

  const reset = useCallback(() => setParams(createLoanParams()), [])

  const rows = useMemo(() => amortize(params), [params])

  const hasExtraPayments = params.extraPayments.some((extra) => extra.amount > 0)

  // Only run the second projection when there is something to compare against.
  const baseline = useMemo(
    () => (hasExtraPayments ? amortize({ ...params, extraPayments: [] }) : rows),
    [params, rows, hasExtraPayments],
  )

  const totals = useMemo(
    () => summarizeLoan(rows, params, hasExtraPayments ? baseline : undefined),
    [rows, params, baseline, hasExtraPayments],
  )

  const monthlyRate = useMemo(
    () => toMonthlyRate(params.rate, params.rateConvention),
    [params.rate, params.rateConvention],
  )

  const warnings = useMemo(() => validate(params, rows), [params, rows])

  return { params, update, reset, rows, totals, monthlyRate, baseline, hasExtraPayments, warnings }
}
