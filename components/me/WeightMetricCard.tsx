import {
  useFitnessProfileQuery,
  useMeasurementsQuery,
  useProfileQuery,
} from '@/hooks/queries/useMe'
import { useThemeColor } from '@/hooks/useThemeColor'
import { SelfUser } from '@/types/user'
import { convertWeight } from '@/utils/converter'
import { router } from 'expo-router'
import React, { useMemo } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { LineChart } from 'react-native-chart-kit'
import Animated, { FadeInDown } from 'react-native-reanimated'

interface WeightMetricCardProps {
  width: number
}

export function WeightMetricCard({ width }: WeightMetricCardProps) {
  const colors = useThemeColor()
  const { data: userData } = useProfileQuery()
  const user = userData as SelfUser | null

  const { data: analytics } = useMeasurementsQuery()
  const { data: fitnessProfile } = useFitnessProfileQuery()

  const preferredUnit = user?.preferredWeightUnit ?? 'kg'
  const fitnessGoal = fitnessProfile?.fitnessGoal as string | undefined

  // ── Layout ratios ─────────────────────────────────────────────
  const CARD_HEIGHT_RATIO = 0.8
  const CHART_HEIGHT_RATIO = 0.45

  const cardHeight = width * CARD_HEIGHT_RATIO
  const chartHeight = Math.max(60, Math.min(cardHeight * CHART_HEIGHT_RATIO, 120))

  // ── Last 7 entries ────────────────────────────────────────────
  const last7 = useMemo(() => {
    return (
      analytics?.history
        // TODO(to be done by user only): check if we can fix this any type declartion
        ?.filter((m: any) => m.weight != null && Number(m.weight) > 0)
        .slice()
        .sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime())
        .slice(-7) ?? []
    )
  }, [analytics])

  // ── Trend logic ───────────────────────────────────────────────
  const isGaining = analytics?.dailyWeightChange?.isPositive ?? false

  const showPositive =
    (fitnessGoal === 'gainMuscle' && isGaining) || (fitnessGoal === 'loseWeight' && !isGaining)

  const lineColor = showPositive ? '#22c55e' : '#ef4444'

  // ── Chart data ────────────────────────────────────────────────
  const chartData = useMemo(() => {
    if (last7.length === 0) return [0]
    // TODO(to be done by user only): check if we can fix this any type declartion
    return last7.map((m: any) =>
      convertWeight(Number(m.weight), {
        from: 'kg',
        to: preferredUnit,
        precision: 2,
      }),
    )
  }, [last7, preferredUnit])

  // ── Latest value ──────────────────────────────────────────────
  const latestWeight = chartData[chartData.length - 1]
  const latestDisplay = latestWeight > 0 ? `${latestWeight.toFixed(2)} ${preferredUnit}` : '—'

  const bgColor = colors.isDark ? '#171717' : '#ffffff'

  // ── Empty state ───────────────────────────────────────────────
  if (last7.length < 2) {
    return (
      <View
        style={[
          styles.card,
          {
            width,
            height: cardHeight,
            backgroundColor: bgColor,
            borderColor: colors.isDark ? '#262626' : '#e5e5e5',
          },
        ]}
      >
        <Text className="text-base font-medium text-neutral-600 dark:text-neutral-400">
          Scale Weight
        </Text>
        <Text style={[styles.subtitle, { color: colors.isDark ? '#737373' : '#a3a3a3' }]}>
          Last 7 Entries
        </Text>

        <View style={styles.emptyState}>
          <Text style={{ color: colors.isDark ? '#525252' : '#d4d4d4', fontSize: 12 }}>
            Log at least 2 weigh-ins to see your trend
          </Text>
        </View>
      </View>
    )
  }

  return (
    <Animated.View entering={FadeInDown.duration(500)}>
      <Pressable
        onPress={() => {
          router.push('/analytics/weight-chart')
        }}
        pointerEvents="box-only"
        style={[
          styles.card,
          {
            width,
            height: cardHeight,
            backgroundColor: bgColor,
            borderColor: colors.isDark ? '#262626' : '#e5e5e5',
          },
        ]}
      >
        {/* Header (fixed) */}
        <View style={styles.header}>
          <View>
            <Text className="text-base font-medium text-neutral-600 dark:text-neutral-400">
              Scale Weight
            </Text>
            <Text className="text-sm text-neutral-500 dark:text-neutral-400">
              Last {last7.length} Entries
            </Text>
          </View>
        </View>

        {/* Chart (flexible center) */}
        <View style={styles.chartContainer}>
          <View style={{ overflow: 'hidden' }}>
            <LineChart
              data={{
                labels: [],
                datasets: [
                  {
                    data: chartData,
                    color: () => lineColor,
                    strokeWidth: 2,
                  },
                ],
              }}
              width={width - 32}
              height={chartHeight}
              withDots
              withInnerLines={false}
              withOuterLines={false}
              withHorizontalLabels={false}
              withVerticalLabels={false}
              withShadow={false}
              chartConfig={{
                backgroundGradientFrom: bgColor,
                backgroundGradientTo: bgColor,
                backgroundGradientFromOpacity: 0,
                backgroundGradientToOpacity: 0,
                color: () => lineColor,
                strokeWidth: 2,
                propsForDots: {
                  r: '3',
                  strokeWidth: '1.5',
                  stroke: lineColor,
                  fill: bgColor,
                },
              }}
              bezier
              style={{ marginLeft: -16, marginRight: -16, paddingBottom: 4 }}
            />
          </View>
        </View>

        {/* Footer (fixed) */}
        <View className="mt-4 flex flex-row items-center justify-between">
          <Text className="text-base font-semibold text-black dark:text-white">
            {latestDisplay}
          </Text>

          {/* <MaterialCommunityIcons name="chevron-right" size={24} color={colors.text} /> */}
        </View>
      </Pressable>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 8,
    overflow: 'hidden',
    justifyContent: 'space-between',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 2,
    flexShrink: 0,
  },
  chartContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    fontSize: 14,
    fontWeight: '500',
  },
  subtitle: {
    fontSize: 12,
    marginTop: 1,
  },
  emptyState: {
    marginTop: 16,
    alignItems: 'center',
    paddingVertical: 12,
  },
  latestValue: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 4,
    flexShrink: 0,
  },
})
