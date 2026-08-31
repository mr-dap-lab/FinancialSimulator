import type { ReactNode } from 'react'

/** M3 card variants. https://m3.material.io/components/cards */
type CardVariant = 'elevated' | 'filled' | 'outlined'

const VARIANTS: Record<CardVariant, string> = {
  elevated: 'bg-surface-low shadow-e1',
  filled: 'bg-surface-high',
  outlined: 'bg-surface border border-outline-variant',
}

interface CardProps {
  title?: ReactNode
  description?: ReactNode
  actions?: ReactNode
  children: ReactNode
  variant?: CardVariant
  className?: string
  bodyClassName?: string
}

export function Card({
  title,
  description,
  actions,
  children,
  variant = 'elevated',
  className = '',
  bodyClassName = 'p-4 sm:p-6',
}: CardProps) {
  return (
    <section className={`rounded-lg ${VARIANTS[variant]} ${className}`}>
      {(title || actions) && (
        <header className="flex flex-wrap items-center justify-between gap-3 px-4 pt-4 sm:px-6 sm:pt-5">
          <div>
            {/* M3 title-medium */}
            {title && <h2 className="text-base leading-6 font-medium text-on-surface">{title}</h2>}
            {/* M3 body-small */}
            {description && (
              <p className="mt-0.5 text-xs leading-4 text-on-surface-variant">{description}</p>
            )}
          </div>
          {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
        </header>
      )}
      <div className={bodyClassName}>{children}</div>
    </section>
  )
}
