import { Ionicons } from '@expo/vector-icons'
import { Pressable, View } from 'react-native'

import { Card } from '@/components/ui/card'
import { CustomText } from '@/components/ui/custom-text'
import { useDeleteHabitReminderMutation, useUpdateHabitReminderMutation } from '@/hooks/queries/use-habits'
import { useTheme } from '@/hooks/use-theme'
import { Arise } from '@/lib/arise'

import type { HabitReminder } from '@/types/habit'

const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

function formatDays(days: number[]) {
  if (days.length === 7) {
    return 'Every day'
  }

  return days.map(day => dayLabels[day]).join(', ')
}

function ReminderRow({
  reminder,
  onChanged,
  onDeleted,
}: {
  reminder: HabitReminder
  onChanged: (reminder: HabitReminder) => void
  onDeleted: (reminderId: string) => void
}) {
  const { colorModes, radius, spacing } = useTheme()
  const updateReminder = useUpdateHabitReminderMutation()
  const deleteReminder = useDeleteHabitReminderMutation()
  const isPending = updateReminder.isPending || deleteReminder.isPending

  const toggle = () => {
    updateReminder.mutate(
      {
        habitId: reminder.habitId,
        reminderId: reminder.id,
        data: { isEnabled: !reminder.isEnabled },
      },
      {
        onSuccess: onChanged,
        onError: () => Arise.error({ heading: 'Unable to update reminder', sound: true }),
      },
    )
  }

  const remove = () => {
    deleteReminder.mutate(
      { habitId: reminder.habitId, reminderId: reminder.id },
      {
        onSuccess: () => onDeleted(reminder.id),
        onError: () => Arise.error({ heading: 'Unable to remove reminder', sound: true }),
      },
    )
  }

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
      <View style={{ flex: 1 }}>
        <CustomText variant="bodyStrong">{reminder.time}</CustomText>
        <CustomText variant="caption" color="secondary">{formatDays(reminder.daysOfWeek)}</CustomText>
      </View>

      <Pressable
        disabled={isPending}
        onPress={toggle}
        style={{
          borderRadius: radius.full,
          backgroundColor: reminder.isEnabled ? colorModes.background.inverse : colorModes.surface.secondary,
          paddingHorizontal: spacing.md,
          paddingVertical: spacing.sm,
          opacity: isPending ? 0.5 : 1,
        }}
      >
        <CustomText variant="caption" color={reminder.isEnabled ? 'inverse' : 'secondary'}>
          {reminder.isEnabled ? 'On' : 'Off'}
        </CustomText>
      </Pressable>

      <Pressable
        disabled={isPending}
        onPress={remove}
        style={{
          width: 36,
          height: 36,
          borderRadius: radius.full,
          backgroundColor: colorModes.surface.secondary,
          alignItems: 'center',
          justifyContent: 'center',
          opacity: isPending ? 0.5 : 1,
        }}
      >
        <Ionicons name="trash-outline" size={18} color={colorModes.foreground.danger} />
      </Pressable>
    </View>
  )
}

export function HabitReminderList({
  reminders,
  onChanged,
  onDeleted,
}: {
  reminders: HabitReminder[]
  onChanged: (reminder: HabitReminder) => void
  onDeleted: (reminderId: string) => void
}) {
  const { spacing } = useTheme()

  return (
    <Card style={{ gap: spacing.lg }}>
      <View style={{ gap: spacing.xxs }}>
        <CustomText variant="bodyStrong">Reminders</CustomText>
        <CustomText variant="caption" color="muted">
          Existing reminders are not returned by the current API yet. New reminders appear here after creation.
        </CustomText>
      </View>

      {reminders.length === 0
        ? <CustomText variant="bodySm" color="secondary">No reminders added in this session.</CustomText>
        : reminders.map(reminder => (
            <ReminderRow key={reminder.id} reminder={reminder} onChanged={onChanged} onDeleted={onDeleted} />
          ))}
    </Card>
  )
}
