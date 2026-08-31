import { useEffect, useId, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { Button } from '../ui'
import { useI18n } from '../../i18n/i18n'
import { generatePdf } from '../../lib/report'
import type { ReportParameter, ReportTableData } from '../../lib/report'
import { ReportTable } from './ReportTable'

interface ReportViewProps {
  open: boolean
  onClose: () => void
  /** The feature's own name, e.g. "Ahorro" — becomes part of the PDF filename too. */
  featureTitle: string
  parameters: ReportParameter[]
  /** The feature's own already-built summary component, reused as-is. */
  summary: ReactNode
  /** The feature's own already-built charts component, reused as-is. */
  charts: ReactNode
  table: ReportTableData
}

/**
 * Shared by all seven features — the "Ver reporte" button opens this with
 * that feature's own summary/charts (reused verbatim, not re-derived) plus a
 * parameter recap and detail table this component owns. "Descargar PDF"
 * snapshots the same content `generatePdf` renders here.
 */
export function ReportView({ open, onClose, featureTitle, parameters, summary, charts, table }: ReportViewProps) {
  const { t, dateLocale } = useI18n()
  const titleId = useId()
  const captureRef = useRef<HTMLDivElement>(null)
  const closeButtonRef = useRef<HTMLButtonElement>(null)
  const previouslyFocused = useRef<HTMLElement | null>(null)
  const [downloading, setDownloading] = useState(false)
  // Switched to 'capped' only for the instant `generatePdf` captures the DOM,
  // then switched back — see `ReportTable`'s own doc comment for why.
  const [tableMode, setTableMode] = useState<'full' | 'capped'>('full')

  useEffect(() => {
    if (!open) return
    previouslyFocused.current = document.activeElement as HTMLElement | null
    closeButtonRef.current?.focus()

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      previouslyFocused.current?.focus()
    }
  }, [open, onClose])

  if (!open) return null

  const generatedOn = new Intl.DateTimeFormat(dateLocale, {
    dateStyle: 'long',
    timeStyle: 'short',
  }).format(new Date())

  const handleDownload = async () => {
    if (!captureRef.current) return
    setDownloading(true)
    setTableMode('capped')
    try {
      // One frame so the capped table actually paints before capture.
      await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)))
      const filename = `${featureTitle.toLowerCase().replace(/\s+/g, '-')}-reporte.pdf`
      await generatePdf(captureRef.current, filename)
    } finally {
      setTableMode('full')
      setDownloading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-40 flex items-start justify-center overflow-y-auto bg-scrim/60 p-4 sm:p-8">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        // As wide as the app's own main content column (`max-w-7xl` in
        // App.tsx), not a narrower, arbitrary modal width — every feature's
        // chart/summary grid uses viewport-width breakpoints (`lg:`, `xl:`),
        // so a narrower dialog gave those grids the same column *count* as
        // the real tab page but far less width per column, squeezing charts
        // into a box they were never designed to fit. Matching the width
        // removes that mismatch instead of patching each grid individually.
        className="w-full max-w-7xl rounded-lg bg-surface shadow-e3"
      >
        <div className="flex items-center justify-between gap-3 border-b border-outline-variant px-4 py-3 sm:px-6">
          <h2 id={titleId} className="text-lg font-medium text-on-surface">
            {t.common.viewReport} — {featureTitle}
          </h2>
          <div className="flex items-center gap-2">
            <Button variant="filled" onClick={handleDownload} disabled={downloading}>
              {t.common.downloadPdf}
            </Button>
            <Button ref={closeButtonRef} variant="outlined" onClick={onClose}>
              {t.common.close}
            </Button>
          </div>
        </div>

        {/* This report's own scrollable region — a fixed viewport-relative
            height with its own overflow, so nothing here depends on
            whatever scroll/overflow rules happen to apply to the feature
            tab this was opened from. */}
        <div className="max-h-[75vh] overflow-y-auto px-4 py-4 sm:px-6">
          <div ref={captureRef} className="flex flex-col gap-6 bg-surface p-2">
            <div data-pdf-block="true">
              <h1 className="text-xl font-normal text-on-surface">{t.app.title}</h1>
              <p className="text-sm text-on-surface-variant">{featureTitle}</p>
              <p className="text-xs text-on-surface-variant">{t.common.generatedOn(generatedOn)}</p>
            </div>

            {parameters.length > 0 && (
              <div data-pdf-block="true">
                <h3 className="mb-2 text-sm font-medium text-on-surface">{t.common.reportParameters}</h3>
                <dl className="grid grid-cols-1 gap-x-6 gap-y-1 text-sm sm:grid-cols-2">
                  {parameters.map((parameter) => (
                    <div key={parameter.label} className="flex justify-between gap-3 border-b border-outline-variant/40 py-1">
                      <dt className="text-on-surface-variant">{parameter.label}</dt>
                      <dd className="text-right font-medium text-on-surface tabular-nums">{parameter.value}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            )}

            {/* Both wrappers below are deliberately left unmarked (no
                `data-pdf-block`) rather than treated as one block each:
                `summary` has no `<Card>`s inside it in any feature, so
                `collectBlocks` naturally captures it whole — exactly right,
                a row of summary cards is small enough to always fit
                together. `charts` does have one `<Card>` per chart in every
                feature, and `Card` itself carries the marker — leaving this
                wrapper unmarked is what lets `collectBlocks` descend into
                those and give each chart its own page-break-safe block
                instead of merging the whole chart grid into one. See
                `collectBlocks` in `lib/report.ts`. */}
            <div>{summary}</div>
            <div>{charts}</div>

            <div data-pdf-block="true">
              <h3 className="mb-2 text-sm font-medium text-on-surface">{t.common.schedule}</h3>
              <ReportTable data={table} mode={tableMode} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
