/**
 * Client-side PDF export — the one exception, alongside the mock login,
 * to "no backend": `jspdf` + `html2canvas` (via the `html2canvas-pro` fork)
 * run entirely in the browser, so generating a PDF never leaves the client.
 *
 * `html2canvas-pro`, not the original `html2canvas`, deliberately: the
 * original can't parse the `oklab()`/`oklch()` color functions Tailwind v4
 * emits for this app's own theme (`shadow-e1`'s alpha-mixed shadow color,
 * among others), and throws mid-capture — "Attempting to parse an
 * unsupported color function". The `-pro` fork is a drop-in replacement
 * (same API) maintained specifically to add modern CSS color-function
 * support; nothing else about the approach changes.
 *
 * Snapshots whatever DOM element it's given into a multi-page PDF, slicing
 * the captured canvas into page-height strips rather than shrinking
 * everything onto one page — a tall report (many charts, a detail table)
 * reads the same as a real multi-page document instead of a single
 * illegibly-small image.
 */
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas-pro'

const PAGE_MARGIN_PT = 24

export async function generatePdf(element: HTMLElement, filename: string): Promise<void> {
  const canvas = await html2canvas(element, {
    scale: 2,
    backgroundColor: '#ffffff',
    useCORS: true,
  })

  const pdf = new jsPDF({ unit: 'pt', format: 'a4' })
  const pageWidth = pdf.internal.pageSize.getWidth() - PAGE_MARGIN_PT * 2
  const pageHeight = pdf.internal.pageSize.getHeight() - PAGE_MARGIN_PT * 2

  const imgWidth = pageWidth
  const imgHeight = (canvas.height * imgWidth) / canvas.width
  const imgData = canvas.toDataURL('image/png')

  let heightLeft = imgHeight
  let position = 0

  pdf.addImage(imgData, 'PNG', PAGE_MARGIN_PT, PAGE_MARGIN_PT, imgWidth, imgHeight)
  heightLeft -= pageHeight

  while (heightLeft > 0) {
    position -= pageHeight
    pdf.addPage()
    pdf.addImage(imgData, 'PNG', PAGE_MARGIN_PT, position + PAGE_MARGIN_PT, imgWidth, imgHeight)
    heightLeft -= pageHeight
  }

  pdf.save(filename)
}

/** A flat "as entered" recap row — one per parameter shown in the report. */
export interface ReportParameter {
  label: string
  value: string
}

/** The detail table's data, shared between the on-screen (full) and PDF (capped) renderings. */
export interface ReportTableData {
  columns: string[]
  rows: (string | number)[][]
}

/** The PDF caps any detail table to this many rows — see `ReportTable`. */
export const REPORT_PDF_ROW_CAP = 30
