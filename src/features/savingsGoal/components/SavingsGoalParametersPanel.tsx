import {
  Button,
  Card,
  CurrencyInput,
  ParamField,
  PercentInput,
  SliderWithNumber,
} from '../../../components/ui'
import { useLocale } from '../../../context/locale'
import { useT } from '../../../i18n/i18n'
import { clamp } from '../../../lib/format'
import { MAX_GOAL_YEARS, MIN_GOAL_YEARS } from '../../../lib/savingsGoal'
import type { SavingsGoalController } from '../useSavingsGoal'

/**
 * The goal-amount slider's track is log-ish, not linear: a linear track from
 * $0 to $100M would put every realistic goal (most land well under $10M) in
 * the first few pixels. The first fifth of the track covers $0–$100k
 * linearly (so small goals, including 0, stay precisely reachable), and the
 * rest covers $100k–$100M across two log decades, matching the reference's
 * own $0/$1k/$10k/$100k tick spacing scaled up by 1000 for COP defaults.
 */
const GOAL_SLIDER_MAX = 100_000_000
const GOAL_SLIDER_LOG_FLOOR = 100_000
const GOAL_SLIDER_LINEAR_SHARE = 0.2

function goalToPosition(value: number): number {
  const v = clamp(value, 0, GOAL_SLIDER_MAX)
  if (v <= GOAL_SLIDER_LOG_FLOOR) return (v / GOAL_SLIDER_LOG_FLOOR) * GOAL_SLIDER_LINEAR_SHARE
  const logMin = Math.log10(GOAL_SLIDER_LOG_FLOOR)
  const logMax = Math.log10(GOAL_SLIDER_MAX)
  const t = (Math.log10(v) - logMin) / (logMax - logMin)
  return GOAL_SLIDER_LINEAR_SHARE + t * (1 - GOAL_SLIDER_LINEAR_SHARE)
}

function goalFromPosition(position: number): number {
  const p = clamp(position, 0, 1)
  if (p <= GOAL_SLIDER_LINEAR_SHARE) {
    return Math.round((p / GOAL_SLIDER_LINEAR_SHARE) * GOAL_SLIDER_LOG_FLOOR)
  }
  const logMin = Math.log10(GOAL_SLIDER_LOG_FLOOR)
  const logMax = Math.log10(GOAL_SLIDER_MAX)
  const t = (p - GOAL_SLIDER_LINEAR_SHARE) / (1 - GOAL_SLIDER_LINEAR_SHARE)
  return Math.round(Math.pow(10, logMin + t * (logMax - logMin)))
}

const GOAL_SLIDER_TICKS = [0, 1_000_000, 10_000_000, 100_000_000]

export function SavingsGoalParametersPanel({ goal }: { goal: SavingsGoalController }) {
  const { params, update, reset } = goal
  const { formatAbbrev } = useLocale()
  const t = useT()
  const months = params.years * 12

  return (
    <Card
      title={t.common.parameters}
      description={t.common.liveRecalc}
      actions={
        <Button variant="text" onClick={reset}>
          {t.common.reset}
        </Button>
      }
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <ParamField
          label={t.savingsGoal.goal}
          className="sm:col-span-2 lg:col-span-3"
          helper={t.savingsGoal.goalHint}
          help={t.savingsGoal.goalHelp}
        >
          {(id) => (
            <div className="flex w-full flex-col gap-2">
              <CurrencyInput
                id={id}
                value={params.goal}
                onChange={(value) => update({ goal: value })}
              />
              <div>
                <SliderWithNumber
                  ariaLabel={t.savingsGoal.goal}
                  value={params.goal}
                  onChange={(value) => update({ goal: value })}
                  min={0}
                  max={GOAL_SLIDER_MAX}
                  toPosition={goalToPosition}
                  fromPosition={goalFromPosition}
                  hideNumberBox
                />
                <div className="mt-1 flex justify-between text-xs text-on-surface-variant">
                  {GOAL_SLIDER_TICKS.map((tick) => (
                    <span key={tick}>{formatAbbrev(tick)}</span>
                  ))}
                </div>
              </div>
            </div>
          )}
        </ParamField>

        <ParamField
          label={t.savingsGoal.years}
          className="sm:col-span-2"
          helper={t.savingsGoal.yearsHint(months)}
          help={t.savingsGoal.yearsHelp}
        >
          {(id) => (
            <SliderWithNumber
              id={id}
              ariaLabel={t.savingsGoal.years}
              value={params.years}
              onChange={(value) => update({ years: value })}
              min={MIN_GOAL_YEARS}
              max={MAX_GOAL_YEARS}
            />
          )}
        </ParamField>

        <ParamField
          label={t.savingsGoal.currentSavings}
          helper={t.savingsGoal.currentSavingsHint}
          help={t.savingsGoal.currentSavingsHelp}
        >
          {(id) => (
            <CurrencyInput
              id={id}
              value={params.currentSavings}
              onChange={(value) => update({ currentSavings: value })}
            />
          )}
        </ParamField>

        <ParamField
          label={t.savingsGoal.monthlyContribution}
          helper={t.savingsGoal.monthlyContributionHint}
          help={t.savingsGoal.monthlyContributionHelp}
        >
          {(id) => (
            <CurrencyInput
              id={id}
              value={params.monthlyContribution}
              onChange={(value) => update({ monthlyContribution: value })}
            />
          )}
        </ParamField>

        <ParamField
          label={t.savingsGoal.expectedReturn}
          helper={t.savingsGoal.expectedReturnHint}
          help={t.savingsGoal.expectedReturnHelp}
        >
          {(id) => (
            <PercentInput
              id={id}
              value={params.expectedReturn}
              onChange={(value) => update({ expectedReturn: value })}
              decimals={2}
            />
          )}
        </ParamField>

        <ParamField
          label={t.savingsGoal.expectedInflation}
          helper={t.savingsGoal.expectedInflationHint}
          help={t.savingsGoal.expectedInflationHelp}
        >
          {(id) => (
            <PercentInput
              id={id}
              value={params.expectedInflation}
              onChange={(value) => update({ expectedInflation: value })}
            />
          )}
        </ParamField>
      </div>
    </Card>
  )
}
