import type { ReactNode } from 'react'

interface FeatureIntroProps {
  /** A small, purely decorative glyph — `aria-hidden` is applied here, not by the caller. */
  icon: ReactNode
  /** The bold, one-line hook — what the feature does, in one sentence. */
  title: string
  /** One or two sentences expanding on `title` — who it's for, what it shows. */
  description: string
  className?: string
}

/**
 * The soft-accent banner every feature tab opens with, in the space next to
 * "Ver reporte" — same filled-card language as `SummaryCard`'s `accent`
 * tone, so the tab's opening banner and its eventual headline result read as
 * one consistent visual family rather than two different card styles.
 */
export function FeatureIntro({ icon, title, description, className = '' }: FeatureIntroProps) {
  return (
    <div className={`flex items-start gap-3 rounded-md bg-primary-container p-4 ${className}`}>
      <span
        aria-hidden="true"
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-on-primary-container/10 text-on-primary-container"
      >
        {icon}
      </span>
      <div>
        <p className="text-sm leading-5 font-medium text-on-primary-container">{title}</p>
        <p className="mt-0.5 text-sm leading-5 text-on-primary-container/80">{description}</p>
      </div>
    </div>
  )
}
