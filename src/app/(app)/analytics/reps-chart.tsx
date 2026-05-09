import { UserMetricChart } from '@/components/user/UserMetricChart'
import { useUserTrainingAnalyticsQuery } from '@/hooks/queries/usePublicUser'
import { useAuth } from '@/stores/auth.store'

export default function RepsChartScreen() {
  const userId = useAuth((s) => s.userId)
  const { data: analytics, isLoading } = useUserTrainingAnalyticsQuery(userId!, 'all')

  return (
    <UserMetricChart
      title="Total Repetitions"
      data={analytics?.reps || []}
      isLoading={isLoading}
      unit="reps"
      accentColor="#f59e0b"
      icon="repeat-outline"
      formatValue={(val) => Math.round(val).toLocaleString()}
      defaultChartType="bar"
    />
  )
}
