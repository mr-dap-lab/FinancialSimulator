import {
  Button,
  Card,
  Checkbox,
  CurrencyInput,
  NumberInput,
  ParamField,
  PercentInput,
  SegmentedControl,
  SliderWithNumber,
} from '../../../components/ui'
import { useLocale } from '../../../context/locale'
import { useT } from '../../../i18n/i18n'
import type { RateConvention } from '../../../lib/amortize'
import { MAX_CARD_MONTHS, MIN_CARD_MONTHS } from '../../../lib/creditCard'
import type { PaymentStrategy } from '../../../lib/creditCard'
import type { CreditCardController } from '../useCreditCard'

export function CardParametersPanel({ card }: { card: CreditCardController }) {
  const { params, update, reset, monthlyRate, totals } = card
  const { formatPercent } = useLocale()
  const t = useT()

  const conventions: { value: RateConvention; label: string }[] = [
    { value: 'EA', label: t.loan.conventionShortEA },
    { value: 'NOMINAL_MV', label: t.loan.conventionShortNominal },
    { value: 'MONTHLY', label: t.loan.conventionShortMonthly },
  ]

  const strategies: { value: PaymentStrategy; label: string }[] = [
    { value: 'full', label: t.card.strategyFull },
    { value: 'minimum', label: t.card.strategyMinimum },
    { value: 'fixed', label: t.card.strategyFixed },
    { value: 'percentage', label: t.card.strategyPercentage },
  ]

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
        <ParamField label={t.card.creditLimit} helper={t.card.creditLimitHint} help={t.card.creditLimitHelp}>
          {(id) => (
            <CurrencyInput
              id={id}
              value={params.creditLimit}
              onChange={(value) => update({ creditLimit: value })}
            />
          )}
        </ParamField>

        <ParamField
          label={t.card.openingBalance}
          helper={t.card.openingBalanceHint}
          help={t.card.openingBalanceHelp}
        >
          {(id) => (
            <CurrencyInput
              id={id}
              value={params.openingBalance}
              onChange={(value) => update({ openingBalance: value })}
            />
          )}
        </ParamField>

        <ParamField
          label={t.loan.rate}
          helper={t.loan.rateHint(formatPercent(monthlyRate, 4))}
          error={totals.exceedsUsury ? t.card.usuryWarning : undefined}
          help={t.loan.rateHelp}
        >
          {(id) => (
            <div className="flex w-full flex-col gap-3">
              <div className="flex items-center gap-2">
                <div className="w-full">
                  <PercentInput
                    id={id}
                    value={params.rate}
                    onChange={(value) => update({ rate: value })}
                    decimals={2}
                  />
                </div>
                {totals.exceedsUsury && (
                  <span className="shrink-0 rounded-full bg-error-container px-2.5 py-1 text-[10px] font-medium tracking-wide text-on-error-container">
                    {t.card.usuryBadge}
                  </span>
                )}
              </div>
              <SegmentedControl
                ariaLabel={t.loan.rate}
                value={params.rateConvention}
                onChange={(value) => update({ rateConvention: value })}
                options={conventions}
              />
            </div>
          )}
        </ParamField>

        <ParamField label={t.card.usuryRate} helper={t.card.usuryRateHint} help={t.card.usuryRateHelp}>
          {(id) => (
            <PercentInput
              id={id}
              value={params.usuryRate}
              onChange={(value) => update({ usuryRate: value })}
              decimals={2}
            />
          )}
        </ParamField>

        <ParamField label={t.card.monthlyFee} help={t.card.monthlyFeeHelp}>
          {(id) => (
            <div className="flex w-full flex-col gap-2">
              <CurrencyInput
                id={id}
                value={params.monthlyFee}
                onChange={(value) => update({ monthlyFee: value })}
              />
              <Checkbox
                checked={params.feeIncludesVat}
                onChange={(checked) => update({ feeIncludesVat: checked })}
                label={t.card.addVat}
              />
            </div>
          )}
        </ParamField>

        <ParamField label={t.card.cutoffDay} helper={t.card.cutoffDayHint} help={t.card.cutoffDayHelp}>
          {(id) => (
            <NumberInput
              id={id}
              value={params.cutoffDay}
              onChange={(value) => update({ cutoffDay: Math.round(value) })}
              min={1}
              max={28}
              decimals={0}
            />
          )}
        </ParamField>

        <ParamField
          label={t.card.horizon}
          className="sm:col-span-2"
          helper={t.card.horizonHint(params.months)}
          help={t.card.horizonHelp}
        >
          {(id) => (
            <SliderWithNumber
              id={id}
              ariaLabel={t.card.horizon}
              value={params.months}
              onChange={(value) => update({ months: value })}
              min={MIN_CARD_MONTHS}
              max={MAX_CARD_MONTHS}
            />
          )}
        </ParamField>

        <ParamField
          label={t.card.strategy}
          className="sm:col-span-2 lg:col-span-3"
          help={t.card.strategyHelp}
        >
          {(id) => (
            <div className="flex w-full flex-col gap-4">
              <SegmentedControl
                id={id}
                ariaLabel={t.card.strategy}
                value={params.strategy}
                onChange={(value) => update({ strategy: value })}
                options={strategies}
              />

              {params.strategy === 'minimum' && (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:max-w-lg">
                  <ParamField label={t.card.minimumRate} help={t.card.minimumRateHelp}>
                    {(rateId) => (
                      <PercentInput
                        id={rateId}
                        value={params.minimumRate}
                        onChange={(value) => update({ minimumRate: value })}
                      />
                    )}
                  </ParamField>
                  <ParamField label={t.card.minimumFloor} help={t.card.minimumFloorHelp}>
                    {(floorId) => (
                      <CurrencyInput
                        id={floorId}
                        value={params.minimumFloor}
                        onChange={(value) => update({ minimumFloor: value })}
                      />
                    )}
                  </ParamField>
                </div>
              )}

              {params.strategy === 'fixed' && (
                <div className="lg:max-w-xs">
                  <ParamField label={t.card.fixedAmount} help={t.card.fixedAmountHelp}>
                    {(fixedId) => (
                      <CurrencyInput
                        id={fixedId}
                        value={params.fixedPayment}
                        onChange={(value) => update({ fixedPayment: value })}
                      />
                    )}
                  </ParamField>
                </div>
              )}

              {params.strategy === 'percentage' && (
                <div className="lg:max-w-xs">
                  <ParamField label={t.card.percentageAmount} help={t.card.percentageAmountHelp}>
                    {(percentId) => (
                      <PercentInput
                        id={percentId}
                        value={params.percentagePayment}
                        onChange={(value) => update({ percentagePayment: value })}
                      />
                    )}
                  </ParamField>
                </div>
              )}
            </div>
          )}
        </ParamField>
      </div>
    </Card>
  )
}
