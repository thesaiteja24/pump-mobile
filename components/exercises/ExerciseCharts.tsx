import { Button } from '@/components/ui/Button'
import { useThemeColor } from '@/hooks/useThemeColor'
import { useState } from 'react'
import { Dimensions, View } from 'react-native'
import { LineChart } from 'react-native-chart-kit'
import Animated, { useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated'

/* --------------------------------------------------
   Types
-------------------------------------------------- */

enum ChartMode {
	OneRM = '1rm',
	SetVolume = 'setVolume',
	HeaviestWeight = 'heaviestWeight',
}

export interface ExerciseChartsProps {
	best1RMRecords: Record<string, number>
	bestSetVolumeRecords: Record<string, number>
	heaviestWeightRecords: Record<string, number>
}

/* --------------------------------------------------
   Constants
-------------------------------------------------- */

const { width } = Dimensions.get('window')

/* --------------------------------------------------
   Component
-------------------------------------------------- */

export default function ExerciseCharts({
	best1RMRecords,
	bestSetVolumeRecords,
	heaviestWeightRecords,
}: ExerciseChartsProps) {
	const color = useThemeColor()

	const [chartMode, setChartMode] = useState<ChartMode>(ChartMode.SetVolume)
	const [selectedIndex, setSelectedIndex] = useState<number | null>(null)
	const blinkValue = useSharedValue(1)

	// Build data in react-native-chart-kit format
	const buildChartData = (records: Record<string, number>) => {
		const entries = Object.entries(records).sort(([a], [b]) => new Date(a).getTime() - new Date(b).getTime())
		return {
			labels: entries.map(([date]) =>
				new Date(date).toLocaleDateString('en-US', {
					day: '2-digit',
					month: 'short',
				})
			),
			values: entries.map(([, value]) => value),
		}
	}

	const best1RMChartData = buildChartData(best1RMRecords)
	const bestSetVolumeChartData = buildChartData(bestSetVolumeRecords)
	const heaviestWeightChartData = buildChartData(heaviestWeightRecords)

	// Fallback for empty data
	const safeData = (data: { labels: string[]; values: number[] }) => ({
		labels: data.labels.length > 0 ? data.labels : ['No data'],
		datasets: [
			{
				data: data.values.length > 0 ? data.values : [0],
				strokeWidth: 2,
			},
		],
	})

	const chartColors = {
		volume: {
			line: color.scheme === 'dark' ? '#60A5FA' : '#2563EB',
			gradient: color.scheme === 'dark' ? '#60A5FA' : '#3B82F6',
		},
		oneRM: {
			line: color.scheme === 'dark' ? '#FDBA74' : '#F97316',
			gradient: color.scheme === 'dark' ? '#FDBA74' : '#FB923C',
		},
		weight: {
			line: color.scheme === 'dark' ? '#FCA5A5' : '#EF4444',
			gradient: color.scheme === 'dark' ? '#FCA5A5' : '#F87171',
		},
	}

	const getChartConfig = () => {
		const isDark = color.scheme === 'dark'
		const baseConfig = {
			backgroundColor: isDark ? '#000000' : '#ffffff',
			backgroundGradientFrom: isDark ? '#000000' : '#ffffff',
			backgroundGradientTo: isDark ? '#000000' : '#ffffff',
			decimalPlaces: 0,
			propsForDots: {
				r: '4',
				strokeWidth: '2',
			},
			propsForBackgroundLines: {
				stroke: isDark ? '#333333' : '#E5E5E5',
				strokeDasharray: '',
			},
			labelColor: () => (isDark ? '#9CA3AF' : '#6B7280'),
			paddingRight: 0,
			paddingLeft: 0,
		}

		switch (chartMode) {
			case 'setVolume':
				return {
					...baseConfig,
					color: (opacity = 1) => `rgba(96, 165, 250, ${opacity})`, // Blue
					fillShadowGradientFrom: chartColors.volume.gradient,
					fillShadowGradientTo: isDark ? '#000000' : '#ffffff',
					fillShadowGradientOpacity: 0.7,
					propsForDots: {
						...baseConfig.propsForDots,
						stroke: chartColors.volume.line,
						fill: chartColors.volume.line,
					},
				}
			case '1rm':
				return {
					...baseConfig,
					color: (opacity = 1) => `rgba(253, 186, 116, ${opacity})`, // Orange
					fillShadowGradientFrom: chartColors.oneRM.gradient,
					fillShadowGradientTo: isDark ? '#000000' : '#ffffff',
					fillShadowGradientOpacity: 0.3,
					propsForDots: {
						...baseConfig.propsForDots,
						stroke: chartColors.oneRM.line,
						fill: chartColors.oneRM.line,
					},
				}
			case 'heaviestWeight':
				return {
					...baseConfig,
					color: (opacity = 1) => `rgba(252, 165, 165, ${opacity})`, // Red
					fillShadowGradientFrom: chartColors.weight.gradient,
					fillShadowGradientTo: isDark ? '#000000' : '#ffffff',
					fillShadowGradientOpacity: 0.3,
					propsForDots: {
						...baseConfig.propsForDots,
						stroke: chartColors.weight.line,
						fill: chartColors.weight.line,
					},
				}
		}
	}

	const getCurrentChartData = () => {
		switch (chartMode) {
			case 'setVolume':
				return safeData(bestSetVolumeChartData)
			case '1rm':
				return safeData(best1RMChartData)
			case 'heaviestWeight':
				return safeData(heaviestWeightChartData)
			default:
				return safeData(bestSetVolumeChartData)
		}
	}

	const chartData = getCurrentChartData()
	const totalLabels = chartData.labels.length
	const labelInterval = totalLabels > 0 ? Math.floor(totalLabels / 4) : 1

	// Blinking animation logic
	const startBlinking = () => {
		blinkValue.value = withRepeat(withTiming(0.3, { duration: 500 }), -1, true)
	}

	const stopBlinking = () => {
		blinkValue.value = withTiming(1, { duration: 200 })
	}

	const dotBlinkStyle = useAnimatedStyle(() => ({
		opacity: blinkValue.value,
	}))

	return (
		<>
			<View className="pt-4">
				<LineChart
					data={chartData}
					width={width}
					height={220}
					chartConfig={getChartConfig()}
					bezier
					onDataPointClick={data => {
						if (selectedIndex === data.index) {
							setSelectedIndex(null)
							stopBlinking()
						} else {
							setSelectedIndex(data.index)
							startBlinking()
						}
					}}
					renderDotContent={({ x, y, index }) => {
						if (index !== selectedIndex) return null

						return (
							<View key={index}>
								{/* Vertical Line */}
								<View
									style={{
										position: 'absolute',
										left: x,
										top: 0,
										bottom: 0,
										width: 1,
										backgroundColor: chartColors.volume.line,
										height: 180,
										zIndex: -1,
									}}
								/>
								{/* Blinking Selection Dot */}
								<Animated.View
									style={[
										{
											position: 'absolute',
											left: x - 6,
											top: y - 6,
											width: 12,
											height: 12,
											borderRadius: 6,
											backgroundColor: chartColors.volume.line,
											borderWidth: 2,
											borderColor: 'white',
										},
										dotBlinkStyle,
									]}
								/>
							</View>
						)
					}}
					formatXLabel={value => {
						const index = chartData.labels.indexOf(value)
						if (index === 0 || index === totalLabels - 1 || index % labelInterval === 0) {
							return value
						}
						return ''
					}}
					withInnerLines={false}
					withDots={true}
					withShadow={true}
					withOuterLines={true}
					withHorizontalLabels={true}
					fromZero={false}
				/>
			</View>

			<View className="flex flex-row justify-evenly gap-4 px-4 pt-4">
				<Button
					title="Volume"
					onPress={() => setChartMode(ChartMode.SetVolume)}
					variant={chartMode === ChartMode.SetVolume ? 'primary' : 'secondary'}
				/>
				<Button
					title="1 RM"
					onPress={() => setChartMode(ChartMode.OneRM)}
					variant={chartMode === ChartMode.OneRM ? 'primary' : 'secondary'}
				/>
				<Button
					title="Weight"
					onPress={() => setChartMode(ChartMode.HeaviestWeight)}
					variant={chartMode === ChartMode.HeaviestWeight ? 'primary' : 'secondary'}
				/>
			</View>
		</>
	)
}
