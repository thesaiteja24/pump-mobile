import { BottomSheetModal, BottomSheetView } from '@expo/ui/community/bottom-sheet'
import { useEffect, useMemo, useState } from 'react'
import { View } from 'react-native'

import { Button } from '@/components/ui/button'
import { CustomText } from '@/components/ui/custom-text'
import { useCreateHabitReminderMutation, useUpdateHabitReminderMutation } from '@/hooks/queries/use-habits'
import { useTheme } from '@/hooks/use-theme'
import { Arise } from '@/lib/arise'
import DateTimePicker from '@/lib/datetimepicker'

import type { HabitReminder } from '@/types/habit'
import type { BottomSheetMethods } from '@expo/ui/community/bottom-sheet'

interface HabitReminderModalProps {
  ref?: React.Ref<BottomSheetMethods>
  habitId: string
  onClose: () => void
  onCreated?: (reminder: HabitReminder) => void
  onUpdated?: (reminder: HabitReminder) => void
  reminderToEdit?: HabitReminder
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
  const { spacing } = useTheme()

  return (
    <View style={{ flexDirection: 'row', gap: spacing.sm }}>
      {dayOptions.map((day) => {
        const selected = selectedDays.includes(day.value)
        return (
          <Button
            key={`${day.value}-${day.label}`}
            title={day.label}
            variant={selected ? 'primary' : 'secondary'}
            onPress={() => {
              const next = selected
                ? selectedDays.filter(value => value !== day.value)
                : [...selectedDays, day.value].sort((a, b) => a - b)
              onChange(next)
            }}
            style={{
              width: 36,
              height: 36,
              paddingHorizontal: 0,
              paddingVertical: 0,
            }}
          />
        )
      })}
    </View>
  )
}

// eslint-disable-next-line max-lines-per-function
export function HabitReminderModal({ ref, habitId, onClose, onCreated, onUpdated, reminderToEdit }: HabitReminderModalProps) {
  const { colorModes, spacing } = useTheme()
  const createReminder = useCreateHabitReminderMutation()
  const updateReminder = useUpdateHabitReminderMutation()

  const [time, setTime] = useState(reminderToEdit?.time || '08:00')
  const [daysOfWeek, setDaysOfWeek] = useState<number[]>(reminderToEdit?.daysOfWeek || [1, 2, 3, 4, 5])

  // Reset state when reminderToEdit changes
  useEffect(() => {
    // eslint-disable-next-line react/set-state-in-effect
    setTime(reminderToEdit?.time || '08:00')
    // eslint-disable-next-line react/set-state-in-effect
    setDaysOfWeek(reminderToEdit?.daysOfWeek || [1, 2, 3, 4, 5])
  }, [reminderToEdit])

  const timeDate = useMemo(() => {
    const [h, m] = time.split(':')
    const d = new Date()
    d.setHours(Number(h) || 8, Number(m) || 0, 0, 0)
    return d
  }, [time])

  const submit = () => {
    const normalizedTime = normalizeTime(time)
    if (!normalizedTime) {
      Arise.error({ heading: 'Use HH:mm time format', sound: true })
      return
    }

    if (daysOfWeek.length === 0) {
      Arise.error({ heading: 'Select at least one day', sound: true })
      return
    }

    if (reminderToEdit) {
      updateReminder.mutate(
        { habitId, reminderId: reminderToEdit.id, data: { time: normalizedTime, daysOfWeek } },
        {
          onSuccess: (reminder) => {
            Arise.success({ heading: 'Reminder updated', sound: true })
            onUpdated?.(reminder)
            onClose()
          },
          onError: () => Arise.error({ heading: 'Unable to update reminder', sound: true }),
        },
      )
    }
    else {
      createReminder.mutate(
        { habitId, data: { time: normalizedTime, daysOfWeek } },
        {
          onSuccess: (reminder) => {
            Arise.success({ heading: 'Reminder created', sound: true })
            onCreated?.(reminder)
            onClose()
          },
          onError: () => Arise.error({ heading: 'Unable to create reminder', sound: true }),
        },
      )
    }
  }

  const isPending = createReminder.isPending || updateReminder.isPending

  return (
    <BottomSheetModal ref={ref} enableDynamicSizing enablePanDownToClose={false} backgroundStyle={{ backgroundColor: colorModes.surface.primary }}>
      <BottomSheetView style={{ padding: spacing.lg, paddingBottom: spacing.xxxl, gap: spacing.xl }}>
        <View style={{ gap: spacing.xxs }}>
          <CustomText variant="displaySm">{reminderToEdit ? 'Edit Reminder' : 'Add Reminder'}</CustomText>
          <CustomText variant="bodySm" color="secondary">Pick a local time and days for this habit.</CustomText>
        </View>

        <View>
          <DateTimePicker
            label="Time"
            mode="time"
            value={timeDate}
            onChange={(d) => {
              if (d) {
                setTime(`${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`)
              }
            }}
          />
        </View>

        <View style={{ gap: spacing.sm }}>
          <CustomText variant="bodySmStrong" color="secondary">Days</CustomText>
          <DaySelector selectedDays={daysOfWeek} onChange={setDaysOfWeek} />
        </View>

        <View style={{ flexDirection: 'row', gap: spacing.md }}>
          <Button title="Cancel" variant="outline" size="sm" onPress={onClose} />
          <Button title={reminderToEdit ? 'Save' : 'Create'} loading={isPending} size="sm" style={{ flex: 1 }} onPress={submit} />
        </View>
      </BottomSheetView>
    </BottomSheetModal>
  )
}
