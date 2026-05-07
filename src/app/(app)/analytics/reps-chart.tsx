import React from 'react'

import { BaseTrainingChart } from '@/components/me/BaseTrainingChart'

export default function RepsChartScreen() {
  return (
    <BaseTrainingChart
      title="Total Repetitions"
      metricKey="reps"
      unit="reps"
      lineColor="#f59e0b"
      icon="repeat-outline"
      formatValue={(val) => Math.round(val).toLocaleString()}
    />
  )
}
