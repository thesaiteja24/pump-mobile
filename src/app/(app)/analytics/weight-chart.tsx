import { useMemo } from 'react'

import { UserMetricChart } from '@/components/user/UserMetricChart'
import { useMeasurementsQuery } from '@/hooks/queries/me'
import { useUnitConverter } from '@/hooks/useUnitConverter'

const WeightChart = () => {
  const { formatWeight, weightUnit: preferredUnit } = useUnitConverter()
  const { data: measurementsData, isLoading } = useMeasurementsQuery('all')

  const chartData = useMemo(() => {
    return (measurementsData?.history || [])
      .filter((m) => m.weight != null && Number(m.weight) > 0)
      .map((m) => ({
        date: m.date,
        value: formatWeight(Number(m.weight), 1),
      }))
  }, [measurementsData?.history, formatWeight])

  return (
    <UserMetricChart
      title="Body Weight"
      data={chartData}
      isLoading={isLoading}
      unit={preferredUnit}
      accentColor="#10b981"
      icon="scale-outline"
      formatValue={(val) => val.toFixed(1)}
      defaultChartType="line"
    />
  )
}

export default WeightChart
