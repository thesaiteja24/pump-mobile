/* eslint-disable max-lines */
import { BottomSheetScrollView, BottomSheetView } from '@expo/ui/community/bottom-sheet'
import * as Localization from 'expo-localization'
import { LucideChevronDown, LucideChevronLeft, LucideChevronRight } from 'lucide-react-native'
import React, { memo, useCallback, useMemo } from 'react'
import { Pressable, Text, View } from 'react-native'

import { Button } from '@/components/ui/button'
import { useTheme } from '@/hooks/use-theme'

import { DAYS, getCalendarCells, getYears, MONTHS } from './utils'

import type { usePickerState } from './hooks'
import type { CalendarCell } from './utils'

// ─── TimeColumn ───────────────────────────────────────────────────────────────

const TimeColumn = memo(({ title, values, selectedValue, onSelect }: {
  title: string
  values: number[] | string[]
  selectedValue: number | string
  onSelect: (val: string | number) => void
}) => {
  const { colors, spacing, radius, typography, layout } = useTheme()

  const scrollRef = React.useRef<React.ElementRef<typeof BottomSheetScrollView>>(null)
  const selectedIndex = Math.max(0, values.indexOf(selectedValue as never))
  const safeInitialIndex = Math.max(0, Math.min(selectedIndex, values.length - 4))

  const handleLayout = useCallback(() => {
    if (scrollRef.current && safeInitialIndex > 0) {
      scrollRef.current.scrollTo({
        y: safeInitialIndex * 40,
        animated: false,
      })
    }
  }, [safeInitialIndex])

  return (
    <View style={[layout.flex1, { height: 180 }]}>
      <Text style={[typography.caption, { color: colors.textSecondary, textAlign: 'center', marginBottom: spacing.xxs }]}>{title}</Text>
      <BottomSheetScrollView ref={scrollRef} onLayout={handleLayout} showsVerticalScrollIndicator={false}>
        {values.map((val) => {
          const isSelected = val === selectedValue
          return (
            <Pressable
              key={val}
              onPress={() => onSelect(val)}
              style={({ pressed }) => [
                { height: 40, justifyContent: 'center', alignItems: 'center', borderRadius: radius.md },
                isSelected ? { backgroundColor: colors.text } : pressed && { backgroundColor: colors.input },
              ]}
            >
              <Text style={[typography.bodyStrong, { color: isSelected ? colors.card : colors.text }]}>
                {typeof val === 'number' ? val.toString().padStart(2, '0') : val}
              </Text>
            </Pressable>
          )
        })}
      </BottomSheetScrollView>
    </View>
  )
})
TimeColumn.displayName = 'TimeColumn'

// ─── TimeSelector ─────────────────────────────────────────────────────────────

const TimeSelector = memo(({ currentNavDate, onSelectTime }: {
  currentNavDate: Date
  onSelectTime: (h: number, m: number) => void
}) => {
  const { spacing, layout } = useTheme()
  const hours = currentNavDate.getHours()
  const minutes = currentNavDate.getMinutes()

  const use24HourClock = Localization.getCalendars()[0]?.uses24hourClock ?? false

  const isPM = hours >= 12
  const dHours = use24HourClock ? hours : (hours % 12 === 0 ? 12 : hours % 12)
  const dMinutes = Math.floor(minutes / 5) * 5

  const handleHourSelect = useCallback((h: string | number) => {
    const nextH = Number(h)
    if (use24HourClock) {
      onSelectTime(nextH, minutes)
    }
    else {
      const finalH = isPM ? (nextH === 12 ? 12 : nextH + 12) : (nextH === 12 ? 0 : nextH)
      onSelectTime(finalH, minutes)
    }
  }, [isPM, minutes, onSelectTime, use24HourClock])

  const handleMinuteSelect = useCallback((m: string | number) => {
    onSelectTime(hours, Number(m))
  }, [hours, onSelectTime])

  const handlePeriodSelect = useCallback((p: string | number) => {
    const nextPM = p === 'PM'
    const currentH = hours % 12
    const finalH = nextPM ? (currentH === 0 ? 12 : currentH + 12) : (currentH === 0 ? 0 : currentH)
    onSelectTime(finalH, minutes)
  }, [hours, minutes, onSelectTime])

  return (
    <View style={[layout.row, { gap: spacing.md, paddingVertical: spacing.sm }]}>
      <TimeColumn
        title="Hours"
        values={Array.from({ length: use24HourClock ? 24 : 12 }, (_, i) => use24HourClock ? i : i + 1)}
        selectedValue={dHours}
        onSelect={handleHourSelect}
      />
      <TimeColumn
        title="Minutes"
        values={Array.from({ length: 12 }, (_, i) => i * 5)}
        selectedValue={dMinutes}
        onSelect={handleMinuteSelect}
      />
      {!use24HourClock && (
        <TimeColumn
          title="Period"
          values={['AM', 'PM']}
          selectedValue={isPM ? 'PM' : 'AM'}
          onSelect={handlePeriodSelect}
        />
      )}
    </View>
  )
})
TimeSelector.displayName = 'TimeSelector'

