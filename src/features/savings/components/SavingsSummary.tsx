import { SummaryCard } from '../../../components/ui'
import { useLocale } from '../../../context/locale'
import { useT } from '../../../i18n/i18n'
import type { SavingsController } from '../useSavings'

export function SavingsSummary({ savings }: { savings: SavingsController }) {
  const { totals, comparison, params } = savings
  const { formatCurrency, formatPercent, formatMultiplier } = useLocale()
  const t = useT()

  /**
   * The plain-language reading of the projection, built from the live
   * parameters rather than a fixed string so it always agrees with the cards.
   */
  const sentence = t.savings.sentence({
    contribution: formatCurrency(params.monthlyContribution),
    years: params.years,
    rate: formatPercent(params.annualRate),
    growth:
      params.contributionGrowth > 0
        ? t.savings.sentenceGrowth(formatPercent(params.contributionGrowth))
        : '',
    tiers:
      params.tiersEnabled && params.tiers.length > 1
        ? t.savings.sentenceTiers(params.tiers.length)
        : '',
    balance: formatCurrency(totals.finalBalance),
    interest: formatCurrency(totals.netInterest),
  })

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <SummaryCard
          label={t.savings.finalBalance}
          value={formatCurrency(totals.finalBalance)}
          caption={t.savings.finalBalanceCaption(totals.months)}
          tone="accent"
        />
        <SummaryCard
          label={t.savings.totalContributed}
          value={formatCurrency(totals.totalContributed)}
          caption={t.savings.totalContributedCaption(totals.months)}
        />
        <SummaryCard
          label={t.savings.grossInterest}
          value={formatCurrency(totals.grossInterest)}
          caption={t.savings.grossInterestCaption}
        />
        <SummaryCard
          label={t.savings.totalWithholding}
          value={formatCurrency(totals.totalWithholding)}
          caption={t.savings.totalWithholdingCaption(formatPercent(params.withholdingRate))}
          tone="negative"
        />
        <SummaryCard
          label={t.savings.netInterest}
          value={formatCurrency(totals.netInterest)}
          caption={t.savings.netInterestCaption}
        />
        <SummaryCard
          label={t.savings.multiplier}
          value={formatMultiplier(totals.multiplier)}
          caption={t.savings.multiplierCaption}
        />
      </div>

      {comparison && (
        <div className="grid grid-cols-1 gap-4 rounded-md bg-secondary-container p-4 text-on-secondary-container sm:grid-cols-3">
          <div>
            <p className="text-xs font-medium opacity-80">{t.savings.realCompounding}</p>
            <p className="mt-1 text-lg font-medium tabular-nums">
              {formatCurrency(totals.finalBalance)}
            </p>
          </div>
          <div>
            <p className="text-xs font-medium opacity-80">{t.savings.comparisonDivided}</p>
            <p className="mt-1 text-lg font-medium tabular-nums">
              {formatCurrency(comparison.finalBalance)}
            </p>
          </div>
          <div>
            <p className="text-xs font-medium opacity-80">{t.savings.difference}</p>
            <p className="mt-1 text-lg font-medium tabular-nums">
              {formatCurrency(totals.finalBalance - comparison.finalBalance)}
            </p>
          </div>
        </div>
      )}

      <p className="text-sm leading-relaxed text-on-surface-variant">{sentence}</p>
    </div>
  )
}
