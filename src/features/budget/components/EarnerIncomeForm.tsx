import { CurrencyInput, ParamField, Select } from '../../../components/ui'
import { useT } from '../../../i18n/i18n'
import { PAY_FREQUENCIES } from '../../../lib/budget'
import type { EarnerIncome, PayFrequency } from '../../../lib/budget'

/**
 * The income block used for both "Tu ingreso mensual neto" and "Ingreso neto
 * del cónyuge" — identical fields, built once and rendered twice, per the
 * spec's own framing ("two identical blocks").
 */
export function EarnerIncomeForm({
  earner,
  onChange,
}: {
  earner: EarnerIncome
  onChange: (patch: Partial<EarnerIncome>) => void
}) {
  const t = useT()

  const frequencyOptions: { value: PayFrequency; label: string }[] = PAY_FREQUENCIES.map((frequency) => ({
    value: frequency,
    label: FREQUENCY_LABEL(t)[frequency],
  }))

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <ParamField label={t.budget.grossAmount} help={t.budget.grossAmountHelp}>
        {(id) => (
          <CurrencyInput id={id} value={earner.grossAmount} onChange={(value) => onChange({ grossAmount: value })} />
        )}
      </ParamField>

      <ParamField label={t.budget.frequency} help={t.budget.frequencyHelp}>
        {(id) => (
          <Select
            id={id}
            value={earner.frequency}
            onChange={(value) => onChange({ frequency: value })}
            options={frequencyOptions}
          />
        )}
      </ParamField>

      <div className="hidden lg:block" aria-hidden="true" />

      <ParamField label={t.budget.federalWithholding} help={t.budget.federalWithholdingHelp}>
        {(id) => (
          <CurrencyInput
            id={id}
            value={earner.federalWithholding}
            onChange={(value) => onChange({ federalWithholding: value })}
          />
        )}
      </ParamField>

      <ParamField label={t.budget.stateWithholding} help={t.budget.stateWithholdingHelp}>
        {(id) => (
          <CurrencyInput
            id={id}
            value={earner.stateWithholding}
            onChange={(value) => onChange({ stateWithholding: value })}
          />
        )}
      </ParamField>

      <ParamField label={t.budget.localWithholding} help={t.budget.localWithholdingHelp}>
        {(id) => (
          <CurrencyInput
            id={id}
            value={earner.localWithholding}
            onChange={(value) => onChange({ localWithholding: value })}
          />
        )}
      </ParamField>

      <ParamField label={t.budget.otherTaxes} help={t.budget.otherTaxesHelp}>
        {(id) => (
          <CurrencyInput id={id} value={earner.otherTaxes} onChange={(value) => onChange({ otherTaxes: value })} />
        )}
      </ParamField>

      <ParamField label={t.budget.fica} help={t.budget.ficaHelp}>
        {(id) => <CurrencyInput id={id} value={earner.fica} onChange={(value) => onChange({ fica: value })} />}
      </ParamField>

      <ParamField label={t.budget.medicare} help={t.budget.medicareHelp}>
        {(id) => (
          <CurrencyInput id={id} value={earner.medicare} onChange={(value) => onChange({ medicare: value })} />
        )}
      </ParamField>

      <ParamField label={t.budget.insuranceBenefits} help={t.budget.insuranceBenefitsHelp}>
        {(id) => (
          <CurrencyInput
            id={id}
            value={earner.insuranceBenefits}
            onChange={(value) => onChange({ insuranceBenefits: value })}
          />
        )}
      </ParamField>

      <ParamField label={t.budget.retirementSavings} help={t.budget.retirementSavingsHelp}>
        {(id) => (
          <CurrencyInput
            id={id}
            value={earner.retirementSavings}
            onChange={(value) => onChange({ retirementSavings: value })}
          />
        )}
      </ParamField>

      <ParamField label={t.budget.otherIncome} help={t.budget.otherIncomeHelp}>
        {(id) => (
          <CurrencyInput
            id={id}
            value={earner.otherIncome}
            onChange={(value) => onChange({ otherIncome: value })}
          />
        )}
      </ParamField>

      <ParamField label={t.budget.otherIncomeFrequency} help={t.budget.otherIncomeFrequencyHelp}>
        {(id) => (
          <Select
            id={id}
            value={earner.otherIncomeFrequency}
            onChange={(value) => onChange({ otherIncomeFrequency: value })}
            options={frequencyOptions}
          />
        )}
      </ParamField>
    </div>
  )
}

const FREQUENCY_LABEL = (t: ReturnType<typeof useT>): Record<PayFrequency, string> => ({
  weekly: t.budget.freqWeekly,
  biweekly: t.budget.freqBiweekly,
  semiMonthly: t.budget.freqSemiMonthly,
  monthly: t.budget.freqMonthly,
  quarterly: t.budget.freqQuarterly,
  annual: t.budget.freqAnnual,
})
