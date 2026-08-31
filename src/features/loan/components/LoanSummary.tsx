import { SummaryCard } from '../../../components/ui'
import { useLocale } from '../../../context/locale'
import { useI18n } from '../../../i18n/i18n'
import { formatDate } from '../../../lib/dates'
import type { LoanController } from '../useLoan'

export function LoanSummary({ loan }: { loan: LoanController }) {
  const { params, totals, rows } = loan
  const { formatCurrency, formatPercent } = useLocale()
  const { t, dateLocale } = useI18n()

  const conventionLabels = {
    EA: t.loan.conventionShortEA,
    NOMINAL_MV: t.loan.conventionShortNominal,
    MONTHLY: t.loan.conventionShortMonthly,
  }

  const amortizing = rows.filter((row) => !row.isGrace)
  const first = amortizing[0]?.totalPayment ?? 0
  const last = amortizing[amortizing.length - 1]?.totalPayment ?? 0

  const paymentValue = totals.levelPayment
    ? formatCurrency(first)
    : `${formatCurrency(first)} → ${formatCurrency(last)}`

  const sentence = t.loan.sentence({
    principal: formatCurrency(params.principal),
    months: params.months,
    rate: formatPercent(params.rate, 2),
    convention: conventionLabels[params.rateConvention],
    payment: formatCurrency(first),
    interest: formatCurrency(totals.totalInterest),
  })

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <SummaryCard
          label={t.loan.monthlyPayment}
          value={paymentValue}
          caption={totals.levelPayment ? t.loan.monthlyPaymentLevel : t.loan.monthlyPaymentRange}
          tone="accent"
        />
        <SummaryCard
          label={t.loan.totalPaid}
          value={formatCurrency(totals.totalPaid)}
          caption={t.loan.totalPaidCaption(totals.months)}
        />
        <SummaryCard
          label={t.loan.totalInterest}
          value={formatCurrency(totals.totalInterest)}
          caption={t.loan.totalInterestCaption}
        />
        <SummaryCard
          label={t.loan.totalInsurance}
          value={formatCurrency(totals.totalInsurance)}
          caption={totals.totalInsurance > 0 ? t.loan.totalInsuranceCaption : t.loan.chargesNone}
        />
        <SummaryCard
          label={t.loan.creditCost}
          value={formatPercent(totals.creditCost)}
          caption={t.loan.creditCostCaption}
        />
        <SummaryCard
          label={t.loan.lastPayment}
          value={formatDate(totals.lastDate, dateLocale)}
          caption={
            totals.savings && totals.savings.months > 0
              ? t.loan.lastPaymentSaved(totals.months, totals.savings.months)
              : t.loan.lastPaymentCaption(totals.months)
          }
        />
      </div>

      {totals.savings && (
        <div className="grid grid-cols-1 gap-4 rounded-md bg-success-container p-4 text-on-success-container sm:grid-cols-3">
          <div>
            <p className="text-xs font-medium opacity-80">{t.loan.savings}</p>
            <p className="mt-1 text-lg font-medium tabular-nums">
              {formatCurrency(totals.savings.interest)}
            </p>
            <p className="mt-0.5 text-xs opacity-70">{t.loan.savingsCaption}</p>
          </div>
          <div>
            <p className="text-xs font-medium opacity-80">{t.loan.monthsSaved}</p>
            <p className="mt-1 text-lg font-medium tabular-nums">
              {totals.savings.months}
            </p>
            <p className="mt-0.5 text-xs opacity-70">{t.loan.monthsSavedCaption}</p>
          </div>
          <div>
            <p className="text-xs font-medium opacity-80">{t.loan.totalExtra}</p>
            <p className="mt-1 text-lg font-medium tabular-nums">
              {formatCurrency(totals.totalExtra)}
            </p>
            <p className="mt-0.5 text-xs opacity-70">{t.loan.totalExtraCaption}</p>
          </div>
        </div>
      )}

      <p className="text-sm leading-relaxed text-on-surface-variant">{sentence}</p>
    </div>
  )
}
