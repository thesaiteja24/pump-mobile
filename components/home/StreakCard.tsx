import React, { useEffect } from 'react'
import { Text, View } from 'react-native'
import Animated, {
	FadeInDown,
	useAnimatedStyle,
	useSharedValue,
	withRepeat,
	withSequence,
	withTiming,
} from 'react-native-reanimated'

export interface StreakDay {
	date: string // YYYY-MM-DD
	status: 'active' | 'missed' | 'today' | 'future'
}

const StreakCard = React.memo(function StreakCard({
	monthLabel,
	days,
	message,
}: {
	monthLabel: string
	days: StreakDay[]
	message: string
}) {
	return (
		<Animated.View
			entering={FadeInDown.delay(500).duration(500)}
			className="mb-4 rounded-2xl border border-neutral-200 bg-white px-4 py-4 dark:border-neutral-800 dark:bg-neutral-900"
		>
			{/* Month */}
			<Text className="text-xl font-semibold text-black dark:text-white">{monthLabel}</Text>

			{/* Motivational line */}
			<Text className="mt-2 text-base font-normal text-neutral-600 dark:text-neutral-400">{message}</Text>

			{/* Days */}
			<View className="mt-4 flex-row justify-between">
				{days.map(day => {
					const [y, m, d] = day.date.split('-').map(Number)
					const dateObj = new Date(y, m - 1, d)
					const dayLabel = dateObj.toLocaleDateString('en-US', {
						weekday: 'short',
					})

					const isActive = day.status === 'active'
					const isToday = day.status === 'today'
					const isMissed = day.status === 'missed'
					const isFuture = day.status === 'future'

					return (
						<View key={day.date} className="items-center">
							<Text className="mb-1 text-xs font-normal text-neutral-500 dark:text-neutral-400">
								{dayLabel}
							</Text>

							{/* Day pill */}
							<View
								className={`relative h-12 w-10 items-center justify-center overflow-hidden rounded-full ${
									isActive
										? 'bg-orange-500'
										: isToday
											? 'border-2 border-primary bg-white dark:bg-black'
											: isFuture
												? 'border border-neutral-600 bg-white dark:bg-black'
												: 'bg-neutral-300 dark:bg-neutral-700'
								} `}
							>
								{/* Pulsing effect for Today */}
								{isToday && <PulsingIndicator />}

								{/* 45° stripes for missed days ONLY */}
								{isMissed && !isFuture && (
									<View className="absolute -inset-6 rotate-[-45deg] flex-row">
										{Array.from({ length: 10 }).map((_, i) => (
											<View
												key={i}
												className={`w-2 ${
													i % 2 === 0
														? 'bg-neutral-400/40 dark:bg-neutral-600/40'
														: 'bg-transparent'
												}`}
											/>
										))}
									</View>
								)}

								{/* Date text */}
								<Text
									className={`text-sm font-medium ${
										isActive
											? 'text-white'
											: isToday
												? 'text-primary'
												: isFuture
													? 'text-neutral-500'
													: 'text-neutral-600 dark:text-neutral-300'
									} `}
								>
									{dateObj.getDate()}
								</Text>
							</View>
						</View>
					)
				})}
			</View>
		</Animated.View>
	)
})

function PulsingIndicator() {
	const opacity = useSharedValue(0.3)

	useEffect(() => {
		opacity.value = withRepeat(
			withSequence(withTiming(0.1, { duration: 1000 }), withTiming(0.3, { duration: 1000 })),
			-1,
			true
		)
	}, [])

	const animatedStyle = useAnimatedStyle(() => ({
		opacity: opacity.value,
	}))

	return <Animated.View style={animatedStyle} className="absolute inset-0 bg-primary/30" />
}

export default StreakCard