// ─── CalendarGrid (fixed 6 rows, overflow days from adjacent months) ──────────

const CELL_SIZE = 36

const CalendarGrid = memo(({ cells, selectedDate, isDateDisabled, onSelectCell }: {
  cells: CalendarCell[] // always 42 items
  selectedDate: Date // currentNavDate — updates immediately on tap
  isDateDisabled: (d: Date) => boolean
  onSelectCell: (cell: CalendarCell) => void
}) => {
  const { colors, radius, typography, layout } = useTheme()

  return (
    // Fixed height = 6 rows × CELL_SIZE — never changes, no layout reflow
    <View style={[layout.row, { flexWrap: 'wrap', height: 6 * CELL_SIZE }]}>
      {cells.map((cell, idx) => {
        const cellDate = new Date(cell.year, cell.month, cell.day)
        const disabled = isDateDisabled(cellDate)
        const isSelected = (
          selectedDate.getDate() === cell.day
          && selectedDate.getMonth() === cell.month
          && selectedDate.getFullYear() === cell.year
        )
        return (
          <Pressable
            // eslint-disable-next-line react/no-array-index-key
            key={idx}
            disabled={disabled}
            onPress={() => onSelectCell(cell)}
            style={({ pressed }) => [
              {
                width: '14.28%',
                height: CELL_SIZE,
                justifyContent: 'center',
                alignItems: 'center',
                borderRadius: radius.full,
              },
              isSelected && { backgroundColor: colors.text },
              pressed && !isSelected && { backgroundColor: colors.input },
              disabled && { opacity: 0.3 },
            ]}
          >
            <Text
              style={[
                typography.bodyStrong,
                {
                  color: isSelected
                    ? colors.card
                    : cell.isCurrentMonth
                      ? colors.text
                      : colors.textMuted, // muted for overflow days
                },
              ]}
            >
              {cell.day}
            </Text>
          </Pressable>
        )
      })}
    </View>
  )
})
CalendarGrid.displayName = 'CalendarGrid'

// ─── MonthYearSelector (auto-scrolls to selected item) ────────────────────────

const SELECTOR_ITEM_HEIGHT = 48

const MonthYearSelector = memo(({ currentNavDate, type, onSelect, minYear, maxYear }: {
  currentNavDate: Date
  type: 'month' | 'year'
  onSelect: (val: number, type: 'month' | 'year') => void
  minYear?: number
  maxYear?: number
}) => {
  const { colors, spacing, radius, typography } = useTheme()
  const list = type === 'month' ? MONTHS : getYears(minYear, maxYear)

  const selectedIndex = useMemo(() => {
    if (type === 'month')
      return currentNavDate.getMonth()
    const years = list as number[]
    return Math.max(0, years.indexOf(currentNavDate.getFullYear()))
  }, [type, currentNavDate, list])

  const renderItem = useCallback(({ item, index }: { item: string | number, index: number }) => {
    const isSelected = type === 'month'
      ? index === currentNavDate.getMonth()
      : item === currentNavDate.getFullYear()
    const pressValue = type === 'month' ? index : (item as number)
    return (
      <Pressable
        onPress={() => onSelect(pressValue, type)}
        style={({ pressed }) => [
          { height: SELECTOR_ITEM_HEIGHT, justifyContent: 'center', alignItems: 'center', borderRadius: radius.md, marginHorizontal: spacing.sm },
          isSelected ? { backgroundColor: colors.text } : pressed && { backgroundColor: colors.input },
        ]}
      >
        <Text style={[typography.bodyStrong, { color: isSelected ? colors.card : colors.text }]}>{item}</Text>
      </Pressable>
    )
  }, [type, currentNavDate, onSelect, colors, radius, spacing, typography])

  // Clamp initialScrollIndex so we never scroll past the last visible item
  const safeInitialIndex = Math.max(0, Math.min(selectedIndex, list.length - 4))

  // Scroll to selected item after layout/mount using standard ScrollView ref
  const scrollRef = React.useRef<React.ElementRef<typeof BottomSheetScrollView>>(null)
  const handleLayout = useCallback(() => {
    if (scrollRef.current && safeInitialIndex > 0) {
      scrollRef.current.scrollTo({
        y: safeInitialIndex * SELECTOR_ITEM_HEIGHT,
        animated: false,
      })
    }
  }, [safeInitialIndex])

  return (
    <View style={{ height: 220 }}>
      <BottomSheetScrollView
        ref={scrollRef}
        onLayout={handleLayout}
        showsVerticalScrollIndicator={false}
      >
        {(list as (string | number)[]).map(item => (
          <React.Fragment key={`${type}-${item}`}>
            {renderItem({ item, index: type === 'month' ? MONTHS.indexOf(item as string) : (list as number[]).indexOf(item as number) })}
          </React.Fragment>
        ))}
      </BottomSheetScrollView>
    </View>
  )
})
MonthYearSelector.displayName = 'MonthYearSelector'

