import React, { useMemo } from 'react'
import { View } from 'react-native'

import MaleBackBodyMapMuscle from './MaleBackBodyMapMuscle'
import MaleFrontBodyMapMuscle from './MaleFrontBodyMapMuscle'

/* -------------------------------------------------------------------------- */
/*                                  Types                                     */
/* -------------------------------------------------------------------------- */

type ViewSide = 'front' | 'back'

type BodyMapProps = {
	side?: ViewSide
	muscleVolumes: Map<string, number>
	maxVolume: number
	onPressMuscle?: (muscleId: string) => void
}

/* -------------------------------------------------------------------------- */
/*                          NativeWind Color Tokens                            */
/* -------------------------------------------------------------------------- */
/**
 * SVGs cannot read className styles, so we pull colors from
 * your design system and apply them as strings.
 *
 * You can later centralize this in a theme file.
 */

const COLORS = {
	neutral: '#E5E7EB', // tailwind gray-200
	low: '#ff6467',
	high: '#c10007',
	mid: '#82181a',
}

/* -------------------------------------------------------------------------- */
/*                          Heatmap Color Logic                                */
/* -------------------------------------------------------------------------- */

function getHeatColor(value: number, max: number) {
	if (value <= 0 || max <= 0) return COLORS.neutral

	const ratio = value / max

	if (ratio < 0.33) return COLORS.low
	if (ratio < 0.66) return COLORS.mid
	return COLORS.high
}

/* -------------------------------------------------------------------------- */
/*                                Component                                   */
/* -------------------------------------------------------------------------- */

const BodyMap = ({ side = 'front', muscleVolumes, maxVolume, onPressMuscle }: BodyMapProps) => {
	/**
	 * Convert muscle volume data into a simple:
	 * { muscleId: fillColor }
	 */
	const fills = useMemo<Record<string, string>>(() => {
		const result: Record<string, string> = {}

		muscleVolumes.forEach((volume, muscleId) => {
			result[muscleId] = getHeatColor(volume, maxVolume)
		})

		return result
	}, [muscleVolumes, maxVolume])

	return (
		<View className="ml-3 mt-6 aspect-[10/16] h-[90%] w-full items-center justify-center">
			{side === 'front' ? (
				<MaleFrontBodyMapMuscle fills={fills} onPressMuscle={onPressMuscle} />
			) : (
				<MaleBackBodyMapMuscle fills={fills} onPressMuscle={onPressMuscle} />
			)}
		</View>
	)
}

export default BodyMap
