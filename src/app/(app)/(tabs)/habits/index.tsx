import { Ionicons } from '@expo/vector-icons'
import { ActivityIndicator, View } from 'react-native'

import { HabitLogControl } from '@/components/habits/habit-log-control'
import { BaseScreen } from '@/components/ui/base-screen'
import { Card } from '@/components/ui/card'
import { CustomText } from '@/components/ui/custom-text'
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

function HabitTodayCard({ habit }: { habit: HabitTodayItem }) {
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

      <View style={{ gap: spacing.xxs }}>
        <CustomText variant="displaySm">{formatProgress(habit)}</CustomText>
        <CustomText variant="caption" color="muted">
          {habit.currentStreak > 0 ? `${habit.currentStreak} period streak` : 'Build a streak by logging this habit'}
        </CustomText>
      </View>

      <HabitLogControl habit={habit} />
    </Card>
  )
}

function HabitsEmptyState() {
  const { colorModes, spacing, radius } = useTheme()

  return (
    <View style={{ alignItems: 'center', paddingVertical: 80, gap: spacing.md }}>
      <View
        style={{
          width: 64,
          height: 64,
          borderRadius: radius.full,
          backgroundColor: colorModes.surface.secondary,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Ionicons name="checkmark-circle-outline" size={34} color={colorModes.text.secondary} />
      </View>
      <View style={{ gap: spacing.xxs, alignItems: 'center' }}>
        <CustomText variant="bodyStrong" align="center">No habits yet</CustomText>
        <CustomText variant="bodySm" color="secondary" align="center">
          Create your first habit to start tracking consistency.
        </CustomText>
      </View>
    </View>
  )
}

export default function HabitsScreen() {
  const { colorModes, spacing } = useTheme()
  const { data: habits = [], isLoading, isError } = useTodayHabitsQuery()
  const completedCount = habits.filter(habit => habit.completed).length

  return (
    <BaseScreen title="Habits" scrollable>
      <View style={{ gap: spacing.xxs }}>
        <CustomText variant="displayMd">Today</CustomText>
        <CustomText variant="bodySm" color="secondary">
          {habits.length > 0
            ? `${completedCount} of ${habits.length} habits complete`
            : 'Track the daily actions that move your fitness forward.'}
        </CustomText>
      </View>

      {isLoading && (
        <View style={{ paddingVertical: 80 }}>
          <ActivityIndicator color={colorModes.text.primary} size="large" />
        </View>
      )}

      {isError && (
        <Card>
          <CustomText variant="bodyStrong" color="danger">Unable to load habits</CustomText>
          <CustomText variant="bodySm" color="secondary">
            Pull to refresh or try again when your connection is stable.
          </CustomText>
        </Card>
      )}

      {!isLoading && !isError && habits.length === 0 && <HabitsEmptyState />}

      {!isLoading && !isError && habits.length > 0 && (
        <View style={{ gap: spacing.md }}>
          {habits.map(habit => <HabitTodayCard key={habit.id} habit={habit} />)}
        </View>
      )}
    </BaseScreen>
  )
}
