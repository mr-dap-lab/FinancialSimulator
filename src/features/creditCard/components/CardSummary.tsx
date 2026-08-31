import { SummaryCard } from '../../../components/ui'
import { useLocale } from '../../../context/locale'
import { useI18n } from '../../../i18n/i18n'
import { formatDate } from '../../../lib/dates'
import type { CreditCardController } from '../useCreditCard'

export function CardSummary({ card }: { card: CreditCardController }) {
  const { params, totals, comparison } = card
  const { formatCurrency, formatPercent } = useLocale()
  const { t, dateLocale } = useI18n()

  const neverClears = totals.monthsToZero === null

  /**
   * The comparison strip. Framed against whichever alternative is most useful:
   * paying in full is already interest-free, so it gets a confirmation rather
   * than a contrast.
   */
  const strip = (() => {
    if (params.strategy === 'full') {
      return {
        tone: 'success' as const,
        text: t.card.stripFull(formatCurrency(totals.totalFees)),
      }
    }

    const { minimum, fixed } = comparison
    const saving = minimum.totalInterest - fixed.totalInterest
    const describe = (months: number | null) =>
      months === null ? t.card.stripNever(params.months) : t.card.stripTakes(months)

    return {
      tone: saving > 0 ? ('tertiary' as const) : ('neutral' as const),
      text: t.card.stripCompare({
        minimumTime: describe(minimum.monthsToZero),
        minimumInterest: formatCurrency(minimum.totalInterest),
        fixedAmount: formatCurrency(params.fixedPayment),
        fixedTime: describe(fixed.monthsToZero),
        fixedInterest: formatCurrency(fixed.totalInterest),
        saving: saving > 0 ? t.card.stripSaving(formatCurrency(saving)) : '',
      }),
    }
  })()

  const STRIP_STYLES = {
    success: 'bg-success-container text-on-success-container',
    tertiary: 'bg-tertiary-container text-on-tertiary-container',
    neutral: 'bg-surface-container text-on-surface-variant',
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <SummaryCard
          label={t.card.nextPayment}
          value={formatCurrency(totals.nextPayment)}
          caption={t.card.nextPaymentCaption(formatDate(totals.nextDueDate, dateLocale))}
          tone="accent"
        />
        <SummaryCard
          label={t.card.totalPaid}
          value={formatCurrency(totals.totalPaid)}
          caption={t.card.totalPaidCaption(totals.months)}
        />
        <SummaryCard
          label={t.card.totalInterest}
          value={formatCurrency(totals.totalInterest)}
          caption={t.card.totalInterestCaption}
        />
        <SummaryCard
          label={t.card.totalFees}
          value={formatCurrency(totals.totalFees)}
          caption={params.feeIncludesVat ? t.card.totalFeesWithVat : t.card.totalFeesNoVat}
        />
        <SummaryCard
          label={t.card.monthsToZero}
          value={neverClears ? t.common.never : String(totals.monthsToZero)}
          caption={neverClears ? t.card.neverCaption : t.card.monthsToZeroCaption}
          tone={neverClears ? 'negative' : 'default'}
        />
        <SummaryCard
          label={t.card.utilizationCard}
          value={formatPercent(totals.finalUtilization)}
          caption={t.card.utilizationCaption(
            totals.months,
            formatPercent(totals.peakUtilization),
          )}
        />
      </div>

      {neverClears && (
        <p className="flex items-start gap-3 rounded-md bg-error-container px-4 py-3 text-sm font-medium text-on-error-container">
          <svg viewBox="0 0 24 24" className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true">
            <path
              fill="currentColor"
              d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"
            />
          </svg>
          {t.card.neverBanner}
        </p>
      )}

      <p className={`rounded-md px-4 py-3 text-sm leading-relaxed ${STRIP_STYLES[strip.tone]}`}>
        {strip.text}
      </p>
    </div>
  )
}
