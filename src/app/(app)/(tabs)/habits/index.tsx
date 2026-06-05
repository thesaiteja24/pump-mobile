import { Ionicons } from '@expo/vector-icons'
import { router } from 'expo-router'
import { Pressable, View } from 'react-native'

import { HabitLogControl } from '@/components/habits/habit-log-control'
import { HabitEmptyState, HabitErrorState, HabitLoadingState } from '@/components/habits/habit-state'
import { BaseScreen } from '@/components/ui/base-screen'
import { Card } from '@/components/ui/card'
import { CustomText } from '@/components/ui/custom-text'
import { Menu } from '@/components/ui/menu'
import { useTodayHabitsQuery } from '@/hooks/queries/use-habits'
import { useTheme } from '@/hooks/use-theme'

import type { HabitCategory, HabitTodayItem, HabitTrackingType } from '@/types/habit'

const categoryLabels: Record<HabitCategory, string> = {
  training: 'Training',
  nutrition: 'Nutrition',
  recovery: 'Recovery',
  bodyMetrics: 'Body Metrics',
  lifestyle: 'Lifestyle',
}

const trackingLabels: Record<HabitTrackingType, string> = {
  binary: 'Check-in',
  quantity: 'Quantity',
  duration: 'Duration',
  count: 'Count',
}

function formatProgress(habit: HabitTodayItem) {
  if (habit.trackingType === 'binary') {
    return habit.completed ? 'Done today' : 'Not logged'
  }

  const value = habit.todayValue ?? 0
  const target = habit.targetValue ?? 0
  const unit = habit.unit ? ` ${habit.unit}` : ''
  return `${value}${unit} / ${target}${unit}`
}

function HabitTodayCard({
  habit,
  onEdit,
  onOpen,
}: {
  habit: HabitTodayItem
  onEdit: (habitId: string) => void
  onOpen: (habitId: string) => void
}) {
  const { colorModes, spacing, radius } = useTheme()

  return (
    <Card style={{ gap: spacing.md }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: spacing.md }}>
        <View style={{ flex: 1, gap: spacing.xxs }}>
          <CustomText variant="bodyStrong">{habit.title}</CustomText>
          <CustomText variant="caption" color="secondary">
            {categoryLabels[habit.category]}
            {' · '}
            {trackingLabels[habit.trackingType]}
          </CustomText>
        </View>
        <View style={{ flexDirection: 'row', gap: spacing.sm }}>
          {habit.source === 'manual' && (
            <Pressable
              accessibilityLabel="Edit habit"
              onPress={() => onEdit(habit.id)}
              style={{
                width: 36,
                height: 36,
                borderRadius: radius.full,
                backgroundColor: colorModes.surface.secondary,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Ionicons name="create-outline" size={18} color={colorModes.text.secondary} />
            </Pressable>
          )}
          <View
            style={{
              width: 36,
              height: 36,
              borderRadius: radius.full,
              backgroundColor: habit.completed ? colorModes.foreground.success : colorModes.surface.secondary,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Ionicons
              name={habit.completed ? 'checkmark' : 'ellipse-outline'}
              size={20}
              color={habit.completed ? colorModes.base.white : colorModes.text.muted}
            />
          </View>
        </View>
      </View>

      <View style={{ gap: spacing.xxs }}>
        <CustomText variant="displaySm">{formatProgress(habit)}</CustomText>
        <CustomText variant="caption" color="muted">
          {habit.currentStreak > 0 ? `${habit.currentStreak} period streak` : 'Build a streak by logging this habit'}
        </CustomText>
      </View>

      <HabitLogControl habit={habit} />

      <Pressable onPress={() => onOpen(habit.id)} style={{ alignSelf: 'flex-start' }}>
        <CustomText variant="bodySmStrong" color="secondary">View Details</CustomText>
      </Pressable>
    </Card>
  )
}

export default function HabitsScreen() {
  const { colorModes, spacing } = useTheme()
  const { data: habits = [], isLoading, isError, refetch } = useTodayHabitsQuery()
  const completedCount = habits.filter(habit => habit.completed).length
  const openCreateForm = () => router.push('/(app)/habits/create')
  const openEditForm = (habitId: string) => router.push(`/(app)/habits/edit/${habitId}`)
  const openHabit = (habitId: string) => router.push(`/(app)/(tabs)/habits/${habitId}`)

  return (
    <BaseScreen
      title="Habits"
      scrollable
      headerRight={() => (
        <Menu onPressTrigger={openCreateForm} roundedOutline>
          <Ionicons name="add" size={24} color={colorModes.text.primary} />
        </Menu>
      )}
    >
      <View style={{ gap: spacing.xxs }}>
        <CustomText variant="displayMd">Today</CustomText>
        <CustomText variant="bodySm" color="secondary">
          {habits.length > 0
            ? `${completedCount} of ${habits.length} habits complete`
            : 'Track the daily actions that move your fitness forward.'}
        </CustomText>
      </View>

      {isLoading && <HabitLoadingState />}
      {isError && <HabitErrorState onAction={() => refetch()} />}
      {!isLoading && !isError && habits.length === 0 && <HabitEmptyState />}

      {!isLoading && !isError && habits.length > 0 && (
        <View style={{ gap: spacing.md }}>
          {habits.map(habit => (
            <HabitTodayCard key={habit.id} habit={habit} onEdit={openEditForm} onOpen={openHabit} />
          ))}
        </View>
      )}
    </BaseScreen>
  )
}
