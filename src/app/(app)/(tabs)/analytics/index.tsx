import { useRouter } from 'expo-router'
import { LucideChevronRight, LucidePencilRuler } from 'lucide-react-native'
import React, { memo } from 'react'
import { ActivityIndicator, Text, View } from 'react-native'

import { BaseScreen } from '@/components/ui/base-screen'
import { Card } from '@/components/ui/card'
import { useMeasurementsQuery } from '@/hooks/queries/use-user'
import { useTheme } from '@/hooks/use-theme'
import { useUnitConverter } from '@/hooks/use-unit-converter'

const MeasurementsSummaryContent = memo(({ latestWeight, latestBodyFat, latestWaist, weightChange }: {
  latestWeight: number | null | undefined
  latestBodyFat: number | null | undefined
  latestWaist: number | null | undefined
  weightChange: { diff: number, isPositive: boolean } | null | undefined
}) => {
  const { colors, typography, layout } = useTheme()
  const { formatWeight, formatLength, weightUnit, lengthUnit } = useUnitConverter()

  return (
    <View style={[layout.row, { gap: 12 }]}>
      {latestWeight
        ? (
            <View style={[layout.flex1]}>
              <Text style={[typography.caption, { color: colors.textSecondary }]}>Weight</Text>
              <Text style={[typography.bodyStrong, { color: colors.text }]}>
                {formatWeight(latestWeight).toFixed(1)}
                <Text style={[typography.caption, { color: colors.textSecondary }]}>
                  {' '}
                  {weightUnit}
                </Text>
              </Text>
              {weightChange && (
                <Text
                  style={[
                    typography.caption,
                    {
                      color: weightChange.isPositive ? colors.danger : colors.success,
                      marginTop: 2,
                      fontWeight: 'bold',
                    },
                  ]}
                >
                  {weightChange.isPositive ? '+' : '-'}
                  {formatWeight(Math.abs(weightChange.diff)).toFixed(1)}
                  {' '}
                  {weightUnit}
                  {' '}
                  today
                </Text>
              )}
            </View>
          )
        : null}

      {latestBodyFat
        ? (
            <View style={[layout.flex1]}>
              <Text style={[typography.caption, { color: colors.textSecondary }]}>Body Fat</Text>
              <Text style={[typography.bodyStrong, { color: colors.text }]}>
                {latestBodyFat.toFixed(1)}
                <Text style={[typography.caption, { color: colors.textSecondary }]}> %</Text>
              </Text>
            </View>
          )
        : null}

      {latestWaist
        ? (
            <View style={[layout.flex1]}>
              <Text style={[typography.caption, { color: colors.textSecondary }]}>Waist</Text>
              <Text style={[typography.bodyStrong, { color: colors.text }]}>
                {formatLength(latestWaist).toFixed(1)}
                <Text style={[typography.caption, { color: colors.textSecondary }]}>
                  {' '}
                  {lengthUnit}
                </Text>
              </Text>
            </View>
          )
        : null}
    </View>
  )
})
MeasurementsSummaryContent.displayName = 'MeasurementsSummaryContent'

const MeasurementsSummaryCard = memo(() => {
  const router = useRouter()
  const { colors, spacing, typography, layout, radius } = useTheme()
  const { data: measurements, isLoading } = useMeasurementsQuery('all')

  if (isLoading) {
    return (
      <Card style={{ padding: spacing.md, marginTop: spacing.lg }}>
        <ActivityIndicator size="small" color={colors.text} />
      </Card>
    )
  }

  const latestWeight = measurements?.latestValues?.weight
  const latestBodyFat = measurements?.latestValues?.bodyFat
  const latestWaist = measurements?.latestValues?.waist
  const weightChange = measurements?.dailyWeightChange
  const hasAnyMeasurement = latestWeight || latestBodyFat || latestWaist

  return (
    <Card onPress={() => router.push('/analytics/measurements')}>
      <View style={[layout.rowAlign, layout.rowBetween, { marginBottom: spacing.md }]}>
        <View style={[layout.rowAlign, { gap: spacing.sm }]}>
          <View style={{ backgroundColor: colors.input, padding: spacing.sm, borderRadius: radius.md }}>
            <LucidePencilRuler size={20} color={colors.text} />
          </View>
          <View>
            <Text style={[typography.bodyStrong, { color: colors.text }]}>Body Measurements</Text>
            <Text style={[typography.caption, { color: colors.textSecondary }]}>Track physical progress</Text>
          </View>
        </View>
        <LucideChevronRight size={20} color={colors.textSecondary} />
      </View>

      {hasAnyMeasurement
        ? (
            <MeasurementsSummaryContent
              latestWeight={latestWeight}
              latestBodyFat={latestBodyFat}
              latestWaist={latestWaist}
              weightChange={weightChange}
            />
          )
        : (
            <Text style={[typography.bodySm, { color: colors.textMuted, fontStyle: 'italic' }]}>
              No measurements logged yet. Tap to start tracking.
            </Text>
          )}
    </Card>
  )
})
MeasurementsSummaryCard.displayName = 'MeasurementsSummaryCard'

export default function AnalyticsScreen() {
  return (
    <BaseScreen title="Analytics" scrollable>
      <MeasurementsSummaryCard />
    </BaseScreen>
  )
}
