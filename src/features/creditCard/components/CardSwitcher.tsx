import { Button, Card, IconButton, ParamField, Select, TextInput } from '../../../components/ui'
import { useT } from '../../../i18n/i18n'
import { CARD_FRANCHISES } from '../../../lib/creditCard'
import type { CardFranchise, CardProfile } from '../../../lib/creditCard'
import { MAX_CREDIT_CARDS } from '../../../lib/limits'

const DeleteIcon = () => (
  <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
    <path
      fill="currentColor"
      d="M6 19a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"
    />
  </svg>
)

const FRANCHISE_LABEL_KEY = {
  visa: 'franchiseVisa',
  mastercard: 'franchiseMastercard',
  amex: 'franchiseAmex',
  discover: 'franchiseDiscover',
  diners: 'franchiseDiners',
} as const satisfies Record<CardFranchise, string>

interface CardSwitcherProps {
  cards: CardProfile[]
  activeCardId: string
  onSelect: (id: string) => void
  onAdd: () => void
  onRemove: (id: string) => void
  onRename: (id: string, name: string) => void
  onFranchiseChange: (id: string, franchise: CardFranchise) => void
}

/**
 * Lets the user manage more than one card — add, remove, switch between them,
 * and set each one's own name and franchise. Every other credit-card
 * component only ever sees the *active* card's `params`/`rows`/`totals`, so
 * this is the one place that deals with the list itself.
 */
export function CardSwitcher({
  cards,
  activeCardId,
  onSelect,
  onAdd,
  onRemove,
  onRename,
  onFranchiseChange,
}: CardSwitcherProps) {
  const t = useT()
  const atLimit = cards.length >= MAX_CREDIT_CARDS
  const activeCard = cards.find((card) => card.id === activeCardId) ?? cards[0]

  const franchiseOptions = CARD_FRANCHISES.map((code) => ({
    value: code,
    label: t.card[FRANCHISE_LABEL_KEY[code]],
  }))

  return (
    <Card
      title={t.card.cardsTitle}
      actions={
        <Button
          variant="tonal"
          onClick={onAdd}
          disabled={atLimit}
          title={atLimit ? t.card.cardLimitReached(MAX_CREDIT_CARDS) : undefined}
        >
          + {t.card.addCard}
        </Button>
      }
    >
      <div role="radiogroup" aria-label={t.card.cardsTitle} className="flex flex-wrap gap-2">
        {cards.map((card, index) => {
          const selected = card.id === activeCardId
          const label = card.name.trim() || t.card.defaultCardName(index + 1)
          return (
            <div
              key={card.id}
              className={
                'flex items-center overflow-hidden rounded-full border pr-1 transition-colors ' +
                (selected
                  ? 'border-primary bg-secondary-container'
                  : 'border-outline-variant hover:bg-on-surface/4')
              }
            >
              <button
                type="button"
                role="radio"
                aria-checked={selected}
                onClick={() => onSelect(card.id)}
                className={
                  'h-10 px-4 text-sm font-medium transition-colors focus-visible:outline ' +
                  'focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary ' +
                  (selected ? 'text-on-secondary-container' : 'text-on-surface-variant')
                }
              >
                {label}
              </button>
              {cards.length > 1 && (
                <IconButton
                  variant="danger"
                  aria-label={`${t.common.delete} ${label}`}
                  onClick={() => onRemove(card.id)}
                  className="h-8 w-8"
                >
                  <DeleteIcon />
                </IconButton>
              )}
            </div>
          )
        })}
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <ParamField label={t.card.cardName} help={t.card.cardNameHelp}>
          {(id) => (
            <TextInput id={id} value={activeCard.name} onChange={(value) => onRename(activeCard.id, value)} />
          )}
        </ParamField>

        <ParamField label={t.card.franchise} help={t.card.franchiseHelp}>
          {(id) => (
            <Select
              id={id}
              value={activeCard.franchise}
              onChange={(value) => onFranchiseChange(activeCard.id, value)}
              options={franchiseOptions}
            />
          )}
        </ParamField>
      </div>
    </Card>
  )
}
