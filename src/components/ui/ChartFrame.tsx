import type { ReactNode } from 'react'

interface ChartFrameProps {
  /** A one-sentence summary of what the chart shows, read by a screen reader. */
  label: string
  className?: string
  children: ReactNode
}

/**
 * Marks a chart's visual container as a single labelled image.
 *
 * A Recharts SVG's "text" is drawn as vector paths, so without this a screen
 * reader either announces nothing or reads a confusing pile of unlabelled
 * groups. `role="img"` tells it to treat the whole subtree as one opaque
 * image described by `aria-label`, instead of trying to drill into it — the
 * real numbers live in the `VisuallyHiddenTable` rendered alongside it.
 */
export function ChartFrame({ label, className, children }: ChartFrameProps) {
  return (
    <div role="img" aria-label={label} className={className}>
      {children}
    </div>
  )
}
