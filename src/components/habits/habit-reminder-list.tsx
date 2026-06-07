import { LucideTrash } from 'lucide-react-native'
import { View } from 'react-native'

import { Button } from '@/components/ui/button'
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
  const { colorModes, spacing } = useTheme()
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

      <Button
        disabled={isPending}
        onPress={toggle}
        title={reminder.isEnabled ? 'On' : 'Off'}
        variant={reminder.isEnabled ? 'primary' : 'secondary'}
        size="xs"
        style={{ opacity: isPending ? 0.5 : 1 }}
      />

      <Button
        disabled={isPending}
        onPress={remove}
        variant="secondary"
        leftIcon={<LucideTrash size={18} color={colorModes.foreground.danger} />}
        style={{
          width: 36,
          height: 36,
          paddingHorizontal: 0,
          paddingVertical: 0,
          opacity: isPending ? 0.5 : 1,
        }}
      />
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
      {reminders.length === 0
        ? <CustomText variant="bodySm" color="secondary">No reminders found, create a new one.</CustomText>
        : reminders.map(reminder => (
            <ReminderRow key={reminder.id} reminder={reminder} onChanged={onChanged} onDeleted={onDeleted} />
          ))}
    </Card>
  )
}
