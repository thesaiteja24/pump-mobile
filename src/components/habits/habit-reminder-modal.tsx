import { BottomSheetModal, BottomSheetTextInput, BottomSheetView } from '@expo/ui/community/bottom-sheet'
import { useState } from 'react'
import { Pressable, View } from 'react-native'

import { Button } from '@/components/ui/button'
import { CustomText } from '@/components/ui/custom-text'
import { useCreateHabitReminderMutation } from '@/hooks/queries/use-habits'
import { useTheme } from '@/hooks/use-theme'
import { Arise } from '@/lib/arise'

import type { HabitReminder } from '@/types/habit'
import type { BottomSheetMethods } from '@expo/ui/community/bottom-sheet'

interface HabitReminderModalProps {
  ref?: React.Ref<BottomSheetMethods>
  habitId: string
  onClose: () => void
  onCreated: (reminder: HabitReminder) => void
}

const dayOptions = [
  { value: 0, label: 'S' },
  { value: 1, label: 'M' },
  { value: 2, label: 'T' },
  { value: 3, label: 'W' },
  { value: 4, label: 'T' },
  { value: 5, label: 'F' },
  { value: 6, label: 'S' },
]

function normalizeTime(value: string) {
  const match = /^(\d{1,2}):(\d{2})$/.exec(value.trim())
  if (!match) {
    return null
  }

  const hour = Number(match[1])
  const minute = Number(match[2])
  if (hour > 23 || minute > 59) {
    return null
  }

  return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
}

function DaySelector({ selectedDays, onChange }: { selectedDays: number[], onChange: (days: number[]) => void }) {
  const { colorModes, radius, spacing } = useTheme()

  return (
    <View style={{ flexDirection: 'row', gap: spacing.sm }}>
      {dayOptions.map((day) => {
        const selected = selectedDays.includes(day.value)
        return (
          <Pressable
            key={`${day.value}-${day.label}`}
            onPress={() => {
              const next = selected
                ? selectedDays.filter(value => value !== day.value)
                : [...selectedDays, day.value].sort((a, b) => a - b)
              onChange(next)
            }}
            style={{
              width: 36,
              height: 36,
              borderRadius: radius.full,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: selected ? colorModes.background.inverse : colorModes.surface.secondary,
            }}
          >
            <CustomText variant="caption" color={selected ? 'inverse' : 'secondary'}>{day.label}</CustomText>
          </Pressable>
        )
      })}
    </View>
  )
}

export function HabitReminderModal({ ref, habitId, onClose, onCreated }: HabitReminderModalProps) {
  const { colorModes, radius, spacing, typography } = useTheme()
  const createReminder = useCreateHabitReminderMutation()
  const [time, setTime] = useState('08:00')
  const [daysOfWeek, setDaysOfWeek] = useState([1, 2, 3, 4, 5])

  const submit = () => {
    const normalizedTime = normalizeTime(time)
    if (!normalizedTime) {
      Arise.error({ heading: 'Use HH:mm time format' })
      return
    }

    if (daysOfWeek.length === 0) {
      Arise.error({ heading: 'Select at least one day' })
      return
    }

    createReminder.mutate(
      { habitId, data: { time: normalizedTime, daysOfWeek } },
      {
        onSuccess: (reminder) => {
          Arise.success('Reminder created')
          onCreated(reminder)
          onClose()
        },
        onError: () => Arise.error({ heading: 'Unable to create reminder' }),
      },
    )
  }

  return (
    <BottomSheetModal ref={ref} enableDynamicSizing enablePanDownToClose={false} backgroundStyle={{ backgroundColor: colorModes.surface.primary }}>
      <BottomSheetView style={{ padding: spacing.lg, paddingBottom: spacing.xxxl, gap: spacing.xl }}>
        <View style={{ gap: spacing.xxs }}>
          <CustomText variant="displaySm">Add Reminder</CustomText>
          <CustomText variant="bodySm" color="secondary">Pick a local time and days for this habit.</CustomText>
        </View>

        <View style={{ gap: spacing.sm }}>
          <CustomText variant="bodySmStrong" color="secondary">Time</CustomText>
          <BottomSheetTextInput
            value={time}
            onChangeText={setTime}
            placeholder="08:00"
            placeholderTextColor={colorModes.text.muted}
            keyboardType="numbers-and-punctuation"
            style={[
              typography.body,
              {
                height: 48,
                borderRadius: radius.md,
                borderWidth: 1,
                borderColor: colorModes.border.primary,
                backgroundColor: colorModes.surface.secondary,
                color: colorModes.text.primary,
                paddingHorizontal: spacing.md,
              },
            ]}
          />
        </View>

        <View style={{ gap: spacing.sm }}>
          <CustomText variant="bodySmStrong" color="secondary">Days</CustomText>
          <DaySelector selectedDays={daysOfWeek} onChange={setDaysOfWeek} />
        </View>

        <View style={{ flexDirection: 'row', gap: spacing.md }}>
          <Button title="Cancel" variant="outline" size="sm" onPress={onClose} />
          <Button title="Create" loading={createReminder.isPending} size="sm" style={{ flex: 1 }} onPress={submit} />
        </View>
      </BottomSheetView>
    </BottomSheetModal>
  )
}
