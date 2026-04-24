import { BaseTrainingChart } from '@/components/analytics/BaseTrainingChart'
import { useProfileQuery } from '@/hooks/queries/useMe'
import { SelfUser } from '@/types/user'
import { convertWeight } from '@/utils/converter'
import React from 'react'

export default function VolumeChartScreen() {
	const { data: userData } = useProfileQuery()
	const user = userData as SelfUser | null
	const preferredUnit = user?.preferredWeightUnit ?? 'kg'

	const formatVolume = (val: number) => {
		const converted = convertWeight(val, { from: 'kg', to: preferredUnit as any, precision: 0 })
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
