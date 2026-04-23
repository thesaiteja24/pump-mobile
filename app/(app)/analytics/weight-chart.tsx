import { useFitnessProfileQuery, useMeasurementsQuery } from '@/hooks/queries/useAnalytics'
import { useUserQuery } from '@/hooks/queries/useUser'
import { useThemeColor } from '@/hooks/useThemeColor'
import { useAuth } from '@/stores/authStore'
import { SelfUser } from '@/types/user'
import { convertWeight } from '@/utils/converter'
import { Ionicons } from '@expo/vector-icons'
import { format } from 'date-fns'
import { router } from 'expo-router'
import React, { useEffect, useMemo, useState } from 'react'
import { BackHandler, Dimensions, Pressable, ScrollView, Text, View } from 'react-native'
import { LineChart } from 'react-native-chart-kit'
import { SafeAreaView } from 'react-native-safe-area-context'

type TimeRange = '1W' | '1M' | '3M' | '6M' | '1Y' | 'All'

const WeightChart = () => {
	const colors = useThemeColor()
	const currentUserId = useAuth(s => s.userId)
	const { data: userData } = useUserQuery(currentUserId!)
	const user = userData as SelfUser | null

	const [selectedRange, setSelectedRange] = useState<TimeRange>('1W')
	const { data: measurementsData } = useMeasurementsQuery(selectedRange.toLowerCase())
	const { data: fitnessProfile } = useFitnessProfileQuery()
	const measurements = useMemo(() => measurementsData?.history || [], [measurementsData?.history])
	const preferredUnit = user?.preferredWeightUnit ?? 'kg'
	const fitnessGoal = fitnessProfile?.fitnessGoal as string | undefined

	// ── Data Preparation ──────────────────────────────────────────
	const filteredData = useMemo(() => {
		return measurements
			.filter(m => m.weight != null && Number(m.weight) > 0)
			.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
	}, [measurements])

	// ── Stats Calculation ─────────────────────────────────────────
	const stats = useMemo(() => {
		if (filteredData.length === 0) return { avg: 0, diff: 0, rangeStr: '' }

		const weights = filteredData.map(m =>
			convertWeight(Number(m.weight), { from: 'kg', to: preferredUnit, precision: 1 })
		)
		const avg = weights.reduce((a, b) => a + b, 0) / weights.length
		const diff = weights[weights.length - 1] - weights[0]

		const startStr = format(new Date(filteredData[0].date), 'MMM d')
		const endStr = format(new Date(filteredData[filteredData.length - 1].date), 'MMM d, yyyy')

		return {
			avg,
			diff,
			rangeStr: `${startStr} – ${endStr}`,
		}
	}, [filteredData, preferredUnit])

	const showPositive =
		(fitnessGoal === 'loseWeight' && stats.diff < 0) || (fitnessGoal === 'gainMuscle' && stats.diff > 0)

	// ── Chart Preparation ─────────────────────────────────────────
	const chartConfig = useMemo(() => {
		const weights = filteredData.map(m =>
			convertWeight(Number(m.weight), { from: 'kg', to: preferredUnit, precision: 1 })
		)

		if (weights.length === 0) return { labels: [], datasets: [{ data: [0] }] }

		// Labels: show only a few to avoid clutter
		const labels = filteredData.map((m, i) => {
			if (selectedRange === '1W') return format(new Date(m.date), 'EEE')
			if (i === 0 || i === filteredData.length - 1 || i === Math.floor(filteredData.length / 2)) {
				return format(new Date(m.date), 'MMM d')
			}
			return ''
		})

		// The user asked to keep the color as is for now (#10b981)
		const lineColor = '#10b981'

		return {
			labels,
			datasets: [
				{
					data: weights,
					color: () => lineColor,
					strokeWidth: 2,
					withShadow: true, // This adds the shade below the line
				},
			],
		}
	}, [filteredData, preferredUnit, selectedRange])

	const ranges: TimeRange[] = ['1W', '1M', '3M', '6M', '1Y', 'All']

	const screenWidth = Dimensions.get('window').width

	useEffect(() => {
		const onBackPress = () => {
			if (router.canGoBack()) {
				router.back()
			} else {
				router.push('/(app)/(tabs)/home')
			}
			return true
		}

		const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress)

		return () => subscription.remove()
	}, [])

	return (
		<SafeAreaView className="flex-1 bg-white dark:bg-black" edges={['bottom']}>
			<ScrollView className="flex-1">
				{/* Header Stats */}
				<View className="p-6 pt-0">
					<View className="flex-row items-center justify-between">
						<View>
							<Text className="text-sm font-medium text-neutral-500 dark:text-neutral-400">Average</Text>
							<View className="flex-row items-baseline gap-1">
								<Text className="text-3xl font-bold text-black dark:text-white">
									{stats.avg.toFixed(2)}
								</Text>
								<Text className="text-sm font-medium text-neutral-500">{preferredUnit}</Text>
							</View>
							<Text className="mt-1 text-xs text-neutral-400">{stats.rangeStr}</Text>
						</View>

						<View className="items-end">
							<Text className="text-sm font-medium text-neutral-500 dark:text-neutral-400">
								Difference
							</Text>
							<View className="flex-row items-center gap-1">
								<Ionicons
									name={stats.diff >= 0 ? 'trending-up' : 'trending-down'}
									size={16}
									color={showPositive ? '#10b981' : '#ef4444'}
								/>
								<Text
									className={`text-xl font-bold ${showPositive ? 'text-emerald-500' : 'text-red-500'}`}
								>
									{stats.diff >= 0 ? '+' : ''}
									{stats.diff.toFixed(2)}
								</Text>
								<Text className="text-sm font-medium text-neutral-500">{preferredUnit}</Text>
							</View>
						</View>
					</View>
				</View>

				{/* Chart Section */}
				<View className="h-64 justify-center">
					{filteredData.length > 1 ? (
						<LineChart
							data={chartConfig}
							width={screenWidth}
							height={220}
							bezier
							chartConfig={{
								backgroundColor: colors.isDark ? '#000' : '#fff',
								backgroundGradientFrom: colors.isDark ? '#000' : '#fff',
								backgroundGradientTo: colors.isDark ? '#000' : '#fff',
								decimalPlaces: 1,
								color: (opacity = 1) => `rgba(16, 185, 129, ${opacity})`,
								labelColor: (opacity = 1) =>
									colors.isDark ? `rgba(255, 255, 255, ${opacity})` : `rgba(0, 0, 0, ${opacity})`,
								style: { borderRadius: 16 },
								propsForDots: {
									r: '4',
									strokeWidth: '2',
									stroke: '#10b981',
								},
								propsForBackgroundLines: {
									strokeDasharray: '5, 5', // dashed background lines
									stroke: colors.isDark ? '#262626' : '#f5f5f5',
								},
							}}
							withHorizontalLabels={true}
							withVerticalLabels={true}
							withDots={filteredData.length < 30} // Only show dots if not too many points
							withInnerLines={true}
							withOuterLines={false}
							withShadow={true} // Ensure this is true
							style={{
								marginVertical: 8,
								borderRadius: 16,
							}}
						/>
					) : (
						<View className="flex-1 items-center justify-center p-10">
							<Text className="text-center text-neutral-400">
								Not enough data for this period. Try a longer range or log more weigh-ins.
							</Text>
						</View>
					)}
				</View>

				{/* Range Selector */}
				<View className="mt-8 px-6">
					<View className="flex-row items-center justify-between rounded-full bg-neutral-100 p-1 dark:bg-neutral-900">
						{ranges.map(range => (
							<Pressable
								key={range}
								onPress={() => setSelectedRange(range)}
								className={`flex-1 items-center rounded-full py-2 ${
									selectedRange === range ? 'bg-black dark:bg-white' : ''
								}`}
							>
								<Text
									className={`text-xs font-semibold ${
										selectedRange === range
											? 'text-white dark:text-black'
											: 'text-neutral-500 dark:text-neutral-400'
									}`}
								>
									{range}
								</Text>
							</Pressable>
						))}
					</View>
				</View>

				{/* Summary Cards */}
				<View className="mt-8 gap-4 px-6 pb-20">
					<View className="flex-row gap-4">
						<View className="flex-1 rounded-2xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
							<Text className="text-xs font-semibold uppercase text-neutral-500">Min Weight</Text>
							<Text className="mt-1 text-lg font-bold text-black dark:text-white">
								{(filteredData.length > 0
									? Math.min(
											...filteredData.map(m =>
												convertWeight(Number(m.weight), {
													from: 'kg',
													to: preferredUnit,
													precision: 1,
												})
											)
										)
									: 0
								).toFixed(2)}{' '}
								{preferredUnit}
							</Text>
						</View>
						<View className="flex-1 rounded-2xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
							<Text className="text-xs font-semibold uppercase text-neutral-500">Max Weight</Text>
							<Text className="mt-1 text-lg font-bold text-black dark:text-white">
								{(filteredData.length > 0
									? Math.max(
											...filteredData.map(m =>
												convertWeight(Number(m.weight), {
													from: 'kg',
													to: preferredUnit,
													precision: 1,
												})
											)
										)
									: 0
								).toFixed(2)}{' '}
								{preferredUnit}
							</Text>
						</View>
					</View>

					<View className="rounded-2xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
						<View className="flex-row items-center gap-2">
							<Ionicons name="information-circle-outline" size={18} color="#737373" />
							<Text className="text-sm font-medium text-neutral-600 dark:text-neutral-400">Insights</Text>
						</View>
						<Text className="mt-2 text-sm text-neutral-500">
							Your weight is trending {stats.diff > 0 ? 'upwards' : 'downwards'} by{' '}
							{Math.abs(stats.diff).toFixed(2)} {preferredUnit} in the last{' '}
							{selectedRange === 'All' ? 'period' : selectedRange}.
						</Text>
					</View>
				</View>
			</ScrollView>
		</SafeAreaView>
	)
}

export default WeightChart