// ─── CalendarHeader ───────────────────────────────────────────────────────────

const CalendarHeader = memo(({ state }: { state: ReturnType<typeof usePickerState> }) => {
  const { colors, spacing, radius, typography, layout } = useTheme()

  const pillStyle = {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.input,
  }

  return (
    <View style={[layout.rowAlign, layout.rowBetween, { marginBottom: spacing.md }]}>
      <Pressable
        onPress={() => state.changeMonth(-1)}
        style={({ pressed }) => [{ padding: spacing.sm, borderRadius: radius.full }, pressed && { backgroundColor: colors.input }]}
        hitSlop={12}
      >
        <LucideChevronLeft size={20} color={colors.text} />
      </Pressable>

      <View style={[layout.rowAlign, { gap: spacing.sm }]}>
        {/* Month pill */}
        <Pressable onPress={() => state.setViewMode('month')} style={pillStyle}>
          <Text style={[typography.bodyStrong, { color: colors.text }]}>
            {MONTHS[state.currentNavDate.getMonth()]}
          </Text>
          <LucideChevronDown size={13} color={colors.textSecondary} />
        </Pressable>

        {/* Year pill */}
        <Pressable onPress={() => state.setViewMode('year')} style={pillStyle}>
          <Text style={[typography.bodyStrong, { color: colors.text }]}>
            {state.currentNavDate.getFullYear()}
          </Text>
          <LucideChevronDown size={13} color={colors.textSecondary} />
        </Pressable>
      </View>

      <Pressable
        onPress={() => state.changeMonth(1)}
        style={({ pressed }) => [{ padding: spacing.sm, borderRadius: radius.full }, pressed && { backgroundColor: colors.input }]}
        hitSlop={12}
      >
        <LucideChevronRight size={20} color={colors.text} />
      </Pressable>
    </View>
  )
})
CalendarHeader.displayName = 'CalendarHeader'

// ─── CalendarGridHeader ───────────────────────────────────────────────────────

const CalendarGridHeader = memo(() => {
  const { colors, spacing, typography, layout } = useTheme()
  return (
    <View style={[layout.row, { marginBottom: spacing.sm }]}>
      {DAYS.map(d => (
        <View key={d} style={[layout.flex1, layout.center]}>
          <Text style={[typography.caption, { color: colors.textSecondary, fontWeight: 'bold' }]}>{d}</Text>
        </View>
      ))}
    </View>
  )
})
CalendarGridHeader.displayName = 'CalendarGridHeader'

// ─── PickerBody ───────────────────────────────────────────────────────────────

const PickerBody = memo(({
  state,
  minYear,
  maxYear,
}: {
  state: ReturnType<typeof usePickerState>
  minYear?: number
  maxYear?: number
}) => {
  // Always 42 cells — computed from the current nav month
  const cells = useMemo(() => getCalendarCells(state.currentNavDate), [state.currentNavDate])

  if (state.viewMode === 'month') {
    return (
      <MonthYearSelector
        currentNavDate={state.currentNavDate}
        type="month"
        onSelect={state.handleNavSelect}
        minYear={minYear}
        maxYear={maxYear}
      />
    )
  }
  if (state.viewMode === 'year') {
    return (
      <MonthYearSelector
        currentNavDate={state.currentNavDate}
        type="year"
        onSelect={state.handleNavSelect}
        minYear={minYear}
        maxYear={maxYear}
      />
    )
  }
  if (state.viewMode === 'calendar') {
    return (
      <View>
        <CalendarHeader state={state} />
        <CalendarGridHeader />
        <CalendarGrid
          cells={cells}
          selectedDate={state.currentNavDate}
          isDateDisabled={state.isDateDisabled}
          onSelectCell={state.handleSelectCell}
        />
      </View>
    )
  }
  if (state.viewMode === 'time') {
    return <TimeSelector currentNavDate={state.currentNavDate} onSelectTime={state.handleSelectTime} />
  }
  return null
})
PickerBody.displayName = 'PickerBody'

