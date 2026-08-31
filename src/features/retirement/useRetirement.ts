import { useCallback, useMemo, useState } from 'react'
import {
  buildAccumulationSchedule,
  buildRetirementDepletion,
  buildRetirementSchedule,
  createRetirementParams,
  evaluateRetirement,
} from '../../lib/retirement'
import type {
  AccumulationYearRow,
  RetirementMonthPoint,
  RetirementParams,
  RetirementResult,
  RetirementYearRow,
} from '../../lib/retirement'

export interface RetirementController {
  params: RetirementParams
  update: (patch: Partial<RetirementParams>) => void
  reset: () => void
  result: RetirementResult
  accumulationSchedule: AccumulationYearRow[]
  retirementSchedule: RetirementYearRow[]
  depletion: RetirementMonthPoint[]
  /** `false` when `retirementAge` is not strictly greater than `currentAge`. */
  agesValid: boolean
}

export function useRetirement(): RetirementController {
  const [params, setParams] = useState<RetirementParams>(createRetirementParams)

  const update = useCallback((patch: Partial<RetirementParams>) => {
    setParams((previous) => ({ ...previous, ...patch }))
  }, [])

  const reset = useCallback(() => setParams(createRetirementParams()), [])

  const agesValid = params.retirementAge > params.currentAge

  // Downstream math assumes `retirementAge > currentAge` (contribution count,
  // schedule lengths) — evaluate against a clamped copy rather than letting
  // an invalid age pair through, while the ages themselves stay whatever the
  // user is mid-typing so the field can show its own error.
  const safeParams = useMemo<RetirementParams>(
    () => (agesValid ? params : { ...params, retirementAge: params.currentAge + 1 }),
    [params, agesValid],
  )

  const result = useMemo(() => evaluateRetirement(safeParams), [safeParams])
  const accumulationSchedule = useMemo(() => buildAccumulationSchedule(safeParams), [safeParams])
  const retirementSchedule = useMemo(
    () => buildRetirementSchedule(safeParams, result),
    [safeParams, result],
  )
  const depletion = useMemo(() => buildRetirementDepletion(safeParams, result), [safeParams, result])

  return {
    params,
    update,
    reset,
    result,
    accumulationSchedule,
    retirementSchedule,
    depletion,
    agesValid,
  }
}
