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
        className="w-full max-w-4xl rounded-lg bg-surface shadow-e3"
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

        <div className="max-h-[75vh] overflow-y-auto px-4 py-4 sm:px-6">
          <div ref={captureRef} className="space-y-6 bg-surface p-2">
            <div>
              <h1 className="text-xl font-normal text-on-surface">{t.app.title}</h1>
              <p className="text-sm text-on-surface-variant">{featureTitle}</p>
              <p className="text-xs text-on-surface-variant">{t.common.generatedOn(generatedOn)}</p>
            </div>

            {parameters.length > 0 && (
              <div>
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

            <div>{summary}</div>
            <div>{charts}</div>
            <div>
              <h3 className="mb-2 text-sm font-medium text-on-surface">{t.common.schedule}</h3>
              <ReportTable data={table} mode={tableMode} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
