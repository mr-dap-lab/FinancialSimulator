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
 * Captures and paginates *per section*, not as one continuous canvas: a
 * single whole-report screenshot has no idea where a chart's own boundaries
 * are, so slicing it into fixed-height pages used to cut wherever the
 * page-height math landed — including through the middle of a chart. See
 * `collectBlocks` for how a section is identified, and `planPdfLayout` for
 * the (DOM-free, unit-tested) page-break decisions.
 */
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas-pro'

const PAGE_MARGIN_PT = 24
/** Vertical breathing room between two blocks placed on the same page. */
const BLOCK_GAP_PT = 12

/**
 * Marks one independently-captured, independently-paginated chunk of a
 * report: the header, the parameter recap, the whole summary section, one
 * individual chart, or the detail table. Set directly on a handful of
 * wrapper `<div>`s in `ReportView` and, generically, on `Card`'s own root —
 * every feature's chart grid wraps each chart in its own `<Card>`, so that
 * one attribute is enough to give every feature's charts per-chart
 * granularity with no per-feature changes.
 */
const BLOCK_ATTR = 'data-pdf-block'

/**
 * Walks the capture root's direct children and returns one DOM element per
 * report section. A child that contains further `[data-pdf-block]`
 * descendants (the charts grid, whose wrapper `<div>` in `ReportView` is
 * deliberately left unmarked) defers to those descendants instead of being
 * captured as one oversized block — that is what gives each individual
 * chart its own page-break-safe boundary instead of the whole chart grid
 * being treated as one unit. A child with no markers anywhere inside it
 * (the plain summary-card grid every feature's summary already is) is
 * captured whole, which is the correct, safe behaviour for a group of
 * cards small enough to always fit on one page together.
 */
export function collectBlocks(root: HTMLElement): HTMLElement[] {
  const blocks: HTMLElement[] = []
  for (const child of Array.from(root.children)) {
    if (!(child instanceof HTMLElement)) continue
    const nested = child.querySelectorAll<HTMLElement>(`[${BLOCK_ATTR}]`)
    if (nested.length > 0) {
      blocks.push(...Array.from(nested))
    } else {
      blocks.push(child)
    }
  }
  return blocks
}

export interface PdfPlacement {
  /** Index into the block-heights array this placement was planned for. */
  blockIndex: number
  /** 0-based PDF page this slice lands on. */
  page: number
  /** Y position (pt) within the page to draw at. */
  y: number
  /** How far into the block's own image this slice starts (pt) — always 0
   * except for a block spanning more than one page. */
  sourceOffset: number
  /** Height (pt) of this slice. Equal to the block's full height unless the
   * block is taller than one page. */
  sliceHeight: number
}

/**
 * Pure pagination planner — no DOM, canvas, or jsPDF involved, so this is
 * unit-tested directly on plain numbers (see `report.test.ts`).
 *
 * Charts and summary/parameter groups are never split: a block is placed
 * whole on the current page if it fits in the remaining space, or whole on
 * a fresh page otherwise — the check and the placement happen together, so
 * nothing can be cut between them. The one allowed exception is a block
 * taller than a full page on its own (an unexpectedly long detail table):
 * it always starts on its own fresh page and slices across as many
 * following pages as it needs, exactly like the previous whole-report
 * capture used to slice everything.
 */
export function planPdfLayout(
  blockHeights: number[],
  pageHeight: number,
  gap: number = BLOCK_GAP_PT,
): PdfPlacement[] {
  const placements: PdfPlacement[] = []
  let page = 0
  let cursorY = 0

  blockHeights.forEach((height, blockIndex) => {
    if (height <= pageHeight) {
      if (cursorY > 0 && cursorY + height > pageHeight) {
        page += 1
        cursorY = 0
      }
      placements.push({ blockIndex, page, y: cursorY, sourceOffset: 0, sliceHeight: height })
      cursorY += height + gap
      return
    }

    // Taller than one page: always starts fresh, then slices across pages.
    if (cursorY > 0) {
      page += 1
      cursorY = 0
    }
    let remaining = height
    let sourceOffset = 0
    let lastSliceHeight = 0
    while (remaining > 0) {
      const sliceHeight = Math.min(remaining, pageHeight)
      placements.push({ blockIndex, page, y: 0, sourceOffset, sliceHeight })
      remaining -= sliceHeight
      sourceOffset += sliceHeight
      lastSliceHeight = sliceHeight
      if (remaining > 0) page += 1
    }
    cursorY = lastSliceHeight + gap
  })

  return placements
}

export async function generatePdf(element: HTMLElement, filename: string): Promise<void> {
  const blocks = collectBlocks(element)
  const captureTargets = blocks.length > 0 ? blocks : [element]

  const pdf = new jsPDF({ unit: 'pt', format: 'a4' })
  const pageWidth = pdf.internal.pageSize.getWidth() - PAGE_MARGIN_PT * 2
  const pageHeight = pdf.internal.pageSize.getHeight() - PAGE_MARGIN_PT * 2

  const captures = await Promise.all(
    captureTargets.map(async (block) => {
      const canvas = await html2canvas(block, { scale: 2, backgroundColor: '#ffffff', useCORS: true })
      const height = (canvas.height * pageWidth) / canvas.width
      return { imgData: canvas.toDataURL('image/png'), height }
    }),
  )

  const placements = planPdfLayout(
    captures.map((capture) => capture.height),
    pageHeight,
    BLOCK_GAP_PT,
  )

  let currentPage = 0
  for (const placement of placements) {
    if (placement.page > currentPage) {
      pdf.addPage()
      currentPage = placement.page
    }
    const capture = captures[placement.blockIndex]
    if (!capture || capture.height <= 0) continue
    // A spanning block's later slices place the *same, full* image at a
    // negative offset so only the current slice falls within the page —
    // the same technique the original single-canvas version used, just
    // scoped to one block's image instead of the whole report's.
    const y = PAGE_MARGIN_PT + placement.y - placement.sourceOffset
    pdf.addImage(capture.imgData, 'PNG', PAGE_MARGIN_PT, y, pageWidth, capture.height)
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
