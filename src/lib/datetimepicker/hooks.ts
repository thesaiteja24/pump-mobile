import * as Haptics from 'expo-haptics'
import { useCallback, useEffect, useRef, useState } from 'react'

import type { CalendarCell, DateTimePickerProps } from './utils'

export function usePickerState(props: DateTimePickerProps, activeDate: Date) {
  const { mode = 'date', minimumDate, maximumDate } = props
  const [currentNavDate, setCurrentNavDate] = useState(() => activeDate)
  const [viewMode, setViewMode] = useState<'calendar' | 'time' | 'month' | 'year'>(mode === 'time' ? 'time' : 'calendar')

  // Sync navigation date when the external value changes (e.g. form reset / initial load)
  const activeDateMs = activeDate.getTime()
  const prevActiveDateMsRef = useRef(activeDateMs)
  useEffect(() => {
    if (activeDateMs !== prevActiveDateMsRef.current) {
      prevActiveDateMsRef.current = activeDateMs
      setCurrentNavDate(activeDate)
    }
  }, [activeDateMs, activeDate])

  const isDateDisabled = useCallback((d: Date) => {
    return (minimumDate && d < minimumDate) || (maximumDate && d > maximumDate) || false
  }, [minimumDate, maximumDate])

  const changeMonth = useCallback((diff: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {})
    setCurrentNavDate(prev => new Date(prev.getFullYear(), prev.getMonth() + diff, 1))
  }, [])

  /**
   * Handles tapping any cell in the 6×7 grid — including overflow cells from
   * adjacent months. Updates currentNavDate immediately so the selection
   * highlight renders right away (before the user presses Done).
   */
  const handleSelectCell = useCallback((cell: CalendarCell) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {})
    const nDate = new Date(cell.year, cell.month, cell.day, activeDate.getHours(), activeDate.getMinutes())
    setCurrentNavDate(nDate)
    // For datetime mode, advance to time selection after picking a day
    if (mode === 'datetime') {
      setViewMode('time')
    }
  }, [activeDate, mode])

  const handleSelectTime = useCallback((h: number, m: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {})
    setCurrentNavDate(prev => new Date(prev.getFullYear(), prev.getMonth(), prev.getDate(), h, m))
  }, [])

  const handleNavSelect = useCallback((val: number, type: 'month' | 'year') => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {})
    setCurrentNavDate(prev =>
      type === 'month'
        ? new Date(prev.getFullYear(), val, 1)
        : new Date(val, prev.getMonth(), 1),
    )
    setViewMode('calendar')
  }, [])

  return {
    currentNavDate,
    setCurrentNavDate,
    viewMode,
    setViewMode,
    isDateDisabled,
    changeMonth,
    handleSelectCell,
    handleSelectTime,
    handleNavSelect,
  }
}
