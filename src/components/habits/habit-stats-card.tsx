import { View } from 'react-native'

import { Card } from '@/components/ui/card'
import { CustomText } from '@/components/ui/custom-text'
import { useTheme } from '@/hooks/use-theme'

import type { HabitStats } from '@/types/habit'

function clampPercent(value: number) {
  return Math.max(0, Math.min(value, 100))
}

function CompletionBar({ label, value }: { label: string, value: number }) {
  const { colorModes, radius, spacing } = useTheme()
  const width = `${clampPercent(value)}%` as const

  return (
    <View style={{ gap: spacing.xxs }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <CustomText variant="caption" color="secondary">{label}</CustomText>
        <CustomText variant="caption" color="secondary">
          {value}
          %
        </CustomText>
      </View>
      <View style={{ height: 8, borderRadius: radius.full, backgroundColor: colorModes.surface.secondary, overflow: 'hidden' }}>
        <View style={{ width, height: '100%', borderRadius: radius.full, backgroundColor: colorModes.background.inverse }} />
      </View>
    </View>
  )
}

function StatPill({ label, value }: { label: string, value: string | number }) {
  const { colorModes, radius, spacing } = useTheme()

  return (
    <View
      style={{
        flex: 1,
        borderRadius: radius.lg,
        backgroundColor: colorModes.surface.secondary,
        padding: spacing.md,
        gap: spacing.xxs,
      }}
    >
      <CustomText variant="displaySm">{value}</CustomText>
      <CustomText variant="caption" color="muted">{label}</CustomText>
    </View>
  )
}

export function HabitStatsCard({ stats }: { stats: HabitStats }) {
  const { spacing } = useTheme()

  return (
    <Card style={{ gap: spacing.lg }}>
      <CustomText variant="bodyStrong">Progress</CustomText>
      <View style={{ flexDirection: 'row', gap: spacing.md }}>
        <StatPill label="Current streak" value={stats.currentStreak} />
        <StatPill label="Best streak" value={stats.bestStreak} />
      </View>
      <View style={{ flexDirection: 'row', gap: spacing.md }}>
        <StatPill label="Completed" value={stats.totalCompletedPeriods} />
        <StatPill label="Period" value={stats.streakPeriod} />
      </View>
      <CompletionBar label="This week" value={stats.weeklyCompletion} />
      <CompletionBar label="This month" value={stats.monthlyCompletion} />
    </Card>
  )
}
