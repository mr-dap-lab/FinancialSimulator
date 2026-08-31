import { useCallback, useMemo, useState } from 'react'
import { toMonthlyRate } from '../../lib/amortize'
import {
  buildGoalSchedule,
  createSavingsGoalParams,
  evaluateSavingsGoal,
} from '../../lib/savingsGoal'
import type {
  GoalYearRow,
  SavingsGoalParams,
  SavingsGoalResult,
} from '../../lib/savingsGoal'

export interface SavingsGoalController {
  params: SavingsGoalParams
  update: (patch: Partial<SavingsGoalParams>) => void
  reset: () => void
  result: SavingsGoalResult
  schedule: GoalYearRow[]
  monthlyRate: number
  /** How `monthlyContribution` compares to the contribution that meets the goal exactly. */
  contributionVsRequired: 'exceeds' | 'meets' | 'short'
}

/** Within this tolerance the two contributions are treated as the same. */
const MEETS_TOLERANCE = 1

export function useSavingsGoal(): SavingsGoalController {
  const [params, setParams] = useState<SavingsGoalParams>(createSavingsGoalParams)

  const update = useCallback((patch: Partial<SavingsGoalParams>) => {
    setParams((previous) => ({ ...previous, ...patch }))
  }, [])

  const reset = useCallback(() => setParams(createSavingsGoalParams()), [])

  const result = useMemo(() => evaluateSavingsGoal(params), [params])
  const schedule = useMemo(() => buildGoalSchedule(params), [params])

  const monthlyRate = useMemo(
    () => toMonthlyRate(params.expectedReturn, 'EA'),
    [params.expectedReturn],
  )

  const contributionVsRequired = useMemo<'exceeds' | 'meets' | 'short'>(() => {
    const diff = params.monthlyContribution - result.requiredContribution
    if (Math.abs(diff) <= MEETS_TOLERANCE) return 'meets'
    return diff > 0 ? 'exceeds' : 'short'
  }, [params.monthlyContribution, result.requiredContribution])

  return { params, update, reset, result, schedule, monthlyRate, contributionVsRequired }
}
