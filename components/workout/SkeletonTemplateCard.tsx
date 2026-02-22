import React, { useEffect } from 'react'
import { View, useColorScheme, type DimensionValue, type ViewStyle } from 'react-native'
import Animated, {
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
   Template Card Skeleton (matches TemplateCard layout)
────────────────────────────────────────────── */

export default function SkeletonTemplateCard() {
	return (
		<View className="ml-4 w-[80%] rounded-2xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
			{/* Header */}
			<View className="mb-3 flex-col justify-between gap-1">
				<View className="flex-row items-center justify-between gap-4">
					<SkeletonBlock width="60%" height={20} rounded={6} />
					<SkeletonBlock width={60} height={22} rounded={999} />
				</View>
				<SkeletonBlock width="40%" height={14} rounded={4} />
			</View>

			{/* Exercise preview */}
			{/* <View className="mb-4 flex-1">
        {[0, 1, 2].map((i) => (
          <View key={i} className="mb-2 flex-row items-center gap-2">
            <SkeletonBlock width={32} height={32} rounded={999} />
            <SkeletonBlock width="70%" height={14} rounded={4} />
          </View>
        ))}
      </View> */}

			{/* Button skeleton */}
			<SkeletonBlock width="100%" height={44} rounded={12} />
		</View>
	)
}
