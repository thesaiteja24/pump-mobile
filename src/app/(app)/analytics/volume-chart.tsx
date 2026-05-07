import React from 'react'

import { BaseTrainingChart } from '@/components/me/BaseTrainingChart'
import { useUnitConverter } from '@/hooks/useUnitConverter'

export default function VolumeChartScreen() {
  const { formatWeight, weightUnit: preferredUnit } = useUnitConverter()

  const formatVolume = (val: number) => {
    const converted = formatWeight(val, 0)
    return converted.toLocaleString()
  }

  return (
    <BaseTrainingChart
      title="Training Volume"
      metricKey="volume"
      unit={preferredUnit}
      lineColor="#10b981"
      icon="bar-chart-outline"
      formatValue={formatVolume}
    />
  )
}
