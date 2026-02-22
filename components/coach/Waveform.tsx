import React, { useMemo } from 'react'
import { View } from 'react-native'
import Svg, { Path } from 'react-native-svg'

type Props = {
	samples: number[] // normalized 0..1
	size?: number
	color?: string
}

export function Waveform({
	samples,
	size = 220,
	color = '#facc15', // NCS yellow
}: Props) {
	const path = useMemo(() => {
		if (samples.length === 0) return ''

		const cx = size / 2
		const cy = size / 2
		const baseRadius = size * 0.32
		const maxOffset = size * 0.12

		const points = samples.map((s, i) => {
			const angle = (i / samples.length) * Math.PI * 2
			const r = baseRadius + s * maxOffset
			return {
				x: cx + r * Math.cos(angle),
				y: cy + r * Math.sin(angle),
			}
		})

		let d = `M ${points[0].x} ${points[0].y}`
		for (let i = 1; i < points.length; i++) {
			d += ` L ${points[i].x} ${points[i].y}`
		}
		d += ' Z'

		return d
	}, [samples, size])

	return (
		<View>
			<Svg width={size} height={size}>
				<Path d={path} fill="none" stroke={color} strokeWidth={4} strokeLinejoin="round" />
			</Svg>
		</View>
	)
}
