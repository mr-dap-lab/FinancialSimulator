import { Button } from '../../../components/ui'
import { useT } from '../../../i18n/i18n'
import { MAX_AUTO_LOAN_DEBTS, MAX_OTHER_LOAN_DEBTS } from '../../../lib/limits'
import type { DebtConsolidationController } from '../useDebtConsolidation'
import { ConsolidatedLoanCard } from './ConsolidatedLoanCard'
import { DebtCardsSection } from './DebtCardsSection'
import { DebtInstallmentSection } from './DebtInstallmentSection'

const sumBalances = (debts: { balance: number }[]) => debts.reduce((sum, debt) => sum + debt.balance, 0)

export function DebtConsolidationParametersPanel({
  debt,
}: {
  debt: DebtConsolidationController
}) {
  const { params, reset } = debt
  const t = useT()

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button variant="text" onClick={reset}>
          {t.common.reset}
        </Button>
      </div>

      <DebtCardsSection
        debts={params.creditCards}
        subtotal={sumBalances(params.creditCards)}
        onAdd={debt.addCard}
        onRemove={debt.removeCard}
        onUpdate={debt.updateCard}
      />

      <DebtInstallmentSection
        title={t.debtConsolidation.autoTitle}
        subtotal={sumBalances(params.autoLoans)}
        debts={params.autoLoans}
        atLimit={params.autoLoans.length >= MAX_AUTO_LOAN_DEBTS}
        limitMessage={t.debtConsolidation.autoLimitReached(MAX_AUTO_LOAN_DEBTS)}
        addLabel={t.debtConsolidation.addAuto}
        onAdd={debt.addAuto}
        onRemove={debt.removeAuto}
        onUpdate={debt.updateAuto}
      />

      <DebtInstallmentSection
        title={t.debtConsolidation.otherTitle}
        subtotal={sumBalances(params.otherLoans)}
        debts={params.otherLoans}
        atLimit={params.otherLoans.length >= MAX_OTHER_LOAN_DEBTS}
        limitMessage={t.debtConsolidation.otherLimitReached(MAX_OTHER_LOAN_DEBTS)}
        addLabel={t.debtConsolidation.addOther}
        withDescription
        onAdd={() => debt.addOther(t.debtConsolidation.defaultOtherDescription)}
        onRemove={debt.removeOther}
        onUpdate={debt.updateOther}
      />

      <ConsolidatedLoanCard
        consolidated={params.consolidated}
        payment={debt.consolidatedMonthlyPayment}
        onChange={(patch) => debt.update({ consolidated: { ...params.consolidated, ...patch } })}
      />
    </div>
  )
}
