import { BaseTrainingChart } from '@/components/me/BaseTrainingChart'
import React from 'react'

export default function DurationChartScreen() {
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(Math.abs(seconds) / 60)
    if (mins < 60) return `${mins}m`
    const h = Math.floor(mins / 60)
    const m = mins % 60
    const sign = seconds < 0 ? '-' : ''
    return m > 0 ? `${sign}${h}h ${m}m` : `${sign}${h}h`
  }

  return (
    <BaseTrainingChart
      title="Workout Duration"
      metricKey="duration"
      unit=""
      lineColor="#8b5cf6"
      icon="time-outline"
      formatValue={formatDuration}
    />
  )
}
