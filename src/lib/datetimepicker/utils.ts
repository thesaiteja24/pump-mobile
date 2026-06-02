// ─── Constants ────────────────────────────────────────────────────────────────

export const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
export const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

// ─── Types ────────────────────────────────────────────────────────────────────

export interface DateTimePickerProps {
  value?: Date | null
  onChange?: (date: Date | undefined) => void
  mode?: 'date' | 'time' | 'datetime'
  label?: string
  placeholder?: string
  minimumDate?: Date
  maximumDate?: Date
  showToday?: boolean
}

/**
 * A single cell in the 6×7 calendar grid.
 * Cells from adjacent months have isCurrentMonth = false.
 */
export interface CalendarCell {
  day: number
  month: number // 0-indexed
  year: number
  isCurrentMonth: boolean
}

// ─── Year range ───────────────────────────────────────────────────────────────

/**
 * Returns a year list bounded by minYear..maxYear.
 * Defaults: past 100 years up to the current year.
 */
export function getYears(minYear?: number, maxYear?: number): number[] {
  const now = new Date().getFullYear()
  const start = minYear ?? now - 100
  const end = maxYear ?? now
  return Array.from({ length: end - start + 1 }, (_, i) => start + i)
}

// ─── Calendar grid (always 42 cells = 6 rows) ─────────────────────────────────

/**
 * Builds a fixed 42-cell (6 rows × 7 cols) grid for the given month.
 * Leading/trailing cells come from the previous/next months so the grid
 * height never changes between months — eliminating layout flicker.
 */
export function getCalendarCells(navDate: Date): CalendarCell[] {
  const yr = navDate.getFullYear()
  const mo = navDate.getMonth()
  const firstWeekday = new Date(yr, mo, 1).getDay() // 0 = Sun
  const daysInThisMonth = new Date(yr, mo + 1, 0).getDate()
  const daysInPrevMonth = new Date(yr, mo, 0).getDate()

  const cells: CalendarCell[] = []

  // Leading days from previous month
  const prevMo = mo === 0 ? 11 : mo - 1
  const prevYr = mo === 0 ? yr - 1 : yr
  for (let i = firstWeekday - 1; i >= 0; i--) {
    cells.push({ day: daysInPrevMonth - i, month: prevMo, year: prevYr, isCurrentMonth: false })
  }

  // Current month days
  for (let d = 1; d <= daysInThisMonth; d++) {
    cells.push({ day: d, month: mo, year: yr, isCurrentMonth: true })
  }

  // Trailing days from next month — pad to exactly 42
  const nextMo = mo === 11 ? 0 : mo + 1
  const nextYr = mo === 11 ? yr + 1 : yr
  let nextDay = 1
  while (cells.length < 42) {
    cells.push({ day: nextDay++, month: nextMo, year: nextYr, isCurrentMonth: false })
  }

  return cells
}

// ─── Date parsing ─────────────────────────────────────────────────────────────

/**
 * Parse a date-only string ("YYYY-MM-DD" or ISO "YYYY-MM-DDTHH:…") into a
 * LOCAL Date to avoid the UTC-midnight ±1 day timezone shift.
 */
export function parseDateOnly(value: string | null | undefined): Date | null {
  if (!value)
    return null
  const datePart = value.split('T')[0]
  const parts = datePart.split('-')
  if (parts.length !== 3)
    return null
  const y = Number(parts[0])
  const m = Number(parts[1]) - 1
  const d = Number(parts[2])
  if (Number.isNaN(y) || Number.isNaN(m) || Number.isNaN(d))
    return null
  return new Date(y, m, d)
}

export function getActiveDate(value: Date | null | undefined): Date {
  return value instanceof Date && !Number.isNaN(value.getTime()) ? value : new Date()
}

export function getDisplayString(value: Date | null | undefined, mode: 'date' | 'time' | 'datetime', placeholder: string) {
  if (!value || !(value instanceof Date) || Number.isNaN(value.getTime())) {
    return placeholder
  }
  if (mode === 'time') {
    return value.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }
  if (mode === 'datetime') {
    return `${value.toLocaleDateString()} ${value.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
  }
  return value.toLocaleDateString()
}
