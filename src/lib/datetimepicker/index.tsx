import { BottomSheetModal } from '@expo/ui/community/bottom-sheet'
import * as Haptics from 'expo-haptics'
import React, { memo, useMemo, useRef } from 'react'
import { Pressable, Text, View } from 'react-native'

import { useTheme } from '@/hooks/use-theme'

import { DateTimePickerContent } from './components'
import { usePickerState } from './hooks'
import { getActiveDate, getDisplayString } from './utils'

import type { DateTimePickerProps } from './utils'
import type { BottomSheetMethods } from '@expo/ui/community/bottom-sheet'

export type { DateTimePickerProps }

export const DateTimePicker = memo((props: DateTimePickerProps) => {
  const { value, onChange, mode = 'date', label, placeholder = 'Select date/time', showToday = true } = props
  const { colors, spacing, typography, layout } = useTheme()
  const sheetRef = useRef<BottomSheetMethods | null>(null)

  const activeDate = useMemo(() => getActiveDate(value), [value])
  const state = usePickerState(props, activeDate)
  const displayString = useMemo(() => getDisplayString(value, mode, placeholder), [value, mode, placeholder])

  const minYear = useMemo(() => props.minimumDate?.getFullYear(), [props.minimumDate])
  const maxYear = useMemo(
    () => props.maximumDate?.getFullYear() ?? new Date().getFullYear(),
    [props.maximumDate],
  )

  const triggerPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {})
    state.setViewMode(mode === 'time' ? 'time' : 'calendar')
    sheetRef.current?.present()
  }

  const handleTodayPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {})
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    state.setCurrentNavDate(today)
    if (mode === 'date') {
      onChange?.(today)
      sheetRef.current?.dismiss()
    }
  }

  const handleDonePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {})
    onChange?.(state.currentNavDate)
    sheetRef.current?.dismiss()
  }

  return (
    <>
      <View style={{ borderBottomWidth: 1, borderBottomColor: colors.border, paddingVertical: spacing.md }}>
        <Pressable onPress={triggerPress} style={[layout.rowAlign, layout.rowBetween]}>
          {label && <Text style={[typography.body, { color: colors.text }]}>{label}</Text>}
          <Text style={[typography.bodyLg, { color: value ? colors.text : colors.textMuted, textAlign: 'right' }]}>{displayString}</Text>
        </Pressable>
      </View>
      <BottomSheetModal ref={sheetRef} enableDynamicSizing enablePanDownToClose={false} backgroundStyle={{ backgroundColor: colors.card }}>
        <DateTimePickerContent
          mode={mode}
          showToday={showToday}
          state={state}
          minYear={minYear}
          maxYear={maxYear}
          onTodayPress={handleTodayPress}
          onDonePress={handleDonePress}
          onDismiss={() => sheetRef.current?.dismiss()}
        />
      </BottomSheetModal>
    </>
  )
})

DateTimePicker.displayName = 'DateTimePicker'
export default DateTimePicker
