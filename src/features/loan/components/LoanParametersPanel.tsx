import { useState } from 'react'
import {
  Button,
  Card,
  CurrencyInput,
  Disclosure,
  NumberInput,
  ParamField,
  PercentInput,
  SegmentedControl,
  SliderWithNumber,
  inputClass,
} from '../../../components/ui'
import { useLocale } from '../../../context/locale'
import { useT } from '../../../i18n/i18n'
import { MAX_LOAN_MONTHS, MIN_LOAN_MONTHS } from '../../../lib/amortize'
import type { AmortizationSystem, GraceType, RateConvention } from '../../../lib/amortize'
import { WarningList } from '../../shared/WarningList'
import type { LoanController } from '../useLoan'
import { ExtraPaymentsEditor } from './ExtraPaymentsEditor'

export function LoanParametersPanel({ loan }: { loan: LoanController }) {
  const { params, update, reset, monthlyRate, warnings } = loan
  const { formatPercent } = useLocale()
  const t = useT()
  const [termUnit, setTermUnit] = useState<'months' | 'years'>('months')

  const conventions: { value: RateConvention; label: string }[] = [
    { value: 'EA', label: t.loan.conventionShortEA },
    { value: 'NOMINAL_MV', label: t.loan.conventionShortNominal },
    { value: 'MONTHLY', label: t.loan.conventionShortMonthly },
  ]

  const systems: { value: AmortizationSystem; label: string }[] = [
    { value: 'french', label: t.loan.systemFrench },
    { value: 'german', label: t.loan.systemGerman },
    { value: 'bullet', label: t.loan.systemBullet },
  ]

  const graceTypes: { value: GraceType; label: string }[] = [
    { value: 'interestOnly', label: t.loan.graceInterestOnly },
    { value: 'total', label: t.loan.graceTotal },
  ]

  const chargesActive =
    params.lifeInsuranceRate > 0 || params.assetInsurance > 0 || params.adminFee > 0

  const messages = warnings.map((warning) =>
    warning.code === 'graceCoversTerm'
      ? t.loan.graceCoversTerm
      : t.loan.extraBeyondTerm(warning.months),
  )

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
        Every field renders through `ParamField` — including "Tasa de interés"
        and "Plazo", each of which pairs a value control with an adjacent
        toggle inside the SAME control slot. Splitting those into two stacked
        controls under one label (the previous shape) is what put a
        shorter-than-normal cell next to a full-height one and produced the
        row drift; one fixed-height control slot per field removes it.
      */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <ParamField label={t.loan.principal} helper={t.loan.principalHint} help={t.loan.principalHelp}>
          {(id) => (
            <CurrencyInput
              id={id}
              value={params.principal}
              onChange={(value) => update({ principal: value })}
            />
          )}
        </ParamField>

        <ParamField
          label={t.loan.rate}
          className="sm:col-span-2"
          helper={
            params.rateConvention === 'EA'
              ? t.loan.rateHint(formatPercent(monthlyRate, 4))
              : `${t.loan.rateHint(formatPercent(monthlyRate, 4))} · ${t.loan.rateEarHint(formatPercent(Math.pow(1 + monthlyRate, 12) - 1, 4))}`
          }
          help={t.loan.rateHelp}
        >
          {(id) => (
            <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center">
              <div className="w-full sm:w-36">
                <PercentInput
                  id={id}
                  value={params.rate}
                  onChange={(value) => update({ rate: value })}
                  decimals={2}
                />
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

        <ParamField
          label={t.loan.term}
          className="sm:col-span-2"
          helper={t.loan.termHint(params.months, (params.months / 12).toFixed(1))}
          help={t.loan.termHelp}
        >
          {(id) => (
            <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center">
              <div className="min-w-0 flex-1">
                <SliderWithNumber
                  id={id}
                  ariaLabel={t.loan.term}
                  value={termUnit === 'months' ? params.months : Math.round(params.months / 12)}
                  onChange={(value) =>
                    update({ months: termUnit === 'months' ? value : value * 12 })
                  }
                  min={termUnit === 'months' ? MIN_LOAN_MONTHS : 1}
                  max={termUnit === 'months' ? MAX_LOAN_MONTHS : 30}
                />
              </div>
              <SegmentedControl
                ariaLabel={t.loan.term}
                value={termUnit}
                onChange={setTermUnit}
                options={[
                  { value: 'months', label: t.loan.termUnitMonths },
                  { value: 'years', label: t.loan.termUnitYears },
                ]}
              />
            </div>
          )}
        </ParamField>

        <ParamField
          label={t.loan.disbursementDate}
          helper={t.loan.disbursementDateHint}
          help={t.loan.disbursementDateHelp}
        >
          {(id) => (
            <input
              id={id}
              type="date"
              className={inputClass}
              value={params.disbursementDate}
              onChange={(event) => update({ disbursementDate: event.target.value })}
            />
          )}
        </ParamField>

        <ParamField
          label={t.loan.system}
          className="sm:col-span-2 lg:col-span-3"
          help={t.loan.systemHelp}
        >
          {(id) => (
            <SegmentedControl
              id={id}
              ariaLabel={t.loan.system}
              value={params.system}
              onChange={(value) => update({ system: value })}
              options={systems}
            />
          )}
        </ParamField>

        <ParamField
          label={t.loan.graceMonths}
          helper={t.loan.graceMonthsHint}
          help={t.loan.graceMonthsHelp}
        >
          {(id) => (
            <NumberInput
              id={id}
              value={params.graceMonths}
              onChange={(value) => update({ graceMonths: Math.round(value) })}
              min={0}
              max={Math.max(0, params.months - 1)}
              decimals={0}
            />
          )}
        </ParamField>

        <ParamField
          label={t.loan.graceType}
          className="sm:col-span-1 lg:col-span-2"
          help={t.loan.graceTypeHelp}
        >
          {(id) => (
            <SegmentedControl
              id={id}
              ariaLabel={t.loan.graceType}
              value={params.graceType}
              onChange={(value) => update({ graceType: value })}
              options={graceTypes}
            />
          )}
        </ParamField>

      </div>

      <div className="mt-6 space-y-3">
        <Disclosure
          title={t.loan.charges}
          summary={chargesActive ? t.loan.chargesActive : t.loan.chargesNone}
        >
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <ParamField label={t.loan.lifeInsurance} help={t.loan.lifeInsuranceHelp}>
              {(id) => (
                <PercentInput
                  id={id}
                  value={params.lifeInsuranceRate}
                  onChange={(value) => update({ lifeInsuranceRate: value })}
                  max={10}
                  decimals={3}
                />
              )}
            </ParamField>
            <ParamField label={t.loan.assetInsurance} help={t.loan.assetInsuranceHelp}>
              {(id) => (
                <CurrencyInput
                  id={id}
                  value={params.assetInsurance}
                  onChange={(value) => update({ assetInsurance: value })}
                />
              )}
            </ParamField>
            <ParamField label={t.loan.adminFee} help={t.loan.adminFeeHelp}>
              {(id) => (
                <CurrencyInput
                  id={id}
                  value={params.adminFee}
                  onChange={(value) => update({ adminFee: value })}
                />
              )}
            </ParamField>
          </div>
        </Disclosure>

        <Disclosure
          title={t.loan.extraPayments}
          summary={
            params.extraPayments.length > 0
              ? t.loan.extraPaymentsCount(params.extraPayments.length)
              : t.common.none
          }
        >
          <ExtraPaymentsEditor params={params} onChange={update} />
        </Disclosure>
      </div>

      <div className="mt-4">
        <WarningList messages={messages} />
      </div>
    </Card>
  )
}
