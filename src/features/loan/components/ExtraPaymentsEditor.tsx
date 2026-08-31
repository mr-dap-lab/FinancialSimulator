import { Button, CurrencyInput, IconButton, NumberInput, Select } from '../../../components/ui'
import { useT } from '../../../i18n/i18n'
import { makeExtraPayment } from '../../../lib/amortize'
import { MAX_EXTRA_PAYMENTS } from '../../../lib/limits'
import type { ExtraPayment, ExtraPaymentEffect, LoanParams } from '../../../lib/amortize'

interface ExtraPaymentsEditorProps {
  params: LoanParams
  onChange: (patch: Partial<LoanParams>) => void
}

export function ExtraPaymentsEditor({ params, onChange }: ExtraPaymentsEditorProps) {
  const t = useT()
  const { extraPayments } = params

  const effects: { value: ExtraPaymentEffect; label: string }[] = [
    { value: 'reduceTerm', label: t.loan.reduceTerm },
    { value: 'reducePayment', label: t.loan.reducePayment },
  ]

  /** Sorting on write keeps the table ordered without a separate sort step. */
  const commit = (next: ExtraPayment[]) =>
    onChange({ extraPayments: [...next].sort((a, b) => a.month - b.month) })

  const replace = (id: string, patch: Partial<ExtraPayment>) =>
    commit(extraPayments.map((extra) => (extra.id === id ? { ...extra, ...patch } : extra)))

  const atLimit = extraPayments.length >= MAX_EXTRA_PAYMENTS

  const add = () => {
    if (atLimit) return
    const last = extraPayments[extraPayments.length - 1]
    const month = Math.min(last ? last.month + 12 : 12, params.months)
    commit([...extraPayments, makeExtraPayment(month, 5_000_000)])
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <p className="text-xs text-on-surface-variant">{t.loan.extraPaymentsHint}</p>
        <Button
          variant="tonal"
          onClick={add}
          disabled={atLimit}
          title={atLimit ? t.loan.extraPaymentLimitReached(MAX_EXTRA_PAYMENTS) : undefined}
          className="ml-auto"
        >
          + {t.loan.addExtraPayment}
        </Button>
      </div>

      {extraPayments.length === 0 ? (
        <p className="rounded-xs border border-dashed border-outline px-3 py-6 text-center text-xs text-on-surface-variant">
          {t.loan.noExtraPayments}
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[30rem] text-sm">
            <thead>
              <tr className="text-left text-xs font-medium text-on-surface-variant">
                <th className="pb-2 pr-3">{t.common.month}</th>
                <th className="pb-2 pr-3">{t.loan.amount}</th>
                <th className="pb-2 pr-3">{t.loan.effect}</th>
                <th className="w-12 pb-2" />
              </tr>
            </thead>
            <tbody>
              {extraPayments.map((extra, index) => (
                <tr key={extra.id} className="align-top">
                  <td className="w-28 py-1.5 pr-3">
                    <NumberInput
                      ariaLabel={t.common.month}
                      value={extra.month}
                      onChange={(value) => replace(extra.id, { month: Math.round(value) })}
                      min={1}
                      max={params.months}
                      decimals={0}
                    />
                  </td>
                  <td className="py-1.5 pr-3">
                    <CurrencyInput
                      ariaLabel={t.loan.amount}
                      value={extra.amount}
                      onChange={(value) => replace(extra.id, { amount: value })}
                    />
                  </td>
                  <td className="py-1.5 pr-3">
                    <Select
                      ariaLabel={t.loan.effect}
                      value={extra.effect}
                      onChange={(value) => replace(extra.id, { effect: value })}
                      options={effects}
                    />
                  </td>
                  <td className="py-1.5">
                    <IconButton
                      variant="danger"
                      onClick={() => commit(extraPayments.filter((item) => item.id !== extra.id))}
                      aria-label={`${t.common.delete} ${index + 1}`}
                      className="mt-2"
                    >
                      <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
                        <path
                          fill="currentColor"
                          d="M6 19a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"
                        />
                      </svg>
                    </IconButton>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
