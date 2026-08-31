// @vitest-environment jsdom
import { describe, expect, it } from 'vitest'
import { collectBlocks, planPdfLayout } from '../report'

describe('planPdfLayout — pure pagination planner', () => {
  const PAGE_HEIGHT = 700
  const GAP = 10

  it('places every block on page 0 when everything fits', () => {
    const placements = planPdfLayout([100, 150, 200], PAGE_HEIGHT, GAP)
    expect(placements).toHaveLength(3)
    expect(placements.every((p) => p.page === 0)).toBe(true)
    // Stacked one after another with the gap between them, never split.
    expect(placements[0]).toMatchObject({ blockIndex: 0, y: 0, sliceHeight: 100 })
    expect(placements[1]).toMatchObject({ blockIndex: 1, y: 110, sliceHeight: 150 })
    expect(placements[2]).toMatchObject({ blockIndex: 2, y: 270, sliceHeight: 200 })
  })

  it('starts a fresh page for a block that would otherwise be split, rather than splitting it', () => {
    // 600 fits; the next 200 would land at y=610, overflowing a 700pt page.
    const placements = planPdfLayout([600, 200], PAGE_HEIGHT, GAP)
    expect(placements[0]).toMatchObject({ blockIndex: 0, page: 0, y: 0, sliceHeight: 600 })
    // Never split: exactly one placement for block 1, whole, on the next page.
    const blockOnePlacements = placements.filter((p) => p.blockIndex === 1)
    expect(blockOnePlacements).toHaveLength(1)
    expect(blockOnePlacements[0]).toMatchObject({ page: 1, y: 0, sliceHeight: 200 })
  })

  it('never splits a block that fits on one page, however many other blocks surround it', () => {
    const heights = [300, 300, 300, 300, 300]
    const placements = planPdfLayout(heights, PAGE_HEIGHT, GAP)
    for (let i = 0; i < heights.length; i++) {
      const forThisBlock = placements.filter((p) => p.blockIndex === i)
      expect(forThisBlock).toHaveLength(1)
      expect(forThisBlock[0].sliceHeight).toBe(heights[i])
    }
  })

  it('is the one exception allowed to span pages: a block taller than a full page slices across consecutive pages', () => {
    const placements = planPdfLayout([1750], PAGE_HEIGHT, GAP)
    // 1750 / 700 = three slices: 700, 700, 350.
    expect(placements).toHaveLength(3)
    expect(placements.map((p) => p.page)).toEqual([0, 1, 2])
    expect(placements.map((p) => p.sliceHeight)).toEqual([700, 700, 350])
    expect(placements.map((p) => p.sourceOffset)).toEqual([0, 700, 1400])
    // Every slice starts at the top margin of its own page.
    expect(placements.every((p) => p.y === 0)).toBe(true)
  })

  it('always starts an oversized block on a fresh page, even mid-page', () => {
    const placements = planPdfLayout([100, 1750], PAGE_HEIGHT, GAP)
    const spanning = placements.filter((p) => p.blockIndex === 1)
    expect(spanning[0].page).toBe(1) // not page 0, where the first block left off
  })

  it('continues the next block right after a spanning block leaves off, on its final page', () => {
    const placements = planPdfLayout([1750, 100], PAGE_HEIGHT, GAP)
    const last = placements.find((p) => p.blockIndex === 1)
    // The spanning block's last slice was 350pt tall; the next block should
    // continue on that same final page (2), just below it.
    expect(last).toMatchObject({ page: 2, y: 350 + GAP, sliceHeight: 100 })
  })
})

describe('collectBlocks — report DOM traversal', () => {
  function el(html: string): HTMLElement {
    const div = document.createElement('div')
    div.innerHTML = html
    return div
  }

  it('captures an unmarked child with no nested markers whole (a plain summary-card grid)', () => {
    const root = el('<div class="summary">unmarked content, no cards inside</div>')
    const blocks = collectBlocks(root)
    expect(blocks).toHaveLength(1)
    expect(blocks[0].className).toBe('summary')
  })

  it('captures a marked child directly (the header, the parameter recap, the table)', () => {
    const root = el('<div data-pdf-block="true" class="header">Report header</div>')
    const blocks = collectBlocks(root)
    expect(blocks).toHaveLength(1)
    expect(blocks[0].className).toBe('header')
  })

  it('descends into a charts wrapper that contains marked chart cards, instead of treating it as one block', () => {
    const root = el(`
      <div class="charts-grid">
        <section data-pdf-block="true" class="chart-a">Chart A</section>
        <section data-pdf-block="true" class="chart-b">Chart B</section>
        <section data-pdf-block="true" class="chart-c">Chart C</section>
      </div>
    `)
    const blocks = collectBlocks(root)
    expect(blocks.map((b) => b.className)).toEqual(['chart-a', 'chart-b', 'chart-c'])
  })

  it('handles a full report shape: header, parameters, summary, three charts, table', () => {
    const root = el(`
      <div data-pdf-block="true" class="header">Header</div>
      <div data-pdf-block="true" class="parameters">Parameters</div>
      <div class="summary">Summary cards, no Card wrapper</div>
      <div class="charts">
        <section data-pdf-block="true" class="chart-1">Chart 1</section>
        <section data-pdf-block="true" class="chart-2">Chart 2</section>
      </div>
      <div data-pdf-block="true" class="table">Detail table</div>
    `)
    const blocks = collectBlocks(root)
    expect(blocks.map((b) => b.className)).toEqual([
      'header',
      'parameters',
      'summary',
      'chart-1',
      'chart-2',
      'table',
    ])
  })
})
