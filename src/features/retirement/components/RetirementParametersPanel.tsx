import {
  Button,
  Card,
  Checkbox,
  CurrencyInput,
  ParamField,
  PercentInput,
  SliderWithNumber,
} from '../../../components/ui'
import { useT } from '../../../i18n/i18n'
import {
  MAX_CURRENT_AGE,
  MAX_RETIREMENT_AGE,
  MAX_RETIREMENT_YEARS,
  MIN_CURRENT_AGE,
  MIN_RETIREMENT_AGE,
  MIN_RETIREMENT_YEARS,
} from '../../../lib/retirement'
import type { RetirementController } from '../useRetirement'

export function RetirementParametersPanel({ retirement }: { retirement: RetirementController }) {
  const { params, update, reset, agesValid } = retirement
  const t = useT()

  return (
    <div className="space-y-4">
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
            label={t.retirement.startingBalance}
            help={t.retirement.startingBalanceHelp}
          >
            {(id) => (
              <CurrencyInput
                id={id}
                value={params.startingBalance}
                onChange={(value) => update({ startingBalance: value })}
              />
            )}
          </ParamField>

          <ParamField
            label={t.retirement.annualContribution}
            help={t.retirement.annualContributionHelp}
          >
            {(id) => (
              <CurrencyInput
                id={id}
                value={params.annualContribution}
                onChange={(value) => update({ annualContribution: value })}
              />
            )}
          </ParamField>

          <ParamField
            label={t.retirement.currentAge}
            help={t.retirement.currentAgeHelp}
          >
            {(id) => (
              <SliderWithNumber
                id={id}
                ariaLabel={t.retirement.currentAge}
                value={params.currentAge}
                onChange={(value) => update({ currentAge: value })}
                min={MIN_CURRENT_AGE}
                max={MAX_CURRENT_AGE}
                numberWidth="w-16"
              />
            )}
          </ParamField>

          <ParamField
            label={t.retirement.retirementAge}
            help={t.retirement.retirementAgeHelp}
            error={agesValid ? undefined : t.retirement.retirementAgeError}
          >
            {(id) => (
              <SliderWithNumber
                id={id}
                ariaLabel={t.retirement.retirementAge}
                value={params.retirementAge}
                onChange={(value) => update({ retirementAge: value })}
                min={MIN_RETIREMENT_AGE}
                max={MAX_RETIREMENT_AGE}
                numberWidth="w-16"
              />
            )}
          </ParamField>

          <ParamField
            label={t.retirement.retirementYears}
            help={t.retirement.retirementYearsHelp}
          >
            {(id) => (
              <SliderWithNumber
                id={id}
                ariaLabel={t.retirement.retirementYears}
                value={params.retirementYears}
                onChange={(value) => update({ retirementYears: value })}
                min={MIN_RETIREMENT_YEARS}
                max={MAX_RETIREMENT_YEARS}
                numberWidth="w-16"
              />
            )}
          </ParamField>

          <ParamField
            label={t.retirement.growWithInflation}
            help={t.retirement.growWithInflationHelp}
          >
            {() => (
              <Checkbox
                checked={params.growContributionsWithInflation}
                onChange={(checked) => update({ growContributionsWithInflation: checked })}
                label={t.retirement.growWithInflation}
              />
            )}
          </ParamField>

          <ParamField
            label={t.retirement.taxDeferred}
            help={t.retirement.taxDeferredHelp}
          >
            {() => (
              <Checkbox
                checked={params.taxDeferred}
                onChange={(checked) => update({ taxDeferred: checked })}
                label={t.retirement.taxDeferred}
              />
            )}
          </ParamField>
        </div>
      </Card>

      <Card variant="outlined" title={t.retirement.returnsCardTitle}>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <ParamField label={t.retirement.returnBefore} help={t.retirement.returnBeforeHelp}>
            {(id) => (
              <PercentInput
                id={id}
                value={params.returnBeforeRetirement}
                onChange={(value) => update({ returnBeforeRetirement: value })}
                decimals={2}
              />
            )}
          </ParamField>

          <ParamField label={t.retirement.returnDuring} help={t.retirement.returnDuringHelp}>
            {(id) => (
              <PercentInput
                id={id}
                value={params.returnDuringRetirement}
                onChange={(value) => update({ returnDuringRetirement: value })}
                decimals={2}
              />
            )}
          </ParamField>

          <ParamField label={t.retirement.inflation} help={t.retirement.inflationHelp}>
            {(id) => (
              <PercentInput
                id={id}
                value={params.inflation}
                onChange={(value) => update({ inflation: value })}
                decimals={2}
              />
            )}
          </ParamField>

          <ParamField
            label={t.retirement.currentTaxRate}
            help={t.retirement.currentTaxRateHelp}
          >
            {(id) => (
              <PercentInput
                id={id}
                value={params.currentTaxRate}
                onChange={(value) => update({ currentTaxRate: value })}
              />
            )}
          </ParamField>

          <ParamField
            label={t.retirement.retirementTaxRate}
            help={t.retirement.retirementTaxRateHelp}
          >
            {(id) => (
              <PercentInput
                id={id}
                value={params.retirementTaxRate}
                onChange={(value) => update({ retirementTaxRate: value })}
              />
            )}
          </ParamField>
        </div>
      </Card>
    </div>
  )
}
