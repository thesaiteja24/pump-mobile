import { useThemeColor } from '@/hooks/useThemeColor'
import React, { useMemo } from 'react'
import { StyleSheet, View } from 'react-native'

// ─── Types ───────────────────────────────────────────────────────────────────

export interface HeatMapEntry {
  /** 'YYYY-MM-DD' */
  date: string
  /** 1 = done, 0 = missed */
  count: number
  /** 0 to 1, used for color intensity (quantity habits) */
  intensity?: number
}

/**
 * vertical   – columns = calendar weeks, rows = days of week (Sun→Sat). Default.
 * horizontal – rows = calendar weeks, columns = days of week (Sun→Sat).
 * fill       – evenly distributed grid in `numRows` rows.
 */
export type HeatMapLayout = 'vertical' | 'horizontal' | 'fill'

/**
 * Controls fill flow direction (only applies when layout='fill').
 * row    – days flow left → right, then wrap down (row-major). Default.
 * column – days flow top → bottom, then wrap right (column-major).
 */
export type HeatMapFillLayout = 'row' | 'column'

interface HeatMapProps {
  values: HeatMapEntry[]
  /** How many past days to show (default 30) */
  numDays?: number
  /** Size of each square in px (default 12) */
  squareSize?: number
  /** Gap between squares in px (default 5) */
  gutter?: number
  /** Accent color for active days. Defaults to green (#22c55e) */
  activeColor?: string
  /** Grid layout mode (default 'vertical') */
  layout?: HeatMapLayout
  /**
   * Number of rows for 'fill' layout.
   * e.g. numDays=30, numRows=4 → 4 rows × 8 cols.
   * Defaults to Math.ceil(Math.sqrt(numDays)).
   */
  numRows?: number
  /**
   * Flow direction for 'fill' layout (default 'row').
   * 'row'    – left→right then wraps down.
   * 'column' – top→bottom then wraps right.
   */
  fillLayout?: HeatMapFillLayout
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function toKey(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function Square({
  active,
  squareSize,
  activeColor,
  inactiveBg,
  intensity = 1,
  id,
}: {
  active: boolean
  squareSize: number
  activeColor: string
  inactiveBg: string
  intensity?: number
  id: string
}) {
  return (
    <View
      key={id}
      style={{
        width: squareSize,
        height: squareSize,
        borderRadius: squareSize * 0.25,
        backgroundColor: active ? activeColor : inactiveBg,
        opacity: active ? Math.min(1, Math.max(0.2, intensity)) : 1,
      }}
    />
  )
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function HeatMap({
  values,
  numDays = 30,
  squareSize = 12,
  gutter = 5,
  activeColor = '#22c55e',
  layout = 'vertical',
  numRows,
  fillLayout = 'row',
}: HeatMapProps) {
  const colors = useThemeColor()
  const inactiveBg = colors.isDark ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.08)'

  // Build active-date set (normalise ISO strings)
  const activeDates = useMemo(() => {
    const map = new Map<string, number>()
    for (const v of values) {
      if (v.count > 0) {
        const id = v.date.split('T')[0]
        map.set(id, v.intensity ?? 1)
      }
    }
    return map
  }, [values])

  // Build ordered list of days (oldest → newest)
  const days = useMemo(() => {
    const today = new Date()
    const list: Date[] = []
    for (let i = numDays - 1; i >= 0; i--) {
      const d = new Date(today)
      d.setDate(today.getDate() - i)
      list.push(d)
    }
    return list
  }, [numDays])

  /**
   * Returns a 2-D array[row][col] of (Date | null).
   * null = empty padding cell.
   */
  const grid = useMemo<(Date | null)[][]>(() => {
    if (layout === 'fill') {
      const rows = numRows ?? Math.ceil(Math.sqrt(numDays))
      const cols = Math.ceil(numDays / rows)
      // Pad the END: real days always start from top-left
      const padCount = rows * cols - numDays
      const padded: (Date | null)[] = [...days, ...Array(padCount).fill(null)]

      if (fillLayout === 'row') {
        // Row-major: left→right, wrap down. result[row] = one full row of cols
        return Array.from({ length: rows }, (_, r) => padded.slice(r * cols, (r + 1) * cols))
      } else {
        // Column-major: top→bottom, wrap right. result[row][col] = padded[col*rows + row]
        return Array.from({ length: rows }, (_, r) =>
          Array.from({ length: cols }, (__, c) => padded[c * rows + r] ?? null),
        )
      }
    }

    if (layout === 'horizontal') {
      // rows = calendar weeks, cols = day-of-week (0=Sun … 6=Sat)
      // Pad front so first day lands on correct column
      const firstDow = days[0].getDay()
      const padded: (Date | null)[] = [...Array(firstDow).fill(null), ...days]
      // Group by week (every 7 items = one row)
      const rows: (Date | null)[][] = []
      for (let i = 0; i < padded.length; i += 7) {
        rows.push(padded.slice(i, i + 7))
      }
      return rows
    }

    // vertical (default): cols = calendar weeks, rows = day-of-week
    // We return rows[dayOfWeek][weekIndex]
    const firstDow = days[0].getDay()
    const padded: (Date | null)[] = [...Array(firstDow).fill(null), ...days]
    // cols[weekIndex] = array of 7 day slots
    const cols: (Date | null)[][] = []
    for (let i = 0; i < padded.length; i += 7) {
      cols.push(padded.slice(i, i + 7))
    }
    // Transpose: rows[dow][week]
    const numWeeks = cols.length
    const transposed: (Date | null)[][] = Array.from({ length: 7 }, (_, dow) =>
      Array.from({ length: numWeeks }, (__, wi) => cols[wi]?.[dow] ?? null),
    )
    return transposed
  }, [days, layout, numDays, numRows, fillLayout])

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <View style={styles.wrapper}>
      <View style={[styles.grid, { gap: gutter }]}>
        {grid.map((row, ri) => (
          <View key={ri} style={[styles.row, { gap: gutter }]}>
            {row.map((date, ci) => {
              if (!date) {
                return (
                  <View
                    key={`pad-${ri}-${ci}`}
                    style={{
                      width: squareSize,
                      height: squareSize,
                      borderRadius: squareSize * 0.25,
                      backgroundColor: 'transparent',
                    }}
                  />
                )
              }
              const key = toKey(date)
              return (
                <Square
                  key={key}
                  id={key}
                  active={activeDates.has(key)}
                  intensity={activeDates.get(key)}
                  squareSize={squareSize}
                  activeColor={activeColor}
                  inactiveBg={inactiveBg}
                />
              )
            })}
          </View>
        ))}
      </View>
    </View>
  )
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
    marginTop: 8,
    gap: 10,
  },
  grid: {
    flexDirection: 'column',
  },
  row: {
    flexDirection: 'row',
  },
})
