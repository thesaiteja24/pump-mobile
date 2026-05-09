import { UserMetricChart } from '@/components/user/UserMetricChart'
import { useUserTrainingAnalyticsQuery } from '@/hooks/queries/usePublicUser'
import { useAuth } from '@/stores/auth.store'

export default function DurationChartScreen() {
  const userId = useAuth((s) => s.userId)
  const { data: analytics, isLoading } = useUserTrainingAnalyticsQuery(userId!, 'all')

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(Math.abs(seconds) / 60)
    if (mins < 60) return `${mins}m`
    const h = Math.floor(mins / 60)
    const m = mins % 60
    const sign = seconds < 0 ? '-' : ''
    return m > 0 ? `${sign}${h}h ${m}m` : `${sign}${h}h`
  }

  return (
    <UserMetricChart
      title="Workout Duration"
      data={analytics?.duration || []}
      isLoading={isLoading}
      unit=""
      accentColor="#8b5cf6"
      icon="time-outline"
      formatValue={formatDuration}
      defaultChartType="bar"
    />
  )
}
