/** Pure date helpers over ISO `yyyy-mm-dd` strings. No Date objects escape. */

const parse = (iso: string): [number, number, number] => {
  const [year, month, day] = iso.split('-').map(Number)
  return [year, month, day]
}

const pad = (value: number): string => String(value).padStart(2, '0')

/** Days in a given 1-based month. */
export function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate()
}

/**
 * Adds whole months, clamping the day so 31 Jan + 1 month lands on 28/29 Feb
 * rather than rolling into March.
 */
export function addMonths(iso: string, months: number): string {
  const [year, month, day] = parse(iso)
  const absolute = year * 12 + (month - 1) + months
  const targetYear = Math.floor(absolute / 12)
  const targetMonth = (absolute % 12) + 1
  const clamped = Math.min(day, daysInMonth(targetYear, targetMonth))
  return `${targetYear}-${pad(targetMonth)}-${pad(clamped)}`
}

export function addDays(iso: string, days: number): string {
  const [year, month, day] = parse(iso)
  const shifted = new Date(Date.UTC(year, month - 1, day + days))
  return shifted.toISOString().slice(0, 10)
}

/** Sets the day of month, clamped to the month's length. */
export function withDayOfMonth(iso: string, day: number): string {
  const [year, month] = parse(iso)
  return `${year}-${pad(month)}-${pad(Math.min(day, daysInMonth(year, month)))}`
}

export function todayIso(): string {
  const now = new Date()
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`
}

/** "15 mar 2027" in es-CO. Parsed as UTC so the day never shifts by timezone. */
export function formatDate(iso: string, locale: string): string {
  const [year, month, day] = parse(iso)
  return new Intl.DateTimeFormat(locale, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(Date.UTC(year, month - 1, day)))
}
