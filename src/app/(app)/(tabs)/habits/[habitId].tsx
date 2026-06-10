import { useQueryClient } from '@tanstack/react-query'
import { router, useLocalSearchParams } from 'expo-router'
import { LucideCheckCircle, LucideChevronLeft, LucidePenSquare } from 'lucide-react-native'
import { useEffect, useRef, useState } from 'react'
import { ActivityIndicator, View } from 'react-native'

import { queryKeys } from '@/api/query-keys'
import { HabitReminderList } from '@/components/habits/habit-reminder-list'
import { HabitReminderModal } from '@/components/habits/habit-reminder-modal'
import { HabitErrorState, HabitLoadingState } from '@/components/habits/habit-state'
import { HabitStatsCard } from '@/components/habits/habit-stats-card'
import { BaseScreen } from '@/components/ui/base-screen'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { CustomText } from '@/components/ui/custom-text'
import { Menu } from '@/components/ui/menu'
import { useArchiveHabitMutation, useHabitQuery, useHabitRemindersQuery, useHabitStatsQuery } from '@/hooks/queries/use-habits'
import { useTheme } from '@/hooks/use-theme'
import { Arise } from '@/lib/arise'

import type { Habit, HabitReminder } from '@/types/habit'
import type { BottomSheetMethods } from '@expo/ui/community/bottom-sheet'

const categoryLabels = {
  training: 'Training',
  nutrition: 'Nutrition',
  recovery: 'Recovery',
  bodyMetrics: 'Body Metrics',
  lifestyle: 'Lifestyle',
} as const

function formatTarget(targetValue: number | null, unit: string | null) {
  if (targetValue === null) {
    return 'Complete once'
  }

  return `${targetValue}${unit ? ` ${unit}` : ''}`
}

function HabitHeaderCard({ habit }: { habit: Habit }) {
  const { colorModes, spacing, radius } = useTheme()

  return (
    <Card style={{ gap: spacing.lg }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: spacing.md }}>
        <View style={{ flex: 1, gap: spacing.xxs }}>
          <CustomText variant="displayMd">{habit.title}</CustomText>
          <CustomText variant="bodySm" color="secondary">
            {categoryLabels[habit.category]}
            {' · '}
            {habit.source === 'manual' ? 'Manual' : 'Automatic'}
          </CustomText>
        </View>
        <View
          style={{
            width: 44,
            height: 44,
            borderRadius: radius.full,
            backgroundColor: colorModes.surface.secondary,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <LucideCheckCircle size={24} color={colorModes.text.primary} />
        </View>
      </View>

      {habit.description && <CustomText variant="bodySm" color="secondary">{habit.description}</CustomText>}

      <View style={{ gap: spacing.xxs }}>
        <CustomText variant="caption" color="muted">Target</CustomText>
        <CustomText variant="bodyStrong">
          {formatTarget(habit.targetValue, habit.unit)}
          {' '}
          per
          {' '}
          {habit.targetPeriod}
        </CustomText>
      </View>
    </Card>
  )
}

function ArchiveHabitButton({ habit }: { habit: Habit }) {
  const archiveHabit = useArchiveHabitMutation()

  if (habit.source !== 'manual') {
    return null
  }

  const handleArchive = () => {
    archiveHabit.mutate(habit.id, {
      onSuccess: () => {
        Arise.success({ heading: 'Habit archived', sound: true })
        router.back()
      },
      onError: () => Arise.error({ heading: 'Unable to archive habit', sound: true }),
    })
  }

  return (
    <Button
      title="Archive Habit"
      variant="danger"
      loading={archiveHabit.isPending}
      onPress={handleArchive}
      style={{ width: '100%' }}
    />
  )
}

// eslint-disable-next-line max-lines-per-function
export default function HabitDetailScreen() {
  const { habitId } = useLocalSearchParams<{ habitId: string }>()
  const { colorModes } = useTheme()
  const queryClient = useQueryClient()
  const reminderModalRef = useRef<BottomSheetMethods | null>(null)
  const [sessionReminders, setSessionReminders] = useState<HabitReminder[]>([])
  const [reminderToEdit, setReminderToEdit] = useState<HabitReminder | undefined>(undefined)
  const habitQuery = useHabitQuery(habitId)
  const statsQuery = useHabitStatsQuery(habitId)
  const remindersQuery = useHabitRemindersQuery(habitId)
  const habit = habitQuery.data

  const handleRefresh = async () => {
    await queryClient.invalidateQueries({ queryKey: queryKeys.habits.detail(habitId) })
    await queryClient.invalidateQueries({ queryKey: queryKeys.habits.stats(habitId) })
    await queryClient.invalidateQueries({ queryKey: queryKeys.habits.reminders(habitId) })
  }

  useEffect(() => {
    if (remindersQuery.data) {
      // eslint-disable-next-line react/set-state-in-effect
      setSessionReminders(remindersQuery.data)
    }
  }, [remindersQuery.data])

  const closeReminderModal = () => {
    reminderModalRef.current?.dismiss()
    setTimeout(setReminderToEdit, 300, undefined) // Clear state after modal animation
  }

  const handleReminderChanged = (reminder: HabitReminder) => {
    setSessionReminders(current => current.map(item => item.id === reminder.id ? reminder : item))
  }
  const handleReminderDeleted = (reminderId: string) => {
    setSessionReminders(current => current.filter(item => item.id !== reminderId))
  }
  const handleReminderCreated = (reminder: HabitReminder) => {
    setSessionReminders(current => [...current.filter(item => item.id !== reminder.id), reminder])
  }

  const handleEditReminder = (reminder: HabitReminder) => {
    setReminderToEdit(reminder)
    reminderModalRef.current?.present()
  }

  const handleAddReminder = () => {
    setReminderToEdit(undefined)
    reminderModalRef.current?.present()
  }

  return (
    <BaseScreen
      title="Habit"
      scrollable
      onRefresh={handleRefresh}
      refreshing={habitQuery.isRefetching || statsQuery.isRefetching || remindersQuery.isRefetching}
      headerLeft={() => (
        <Menu onPressTrigger={() => router.back()} roundedOutline>
          <LucideChevronLeft size={24} color={colorModes.text.primary} />
        </Menu>
      )}
      headerRight={() => habit?.source === 'manual'
        ? (
            <Menu onPressTrigger={() => router.push(`/(app)/habits/edit/${habit.id}`)} roundedOutline>
              <LucidePenSquare size={22} color={colorModes.text.primary} />
            </Menu>
          )
        : null}
    >
      {habitQuery.isLoading && <HabitLoadingState />}

      {habitQuery.isError && (
        <HabitErrorState
          title="Unable to load habit"
          message="Go back or try loading this habit again."
          onAction={() => habitQuery.refetch()}
        />
      )}

      {habit && (
        <>
          <HabitHeaderCard habit={habit} />
          {statsQuery.data && <HabitStatsCard stats={statsQuery.data} />}
          {statsQuery.isLoading && (
            <Card>
              <ActivityIndicator color={colorModes.text.primary} />
            </Card>
          )}
          <HabitReminderList reminders={sessionReminders} onChanged={handleReminderChanged} onDeleted={handleReminderDeleted} onEdit={handleEditReminder} />
          <Button title="Add Reminder" variant="ghost" onPress={handleAddReminder} />
          <ArchiveHabitButton habit={habit} />
          <HabitReminderModal
            ref={reminderModalRef}
            habitId={habit.id}
            onClose={closeReminderModal}
            onCreated={handleReminderCreated}
            onUpdated={handleReminderChanged}
            reminderToEdit={reminderToEdit}
          />
        </>
      )}
    </BaseScreen>
  )
}
