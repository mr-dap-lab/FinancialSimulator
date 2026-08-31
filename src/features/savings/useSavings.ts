import { useCallback, useMemo, useState } from 'react'
import {
  createSavingsParams,
  makeTier,
  normalizeTiers,
  simulate,
  summarizeSavings,
} from '../../lib/simulate'
import type { SavingsParams, SavingsRow, SavingsTotals } from '../../lib/simulate'

export interface SavingsController {
  params: SavingsParams
  update: (patch: Partial<SavingsParams>) => void
  reset: () => void
  rows: SavingsRow[]
  totals: SavingsTotals
  /** The same scenario under the other capitalisation mode, for side-by-side. */
  comparison: { finalBalance: number } | null
  tierWarnings: TierWarning[]
}

/**
 * Warnings are returned as descriptors rather than sentences: the hook has no
 * business knowing which language the UI is in.
 */
export type TierWarning =
  | { code: 'duplicate'; unit: 'month' | 'balance'; at: number }
  | { code: 'beyondHorizon'; months: number }

/**
 * Keeps the base rate field and the first tier in lockstep.
 *
 * `annualRate` is the source of truth for the base rate, so editing it rewrites
 * tier 1; editing tier 1 writes back to it. Everything downstream can then read
 * either one without worrying about which is stale.
 */
function reconcile(previous: SavingsParams, patch: Partial<SavingsParams>): SavingsParams {
  const next: SavingsParams = { ...previous, ...patch }

  if (next.tiers.length === 0) {
    next.tiers = [makeTier(next.tierMode === 'age' ? 1 : 0, next.annualRate)]
  }

  const modeChanged = patch.tierMode !== undefined && patch.tierMode !== previous.tierMode
  if (modeChanged) {
    // Month numbers and balance thresholds are not interchangeable, so a mode
    // switch starts from a single tier rather than reinterpreting the old ones.
    next.tiers = [makeTier(next.tierMode === 'age' ? 1 : 0, next.annualRate)]
  }

  next.tiers = normalizeTiers(next.tiers, next.tierMode)

  if (patch.annualRate !== undefined) {
    next.tiers = next.tiers.map((tier, index) =>
      index === 0 ? { ...tier, annualRate: next.annualRate } : tier,
    )
  } else if (patch.tiers !== undefined) {
    next.annualRate = next.tiers[0].annualRate
  }

  return next
}

/** Flags the tier configurations the model cannot resolve unambiguously. */
function validateTiers(params: SavingsParams): TierWarning[] {
  if (!params.tiersEnabled || params.tiers.length <= 1) return []

  const warnings: TierWarning[] = []
  const tiers = normalizeTiers(params.tiers, params.tierMode)
  const unit = params.tierMode === 'age' ? 'month' : 'balance'

  for (let index = 1; index < tiers.length; index++) {
    if (tiers[index].from === tiers[index - 1].from) {
      warnings.push({ code: 'duplicate', unit, at: tiers[index].from })
      break
    }
  }

  if (params.tierMode === 'age') {
    const months = params.years * 12
    if (tiers.some((tier) => tier.from > months)) {
      warnings.push({ code: 'beyondHorizon', months })
    }
  }

  return warnings
}

export function useSavings(): SavingsController {
  const [params, setParams] = useState<SavingsParams>(createSavingsParams)

  const update = useCallback((patch: Partial<SavingsParams>) => {
    setParams((previous) => reconcile(previous, patch))
  }, [])

  const reset = useCallback(() => setParams(createSavingsParams()), [])

  const rows = useMemo(() => simulate(params), [params])
  const totals = useMemo(() => summarizeSavings(rows), [rows])

  // Only run the alternative model when the user has asked to compare.
  const comparison = useMemo(() => {
    if (!params.realMonthlyCompounding) return null
    const other = simulate({ ...params, realMonthlyCompounding: false })
    return { finalBalance: summarizeSavings(other).finalBalance }
  }, [params])

  const tierWarnings = useMemo(() => validateTiers(params), [params])

  return { params, update, reset, rows, totals, comparison, tierWarnings }
}
