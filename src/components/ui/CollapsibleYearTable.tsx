import { useEffect, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { useLocale } from '../../context/locale'
import { useT } from '../../i18n/i18n'
import { isNegative } from '../../lib/format'
import { Card } from './Card'
import { Button } from './Controls'

/** Rows are fixed-height so the virtualiser can work in exact offsets. */
const ROW_HEIGHT = 44
const OVERSCAN = 8

/** The minimum shape a schedule row must have to be grouped by year. */
export interface ScheduleRow {
  month: number
  year: number
  monthOfYear: number
}

export interface YearTableColumn<T extends ScheduleRow> {
  key: string
  header: string
  /** The numeric value for a month, formatted as currency. */
  cell?: (row: T) => number
  /** Renders the cell yourself — for dates, percentages, or badges. */
  render?: (row: T) => ReactNode
  /**
   * The year subtotal. Omit where a subtotal is meaningless — the group cell is
   * then left blank rather than showing a misleading sum.
   */
  subtotal?: (rows: T[]) => number
  /** Renders the subtotal cell yourself. Takes precedence over `subtotal`. */
  renderSubtotal?: (rows: T[]) => ReactNode
  align?: 'left' | 'right'
  /** Renders the month value in a stronger weight, e.g. a running balance. */
  emphasize?: boolean
}

interface CollapsibleYearTableProps<T extends ScheduleRow> {
  rows: T[]
  columns: YearTableColumn<T>[]
  title?: ReactNode
  description?: ReactNode
  /** Feature-specific header controls, e.g. an export button. */
  actions?: ReactNode
  /** Years open on first render. Defaults to year 1 only. */
  defaultExpandedYears?: number[]
  /** Extra classes for a month row, e.g. to highlight an extra payment. */
  rowClassName?: (row: T) => string
  /**
   * Makes month rows expandable. The height must be known up front so the
   * virtualiser keeps exact offsets — return it from `detailHeight`.
   */
  renderDetail?: (row: T) => ReactNode
  detailHeight?: (row: T) => number
  /** Minimum table width before horizontal scrolling kicks in. */
  minWidth?: string
  /**
   * Renders the "Mes" cell. Defaults to the month number plus a name derived
   * from its position in the year — drop the name when the table already has a
   * real date column, where a schedule-relative name would read as wrong.
   */
  monthLabel?: (row: T) => ReactNode
}

interface YearGroup<T> {
  year: number
  rows: T[]
}

type VirtualItem<T> =
  | { kind: 'group'; group: YearGroup<T> }
  | { kind: 'month'; row: T }
  | { kind: 'detail'; row: T; height: number }

function groupByYear<T extends ScheduleRow>(rows: T[]): YearGroup<T>[] {
  const groups: YearGroup<T>[] = []
  for (const row of rows) {
    let group = groups[groups.length - 1]
    if (!group || group.year !== row.year) {
      group = { year: row.year, rows: [] }
      groups.push(group)
    }
    group.rows.push(row)
  }
  return groups
}

/**
 * An M3 data table of a month-by-month schedule, grouped into collapsible
 * years. https://m3.material.io/components/data-tables
 *
 * Rows are virtualised with spacer rows above and below the window, which keeps
 * a 480-month schedule at roughly 30 DOM rows while leaving the `<thead>` free
 * to stay sticky. Detail rows declare their height so the offsets stay exact
 * without measuring anything.
 */
export function CollapsibleYearTable<T extends ScheduleRow>({
  rows,
  columns,
  title,
  description,
  actions,
  defaultExpandedYears = [1],
  rowClassName,
  renderDetail,
  detailHeight,
  minWidth = 'min-w-[58rem]',
  monthLabel,
}: CollapsibleYearTableProps<T>) {
  const { formatCurrency } = useLocale()
  const t = useT()
  const groups = useMemo(() => groupByYear(rows), [rows])
  const [expandedYears, setExpandedYears] = useState<Set<number>>(
    () => new Set(defaultExpandedYears),
  )
  const [expandedMonths, setExpandedMonths] = useState<Set<number>>(() => new Set())

  const items = useMemo<VirtualItem<T>[]>(() => {
    const list: VirtualItem<T>[] = []
    for (const group of groups) {
      list.push({ kind: 'group', group })
      if (!expandedYears.has(group.year)) continue
      for (const row of group.rows) {
        list.push({ kind: 'month', row })
        if (renderDetail && expandedMonths.has(row.month)) {
          list.push({ kind: 'detail', row, height: detailHeight?.(row) ?? 160 })
        }
      }
    }
    return list
  }, [groups, expandedYears, expandedMonths, renderDetail, detailHeight])

  /** Running pixel offset of every item, so mixed heights stay exact. */
  const offsets = useMemo(() => {
    const result = new Array<number>(items.length + 1)
    result[0] = 0
    for (let index = 0; index < items.length; index++) {
      const item = items[index]
      result[index + 1] = result[index] + (item.kind === 'detail' ? item.height : ROW_HEIGHT)
    }
    return result
  }, [items])

  const totalHeight = offsets[items.length] ?? 0

  const scrollRef = useRef<HTMLDivElement>(null)
  const [scrollTop, setScrollTop] = useState(0)
  const [viewport, setViewport] = useState(520)

  useEffect(() => {
    const element = scrollRef.current
    if (!element) return
    const observer = new ResizeObserver(() => setViewport(element.clientHeight))
    observer.observe(element)
    setViewport(element.clientHeight)
    return () => observer.disconnect()
  }, [])

  /** First item whose end is past `position`. */
  const indexAt = (position: number) => {
    let low = 0
    let high = items.length
    while (low < high) {
      const mid = (low + high) >> 1
      if (offsets[mid + 1] <= position) low = mid + 1
      else high = mid
    }
    return low
  }

  const start = Math.max(0, indexAt(scrollTop) - OVERSCAN)
  const end = Math.min(items.length, indexAt(scrollTop + viewport) + 1 + OVERSCAN)
  const visible = items.slice(start, end)
  const topSpacer = offsets[start] ?? 0
  const bottomSpacer = Math.max(0, totalHeight - (offsets[end] ?? totalHeight))

  const toggle = (set: Set<number>, key: number) => {
    const next = new Set(set)
    if (next.has(key)) next.delete(key)
    else next.add(key)
    return next
  }

  const allExpanded = expandedYears.size === groups.length && groups.length > 0
  const columnCount = columns.length + 2

  const cellFor = (column: YearTableColumn<T>, row: T) => {
    if (column.render) {
      return (
        <td
          key={column.key}
          className={`px-4 whitespace-nowrap ${column.align === 'left' ? '' : 'text-right'}`}
        >
          {column.render(row)}
        </td>
      )
    }
    const value = column.cell?.(row) ?? 0
    return (
      <td
        key={column.key}
        className={`px-4 text-right tabular-nums ${
          isNegative(value)
            ? 'text-error'
            : column.emphasize
              ? 'font-medium text-on-surface'
              : 'text-on-surface-variant'
        }`}
      >
        {formatCurrency(value)}
      </td>
    )
  }

  const subtotalFor = (column: YearTableColumn<T>, groupRows: T[]) => {
    if (column.renderSubtotal) {
      return (
        <td key={column.key} className="px-4 text-right whitespace-nowrap">
          {column.renderSubtotal(groupRows)}
        </td>
      )
    }
    if (!column.subtotal) return <td key={column.key} />
    const value = column.subtotal(groupRows)
    return (
      <td
        key={column.key}
        className={`px-4 text-right tabular-nums ${isNegative(value) ? 'text-error' : ''}`}
      >
        {formatCurrency(value)}
      </td>
    )
  }

  return (
    <Card
      title={title}
      description={description}
      bodyClassName="px-0 pb-0 pt-4"
      actions={
        <>
          <Button
            variant="text"
            onClick={() =>
              setExpandedYears(
                allExpanded ? new Set() : new Set(groups.map((group) => group.year)),
              )
            }
          >
            {allExpanded ? t.common.collapseAll : t.common.expandAll}
          </Button>
          {actions}
        </>
      }
    >
      <div
        ref={scrollRef}
        onScroll={(event) => setScrollTop(event.currentTarget.scrollTop)}
        className="max-h-[34rem] overflow-auto"
      >
        <table className={`w-full ${minWidth} border-collapse text-sm`}>
          <thead className="sticky top-0 z-10">
            <tr className="bg-surface-high text-xs font-medium text-on-surface-variant">
              <th
                scope="col"
                className="h-14 border-b border-outline-variant px-4 text-left whitespace-nowrap"
              >
                {t.common.year}
              </th>
              <th
                scope="col"
                className="h-14 border-b border-outline-variant px-4 text-left whitespace-nowrap"
              >
                {t.common.month}
              </th>
              {columns.map((column) => (
                <th
                  key={column.key}
                  scope="col"
                  className={`h-14 border-b border-outline-variant px-4 whitespace-nowrap ${
                    column.align === 'left' ? 'text-left' : 'text-right'
                  }`}
                >
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {topSpacer > 0 && (
              <tr style={{ height: topSpacer }} aria-hidden="true">
                <td colSpan={columnCount} />
              </tr>
            )}

            {visible.map((item) => {
              if (item.kind === 'group') {
                const open = expandedYears.has(item.group.year)
                return (
                  <tr
                    key={`y${item.group.year}`}
                    className="cursor-pointer bg-surface-container font-medium text-on-surface transition-colors hover:bg-surface-high"
                    style={{ height: ROW_HEIGHT }}
                    onClick={() => setExpandedYears((set) => toggle(set, item.group.year))}
                  >
                    <td className="px-4" colSpan={2}>
                      <button
                        type="button"
                        aria-expanded={open}
                        className="flex items-center gap-2 text-left"
                        onClick={(event) => {
                          event.stopPropagation()
                          setExpandedYears((set) => toggle(set, item.group.year))
                        }}
                      >
                        <Chevron open={open} />
                        {t.common.year} {item.group.year}
                      </button>
                    </td>
                    {columns.map((column) => subtotalFor(column, item.group.rows))}
                  </tr>
                )
              }

              if (item.kind === 'detail') {
                return (
                  <tr key={`d${item.row.month}`} className="bg-surface-container">
                    <td colSpan={columnCount} className="px-4 py-3 align-top">
                      {renderDetail?.(item.row)}
                    </td>
                  </tr>
                )
              }

              const expandable = Boolean(renderDetail)
              const open = expandedMonths.has(item.row.month)
              const monthContent = monthLabel ? (
                monthLabel(item.row)
              ) : (
                <>
                  <span className="text-on-surface-variant/70">{item.row.month}</span>
                  <span className="text-on-surface-variant">
                    {t.common.monthNames[item.row.monthOfYear - 1]}
                  </span>
                </>
              )
              return (
                <tr
                  key={`m${item.row.month}`}
                  className={
                    'border-b border-outline-variant/60 transition-colors hover:bg-on-surface/4 ' +
                    (rowClassName?.(item.row) ?? '')
                  }
                  style={{ height: ROW_HEIGHT }}
                >
                  <td className="px-4 text-on-surface-variant/70">{item.row.year}</td>
                  <td className="px-4 whitespace-nowrap">
                    {expandable ? (
                      <button
                        type="button"
                        aria-expanded={open}
                        className="flex items-center gap-1.5 rounded-xs focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                        onClick={() => setExpandedMonths((set) => toggle(set, item.row.month))}
                      >
                        <Chevron open={open} />
                        {monthContent}
                      </button>
                    ) : (
                      <span className="inline-flex items-center gap-1.5">{monthContent}</span>
                    )}
                  </td>
                  {columns.map((column) => cellFor(column, item.row))}
                </tr>
              )
            })}

            {bottomSpacer > 0 && (
              <tr style={{ height: bottomSpacer }} aria-hidden="true">
                <td colSpan={columnCount} />
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </Card>
  )
}

function Chevron({ open }: { open: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={`h-4 w-4 shrink-0 text-on-surface-variant transition-transform ${
        open ? 'rotate-180' : ''
      }`}
    >
      <path fill="currentColor" d="M7.41 8.59 12 13.17l4.59-4.58L18 10l-6 6-6-6z" />
    </svg>
  )
}
