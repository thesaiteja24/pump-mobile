import BaseScreen from '@/components/ui/BaseScreen'
import { UserMetricChart } from '@/components/user/UserMetricChart'
import { useUserTrainingAnalyticsQuery } from '@/hooks/queries/usePublicUser'
import { useUnitConverter } from '@/hooks/useUnitConverter'
import { useAuth } from '@/stores/auth.store'

export default function VolumeChartScreen() {
  const userId = useAuth((s) => s.userId)
  const { formatWeight, weightUnit: preferredUnit } = useUnitConverter()
  const { data: analytics, isLoading } = useUserTrainingAnalyticsQuery(userId!, 'all')

  const formatVolume = (val: number) => {
    const converted = formatWeight(val, 0)
    return converted.toLocaleString()
  }

  return (
    <BaseScreen title="Volume Trend" backButton>
      <UserMetricChart
        title="Training Volume"
        data={analytics?.volume || []}
        isLoading={isLoading}
        unit={preferredUnit}
        accentColor="#10b981"
        icon="bar-chart-outline"
        formatValue={formatVolume}
        defaultChartType="bar"
      />
    </BaseScreen>
  )
}
