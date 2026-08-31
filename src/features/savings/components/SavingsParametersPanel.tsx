import {
  Button,
  Card,
  CurrencyInput,
  Disclosure,
  ParamField,
  PercentInput,
  SliderWithNumber,
  Switch,
} from '../../../components/ui'
import { useT } from '../../../i18n/i18n'
import { MAX_YEARS, MIN_YEARS } from '../../../lib/simulate'
import type { SavingsController } from '../useSavings'
import { RateTiersEditor } from './RateTiersEditor'

export function SavingsParametersPanel({ savings }: { savings: SavingsController }) {
  const { params, update, reset, tierWarnings } = savings
  const t = useT()
  const months = params.years * 12

  const tierSummary =
    params.tiersEnabled && params.tiers.length > 1
      ? t.savings.tiersSummary(
          params.tiers.length,
          params.tierMode === 'age' ? t.savings.byAge : t.savings.byBalance,
        )
      : t.savings.tiersBaseOnly

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
      {/*
        Every field below renders through `ParamField`: label, 44px control,
        helper — all three slots the same height as their row siblings, which
        is what keeps the row's visible boxes lined up (see ParamField's
        doc comment for the misalignment this replaces).
      */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <ParamField
          label={t.savings.monthlyContribution}
          helper={t.savings.monthlyContributionHint}
          help={t.savings.monthlyContributionHelp}
        >
          {(id) => (
            <CurrencyInput
              id={id}
              value={params.monthlyContribution}
              onChange={(value) => update({ monthlyContribution: value })}
            />
          )}
        </ParamField>

        <ParamField label={t.savings.annualRate} helper={t.savings.annualRateHint} help={t.savings.annualRateHelp}>
          {(id) => (
            <PercentInput
              id={id}
              value={params.annualRate}
              onChange={(value) => update({ annualRate: value })}
            />
          )}
        </ParamField>

        <ParamField label={t.savings.withholding} helper={t.savings.withholdingHint} help={t.savings.withholdingHelp}>
          {(id) => (
            <PercentInput
              id={id}
              value={params.withholdingRate}
              onChange={(value) => update({ withholdingRate: value })}
            />
          )}
        </ParamField>

        <ParamField
          label={t.savings.years}
          className="sm:col-span-2"
          helper={t.savings.yearsHint(months)}
          help={t.savings.yearsHelp}
        >
          {(id) => (
            <SliderWithNumber
              id={id}
              ariaLabel={t.savings.years}
              value={params.years}
              onChange={(value) => update({ years: value })}
              min={MIN_YEARS}
              max={MAX_YEARS}
            />
          )}
        </ParamField>

        <ParamField label={t.savings.growth} helper={t.savings.growthHint} help={t.savings.growthHelp}>
          {(id) => (
            <PercentInput
              id={id}
              value={params.contributionGrowth}
              onChange={(value) => update({ contributionGrowth: value })}
            />
          )}
        </ParamField>

        <div className="flex items-start pt-5 sm:col-span-2 lg:col-span-1">
          <Switch
            checked={params.realMonthlyCompounding}
            onChange={(checked) => update({ realMonthlyCompounding: checked })}
            label={t.savings.realCompounding}
            description={t.savings.realCompoundingHint}
          />
        </div>
      </div>

      <div className="mt-6">
        <Disclosure title={t.savings.tiers} summary={tierSummary}>
          <div className="space-y-4">
            <Switch
              checked={params.tiersEnabled}
              onChange={(checked) => update({ tiersEnabled: checked })}
              label={t.savings.tiersEnabled}
              description={t.savings.tiersEnabledHint}
            />
            {params.tiersEnabled && (
              <RateTiersEditor params={params} warnings={tierWarnings} onChange={update} />
            )}
          </div>
        </Disclosure>
      </div>
    </Card>
  )
}
