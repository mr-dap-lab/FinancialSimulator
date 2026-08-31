import { useT } from '../../i18n/i18n'
import { REPORT_PDF_ROW_CAP } from '../../lib/report'
import type { ReportTableData } from '../../lib/report'

/**
 * The report's own detail table — deliberately not each feature's real
 * schedule component (`CollapsibleYearTable`, or a feature's plain table):
 * those are built for on-screen interaction (virtualised scrolling,
 * collapsible years), not for being snapshotted whole. This one is a plain
 * table fed the same row/column data every feature already builds for its
 * own CSV export.
 *
 * `mode="full"` (the on-screen report) renders every row. `mode="capped"` —
 * switched to only for the moment `generatePdf` captures the report, then
 * switched back — renders the first `REPORT_PDF_ROW_CAP` rows plus a caption
 * pointing at the CSV, so a 480-row schedule doesn't become a multi-metre-tall
 * PDF image.
 */
export function ReportTable({ data, mode }: { data: ReportTableData; mode: 'full' | 'capped' }) {
  const t = useT()
  const rows = mode === 'capped' ? data.rows.slice(0, REPORT_PDF_ROW_CAP) : data.rows
  const truncated = mode === 'capped' && data.rows.length > REPORT_PDF_ROW_CAP

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[36rem] border-collapse text-sm">
        <thead>
          <tr className="text-left text-xs font-medium text-on-surface-variant">
            {data.columns.map((column) => (
              <th key={column} className="border-b border-outline-variant px-3 py-2 whitespace-nowrap">
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={index} className="border-b border-outline-variant/60 text-on-surface-variant">
              {row.map((cell, cellIndex) => (
                <td key={cellIndex} className="px-3 py-1.5 whitespace-nowrap">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {truncated && <p className="mt-2 text-xs text-on-surface-variant">{t.common.csvForFullDetail}</p>}
    </div>
  )
}