// ─── FooterButtons ────────────────────────────────────────────────────────────

function FooterLeft({ isSubView, showTodayBtn, onTodayPress, onDismiss, onBack }: {
  isSubView: boolean
  showTodayBtn: boolean
  onTodayPress: () => void
  onDismiss: () => void
  onBack: () => void
}) {
  const { layout } = useTheme()
  if (isSubView) {
    return <Button title="← Back" variant="outline" size="sm" style={layout.flex1} onPress={onBack} />
  }
  return (
    <>
      {showTodayBtn && <Button title="Today" variant="outline" size="sm" onPress={onTodayPress} />}
      <Button title="Cancel" variant="outline" size="sm" style={layout.flex1} onPress={onDismiss} />
    </>
  )
}

function FooterRight({ isSubView, isDatetimeNext, showDoneBtn, onDonePress, onNext }: {
  isSubView: boolean
  isDatetimeNext: boolean
  showDoneBtn: boolean
  onDonePress: () => void
  onNext: () => void
}) {
  const { layout } = useTheme()
  if (isSubView)
    return null
  if (isDatetimeNext)
    return <Button title="Next →" style={layout.flex1} size="sm" onPress={onNext} />
  if (showDoneBtn)
    return <Button title="Done" style={layout.flex1} size="sm" onPress={onDonePress} />
  return null
}

const FooterButtons = memo(({
  mode,
  showToday,
  state,
  onTodayPress,
  onDonePress,
  onDismiss,
}: {
  mode: 'date' | 'time' | 'datetime'
  showToday: boolean
  state: ReturnType<typeof usePickerState>
  onTodayPress: () => void
  onDonePress: () => void
  onDismiss: () => void
}) => {
  const { layout, spacing } = useTheme()
  const isSubView = state.viewMode === 'month' || state.viewMode === 'year'
  const showTodayBtn = showToday && state.viewMode === 'calendar'
  const isDatetimeNext = state.viewMode === 'calendar' && mode === 'datetime'
  const showDoneBtn = state.viewMode === 'calendar' || mode === 'time' || state.viewMode === 'time'

  return (
    <View style={[layout.row, { gap: spacing.md, marginTop: spacing.lg }]}>
      <FooterLeft
        isSubView={isSubView}
        showTodayBtn={showTodayBtn}
        onTodayPress={onTodayPress}
        onDismiss={onDismiss}
        onBack={() => state.setViewMode('calendar')}
      />
      <FooterRight
        isSubView={isSubView}
        isDatetimeNext={isDatetimeNext}
        showDoneBtn={showDoneBtn}
        onDonePress={onDonePress}
        onNext={() => state.setViewMode('time')}
      />
    </View>
  )
})
FooterButtons.displayName = 'FooterButtons'

// ─── DateTimePickerContent (public export) ────────────────────────────────────

interface SheetContentProps {
  mode: 'date' | 'time' | 'datetime'
  showToday: boolean
  state: ReturnType<typeof usePickerState>
  minYear?: number
  maxYear?: number
  onTodayPress: () => void
  onDonePress: () => void
  onDismiss: () => void
}

export const DateTimePickerContent = memo(({
  mode,
  showToday,
  state,
  minYear,
  maxYear,
  onTodayPress,
  onDonePress,
  onDismiss,
}: SheetContentProps) => {
  const { colors, spacing, typography } = useTheme()

  const isSubView = state.viewMode === 'month' || state.viewMode === 'year'
  const sheetTitle = isSubView
    ? (state.viewMode === 'month' ? 'Select Month' : 'Select Year')
    : (mode === 'time' || state.viewMode === 'time' ? 'Select Time' : 'Select Date')

  return (
    <BottomSheetView style={{ padding: spacing.lg }}>
      <Text style={[typography.displaySm, { color: colors.text, marginBottom: spacing.md }]}>{sheetTitle}</Text>
      <PickerBody state={state} minYear={minYear} maxYear={maxYear} />
      <FooterButtons
        mode={mode}
        showToday={showToday}
        state={state}
        onTodayPress={onTodayPress}
        onDonePress={onDonePress}
        onDismiss={onDismiss}
      />
    </BottomSheetView>
  )
})
DateTimePickerContent.displayName = 'DateTimePickerContent'
