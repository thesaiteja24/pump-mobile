import React, { useEffect } from 'react'
import { View, useColorScheme, type DimensionValue, type ViewStyle } from 'react-native'
import Animated, {
	FadeInDown,
	useAnimatedStyle,
	useSharedValue,
	withRepeat,
	withSequence,
	withTiming,
} from 'react-native-reanimated'

/* ──────────────────────────────────────────────
   Core Skeleton Block (fade-in + shimmer)
────────────────────────────────────────────── */

function SkeletonBlock({
	width = '100%',
	height = 14,
	rounded = 8,
}: {
	width?: DimensionValue
	height?: number
	rounded?: number
}) {
	const scheme = useColorScheme()

	const fade = useSharedValue(0)
	const shimmer = useSharedValue(0.4)

	useEffect(() => {
		// Soft entrance
		fade.value = withTiming(1, { duration: 250 })

		// Shimmer loop
		shimmer.value = withRepeat(
			withSequence(withTiming(0.85, { duration: 900 }), withTiming(0.4, { duration: 900 })),
			-1,
			true
		)
	}, [])

	const animatedStyle = useAnimatedStyle(() => ({
		opacity: fade.value * shimmer.value,
	}))

	const blockStyle: ViewStyle = {
		width,
		height,
		borderRadius: rounded,
		backgroundColor: scheme === 'dark' ? '#3F3F46' : '#E5E7EB', // neutral-700 / neutral-200
	}

	return <Animated.View style={[animatedStyle, blockStyle]} />
}

/* ──────────────────────────────────────────────
   Streak Card Skeleton
────────────────────────────────────────────── */

function SkeletonStreakCard() {
	return (
		<View className="mb-4 rounded-2xl border border-neutral-200 bg-white px-4 py-4 dark:border-neutral-800 dark:bg-neutral-900">
			{/* Month */}
			<SkeletonBlock width={160} height={24} rounded={6} />

			{/* Motivation line */}
			<View className="mt-3">
				<SkeletonBlock width="100%" height={16} />
			</View>

			{/* Days */}
			<View className="mt-4 flex-row justify-between">
				{Array.from({ length: 7 }).map((_, i) => (
					<View key={i} className="items-center">
						<SkeletonBlock width={24} height={12} rounded={4} />
						<View className="mt-2">
							<SkeletonBlock width={40} height={48} rounded={999} />
						</View>
					</View>
				))}
			</View>
		</View>
	)
}

/* ──────────────────────────────────────────────
   Workout Card Skeleton
────────────────────────────────────────────── */

function SkeletonWorkoutCard() {
	return (
		<View className="mb-4 rounded-2xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
			{/* Header */}
			<View className="mb-4 flex-row items-center gap-3">
				<SkeletonBlock width={44} height={44} rounded={999} />
				<View className="flex-1 flex-col gap-2">
					<SkeletonBlock width="70%" height={16} />
					<SkeletonBlock width="50%" height={16} />
				</View>
			</View>

			<View className="mb-4 gap-2">
				<SkeletonBlock width="60%" height={18} />
			</View>

			{/* Meta row */}
			<View className="mb-4 flex-row justify-between gap-4">
				<SkeletonBlock width="45%" height={14} />
				<SkeletonBlock width="45%" height={14} />
			</View>

			{/* Exercise previews */}
			{[0, 1, 2].map(i => (
				<View key={i} className="mb-2 flex-row items-center gap-3">
					<SkeletonBlock width={44} height={44} rounded={999} />
					<SkeletonBlock width="70%" height={16} />
				</View>
			))}
		</View>
	)
}

/* ──────────────────────────────────────────────
   Home Screen Skeleton (export)
────────────────────────────────────────────── */

export default function ShimmerHomeScreen() {
	return (
		<Animated.View entering={FadeInDown.duration(300).springify()} className="flex-1">
			<SkeletonStreakCard />

			{Array.from({ length: 3 }).map((_, i) => (
				<SkeletonWorkoutCard key={i} />
			))}

			{/* Bottom breathing room to match real list */}
			<View className="mb-[20%]" />
		</Animated.View>
	)
}
