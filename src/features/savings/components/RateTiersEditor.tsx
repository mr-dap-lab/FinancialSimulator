import { Button, CurrencyInput, IconButton, NumberInput, PercentInput, SegmentedControl } from '../../../components/ui'
import { useLocale } from '../../../context/locale'
import { useT } from '../../../i18n/i18n'
import { MAX_RATE_TIERS } from '../../../lib/limits'
import { makeTier } from '../../../lib/simulate'
import type { RateTier, RateTierMode, SavingsParams } from '../../../lib/simulate'
import type { TierWarning } from '../useSavings'
import { WarningList } from '../../shared/WarningList'

interface RateTiersEditorProps {
  params: SavingsParams
  warnings: TierWarning[]
  onChange: (patch: Partial<SavingsParams>) => void
}

export function RateTiersEditor({ params, warnings, onChange }: RateTiersEditorProps) {
  const { formatCurrency } = useLocale()
  const t = useT()
  const { tiers, tierMode } = params
  const byMonth = tierMode === 'age'

  const modes: { value: RateTierMode; label: string }[] = [
    { value: 'age', label: t.savings.byAge },
    { value: 'balance', label: t.savings.byBalance },
  ]

  const replace = (index: number, patch: Partial<RateTier>) => {
    onChange({ tiers: tiers.map((tier, i) => (i === index ? { ...tier, ...patch } : tier)) })
  }

  const atLimit = tiers.length >= MAX_RATE_TIERS

  const add = () => {
    if (atLimit) return
    const last = tiers[tiers.length - 1]
    const from = byMonth ? last.from + 12 : Math.max(last.from * 2, 10_000_000)
    onChange({ tiers: [...tiers, makeTier(from, last.annualRate + 0.01)] })
  }

  const messages = warnings.map((warning) =>
    warning.code === 'duplicate'
      ? t.savings.duplicateTier(
          warning.unit === 'month' ? t.savings.unitMonth : t.savings.unitBalance,
          warning.at,
        )
      : t.savings.tierBeyondHorizon(warning.months),
  )

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <SegmentedControl
          ariaLabel={t.savings.tiers}
          value={tierMode}
          onChange={(value) => onChange({ tierMode: value })}
          options={modes}
        />
        <Button
          variant="tonal"
          onClick={add}
          disabled={atLimit}
          title={atLimit ? t.savings.tierLimitReached(MAX_RATE_TIERS) : undefined}
          className="ml-auto"
        >
          + {t.savings.addTier}
        </Button>
      </div>

      <p className="text-xs text-on-surface-variant">
        {byMonth ? t.savings.byAgeHelp : t.savings.byBalanceHelp}
      </p>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[26rem] text-sm">
          <thead>
            <tr className="text-left text-xs font-medium text-on-surface-variant">
              <th className="pb-2 pr-3">{byMonth ? t.savings.fromMonth : t.savings.minBalance}</th>
              <th className="pb-2 pr-3">{t.savings.tierRate}</th>
              <th className="w-12 pb-2" />
            </tr>
          </thead>
          <tbody>
            {tiers.map((tier, index) => {
              const locked = index === 0
              return (
                <tr key={tier.id} className="align-top">
                  <td className="py-1.5 pr-3">
                    {locked ? (
                      <div className="flex h-11 items-center rounded-sm border border-dashed border-outline bg-surface-container px-3 text-sm text-on-surface-variant tabular-nums">
                        {byMonth ? t.savings.monthOne : formatCurrency(0)}
                      </div>
                    ) : byMonth ? (
                      <NumberInput
                        ariaLabel={t.savings.fromMonth}
                        value={tier.from}
                        onChange={(value) => replace(index, { from: Math.round(value) })}
                        min={2}
                        max={params.years * 12}
                        decimals={0}
                      />
                    ) : (
                      <CurrencyInput
                        ariaLabel={t.savings.minBalance}
                        value={tier.from}
                        onChange={(value) => replace(index, { from: value })}
                      />
                    )}
                  </td>
                  <td className="py-1.5 pr-3">
                    <PercentInput
                      ariaLabel={t.savings.tierRate}
                      value={tier.annualRate}
                      onChange={(value) => replace(index, { annualRate: value })}
                    />
                  </td>
                  <td className="py-1.5">
                    <IconButton
                      variant="danger"
                      onClick={() => onChange({ tiers: tiers.filter((_, i) => i !== index) })}
                      disabled={locked}
                      title={locked ? t.savings.firstTierLocked : t.common.delete}
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
              )
            })}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-on-surface-variant">
        {t.savings.tierFootnote(
          byMonth ? t.savings.tierStartMonth : t.savings.tierStartBalance,
        )}
      </p>

      <WarningList messages={messages} />
    </div>
  )
}
