import { useState } from 'react'
import { Button, FeatureIntro, LegalDisclaimer } from '../../components/ui'
import { ReportView } from '../../components/report/ReportView'
import { useLocale } from '../../context/locale'
import { useT } from '../../i18n/i18n'
import { CardCharts } from './components/CardCharts'
import { CardParametersPanel } from './components/CardParametersPanel'
import { CardSchedule } from './components/CardSchedule'
import { CardSummary } from './components/CardSummary'
import { CardSwitcher } from './components/CardSwitcher'
import { PurchasesPanel } from './components/PurchasesPanel'
import { useCreditCard } from './useCreditCard'

const CreditCardIcon = () => (
  <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
    <path fill="currentColor" d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 14H4v-6h16zm0-10H4V6h16z" />
  </svg>
)

const STRATEGY_LABEL_KEY = {
  full: 'strategyFull',
  minimum: 'strategyMinimum',
  fixed: 'strategyFixed',
  percentage: 'strategyPercentage',
} as const

const FRANCHISE_LABEL_KEY = {
  visa: 'franchiseVisa',
  mastercard: 'franchiseMastercard',
  amex: 'franchiseAmex',
  discover: 'franchiseDiscover',
  diners: 'franchiseDiners',
} as const

/**
 * Tarjeta de crédito: parameters, purchases, summary, charts, detail table.
 *
 * The feature owns its parameters through `useCreditCard`; only the locale
 * setting is shared, and that comes from context.
 */
export function CreditCardFeature() {
  const card = useCreditCard()
  const { formatCurrency, formatPercent } = useLocale()
  const t = useT()
  const [showReport, setShowReport] = useState(false)

  const activeCard = card.cards.find((entry) => entry.id === card.activeCardId) ?? card.cards[0]

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <FeatureIntro
          icon={<CreditCardIcon />}
          title={t.card.introTitle}
          description={t.card.introDescription}
          className="flex-1"
        />
        <Button variant="tonal" onClick={() => setShowReport(true)} className="shrink-0">
          {t.common.viewReport}
        </Button>
      </div>
      <CardSwitcher
        cards={card.cards}
        activeCardId={card.activeCardId}
        onSelect={card.selectCard}
        onAdd={() => card.addCard(t.card.defaultCardName(card.cards.length + 1))}
        onRemove={card.removeCard}
        onRename={card.renameCard}
        onFranchiseChange={card.setFranchise}
      />
      <CardParametersPanel card={card} />
      <PurchasesPanel card={card} />
      <CardSummary card={card} />
      <CardCharts card={card} />
      <CardSchedule card={card} />
      <LegalDisclaimer />

      <ReportView
        open={showReport}
        onClose={() => setShowReport(false)}
        featureTitle={t.app.tabs.card}
        parameters={[
          { label: t.card.cardName, value: activeCard.name.trim() || t.card.defaultCardName(1) },
          { label: t.card.franchise, value: t.card[FRANCHISE_LABEL_KEY[activeCard.franchise]] },
          { label: t.card.creditLimit, value: formatCurrency(card.params.creditLimit) },
          { label: t.card.openingBalance, value: formatCurrency(card.params.openingBalance) },
          { label: t.loan.rate, value: formatPercent(card.params.rate, 2) },
          { label: t.card.monthlyFee, value: formatCurrency(card.params.monthlyFee) },
          { label: t.card.cutoffDay, value: String(card.params.cutoffDay) },
          { label: t.card.strategy, value: t.card[STRATEGY_LABEL_KEY[card.params.strategy]] },
        ]}
        summary={<CardSummary card={card} />}
        charts={<CardCharts card={card} />}
        table={{
          columns: [t.common.month, t.card.colPayment, t.card.colInterest, t.card.colTotalBalance],
          rows: card.rows.map((row) => [
            row.month,
            formatCurrency(row.payment),
            formatCurrency(row.interest),
            formatCurrency(row.totalBalance),
          ]),
        }}
      />
    </div>
  )
}
