import type { ReactNode } from 'react'

export type SummaryTone = 'default' | 'negative' | 'accent'

const TONES: Record<SummaryTone, { container: string; value: string }> = {
  default: { container: 'bg-surface-low', value: 'text-on-surface' },
  negative: { container: 'bg-error-container', value: 'text-on-error-container' },
  accent: { container: 'bg-primary-container', value: 'text-on-primary-container' },
}

interface SummaryCardProps {
  label: string
  /** Pre-formatted — the card does not know about currencies. */
  value: string
  caption?: ReactNode
  tone?: SummaryTone
}

/** An M3 filled card carrying one headline figure. */
export function SummaryCard({ label, value, caption, tone = 'default' }: SummaryCardProps) {
  const styles = TONES[tone]
  const muted = tone === 'default' ? 'text-on-surface-variant' : 'opacity-70'

  return (
    <div className={`rounded-md p-4 ${styles.container}`}>
      {/* M3 label-medium */}
      <p className={`text-xs leading-4 font-medium ${muted}`}>{label}</p>
      {/* M3 headline-small, tightened for long currency strings */}
      <p className={`mt-1.5 text-xl leading-7 font-normal tabular-nums ${styles.value}`}>{value}</p>
      {caption && <p className={`mt-1 text-xs leading-4 ${muted}`}>{caption}</p>}
    </div>
  )
}
