import { Ionicons } from '@expo/vector-icons'
import { router, useLocalSearchParams } from 'expo-router'
import { ActivityIndicator, View } from 'react-native'

import { HabitStatsCard } from '@/components/habits/habit-stats-card'
import { BaseScreen } from '@/components/ui/base-screen'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { CustomText } from '@/components/ui/custom-text'
import { useArchiveHabitMutation, useHabitQuery, useHabitStatsQuery } from '@/hooks/queries/use-habits'
import { useTheme } from '@/hooks/use-theme'
import { Arise } from '@/lib/arise'

import type { Habit } from '@/types/habit'

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
          <Ionicons name="checkmark-circle-outline" size={24} color={colorModes.text.primary} />
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
        Arise.success('Habit archived')
        router.back()
      },
      onError: () => Arise.error({ heading: 'Unable to archive habit' }),
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

export default function HabitDetailScreen() {
  const { habitId } = useLocalSearchParams<{ habitId: string }>()
  const { colorModes, spacing } = useTheme()
  const habitQuery = useHabitQuery(habitId)
  const statsQuery = useHabitStatsQuery(habitId)
  const habit = habitQuery.data

  return (
    <BaseScreen
      title="Habit"
      scrollable
      headerLeft={() => (
        <Button
          variant="ghost"
          leftIcon={<Ionicons name="chevron-back" size={24} color={colorModes.text.primary} />}
          onPress={() => router.back()}
        />
      )}
    >
      {habitQuery.isLoading && (
        <View style={{ paddingVertical: 80 }}>
          <ActivityIndicator color={colorModes.text.primary} size="large" />
        </View>
      )}

      {habitQuery.isError && (
        <Card style={{ gap: spacing.sm }}>
          <CustomText variant="bodyStrong" color="danger">Unable to load habit</CustomText>
          <CustomText variant="bodySm" color="secondary">Go back and try again.</CustomText>
        </Card>
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
          <ArchiveHabitButton habit={habit} />
        </>
      )}
    </BaseScreen>
  )
}
