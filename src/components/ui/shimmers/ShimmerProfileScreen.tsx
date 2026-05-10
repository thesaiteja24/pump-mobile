import { memo, useEffect } from 'react'
import { type DimensionValue, useColorScheme, View, type ViewStyle } from 'react-native'
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

interface SkeletonBlockProps {
  width?: DimensionValue
  height?: number | DimensionValue
  rounded?: number
}

const SkeletonBlock = memo(({ width = '100%', height = 14, rounded = 8 }: SkeletonBlockProps) => {
  const scheme = useColorScheme()

  const fade = useSharedValue(0)
  const shimmer = useSharedValue(0.4)

  useEffect(() => {
    fade.value = withTiming(1, { duration: 250 })
    shimmer.value = withRepeat(
      withSequence(withTiming(0.85, { duration: 900 }), withTiming(0.4, { duration: 900 })),
      -1,
      true,
    )
  }, [fade, shimmer])

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: fade.value * shimmer.value,
  }))

  const blockStyle: ViewStyle = {
    width,
    height: height as any,
    borderRadius: rounded,
    backgroundColor: scheme === 'dark' ? '#3F3F46' : '#E5E7EB',
  }
  return <Animated.View style={[animatedStyle, blockStyle]} />
})
SkeletonBlock.displayName = 'SkeletonBlock'

/* ──────────────────────────────────────────────
   Workout Card Skeleton
────────────────────────────────────────────── */

const SkeletonSocialWorkoutCard = memo(() => {
  return (
    <View className="mb-4 rounded-2xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
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
      <View className="mb-4 flex-row justify-between gap-4">
        <SkeletonBlock width="45%" height={14} />
        <SkeletonBlock width="45%" height={14} />
      </View>
      {[0, 1].map((i) => (
        <View key={i} className="mb-2 flex-row items-center gap-3">
          <SkeletonBlock width={44} height={44} rounded={999} />
          <SkeletonBlock width="70%" height={16} />
        </View>
      ))}
    </View>
  )
})
SkeletonSocialWorkoutCard.displayName = 'SkeletonSocialWorkoutCard'

/* ──────────────────────────────────────────────
   Training Activity Skeleton
────────────────────────────────────────────── */

const SkeletonTrainingActivity = memo(() => {
  return (
    <View className="mb-6 h-72 gap-6 rounded-3xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
      <SkeletonBlock width="40%" height={20} />
      <View className="flex-1 flex-row items-end justify-between gap-2 px-2 pb-4">
        {[40, 70, 69, 45, 90, 55, 60, 80].map((h, i) => (
          <SkeletonBlock key={i} width="8%" height={`${h}%` as any} rounded={0} />
        ))}
      </View>
      <View className="flex-row justify-center gap-2">
        {[0, 1, 2].map((i) => (
          <SkeletonBlock key={i} width={8} height={8} rounded={999} />
        ))}
      </View>
    </View>
  )
})
SkeletonTrainingActivity.displayName = 'SkeletonTrainingActivity'

/* ──────────────────────────────────────────────
   Top Lifts Skeleton
────────────────────────────────────────────── */

const SkeletonTopLifts = memo(() => {
  return (
    <View className="mb-6 gap-4">
      <View className="flex-row items-center justify-between">
        <SkeletonBlock width="30%" height={24} />
      </View>
      <View className="flex-row gap-4">
        {[0, 1].map((i) => (
          <View
            key={i}
            className="w-44 rounded-3xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900"
          >
            <View className="mb-4 flex-row items-center gap-3">
              <SkeletonBlock width={40} height={40} rounded={12} />
              <View className="gap-1">
                <SkeletonBlock width={60} height={16} />
                <SkeletonBlock width={40} height={12} />
              </View>
            </View>
            <SkeletonBlock width="100%" height={32} />
          </View>
        ))}
      </View>
    </View>
  )
})
SkeletonTopLifts.displayName = 'SkeletonTopLifts'

/* ──────────────────────────────────────────────
   Profile Screen Skeleton (export)
────────────────────────────────────────────── */

export const ShimmerProfileScreen = memo(() => {
  return (
    <Animated.View entering={FadeInDown.duration(300).springify()} className="flex-1">
      {/* Header Skeleton */}
      <View className="mb-6 flex-row items-center gap-4">
        <SkeletonBlock width={75} height={75} rounded={999} />
        <View className="flex-1 gap-2">
          <SkeletonBlock width="60%" height={24} />
          <View className="flex-row gap-4">
            <View className="gap-1">
              <SkeletonBlock width={40} height={12} />
              <SkeletonBlock width={30} height={20} />
            </View>
            <View className="gap-1">
              <SkeletonBlock width={40} height={12} />
              <SkeletonBlock width={30} height={20} />
            </View>
            <View className="gap-1">
              <SkeletonBlock width={40} height={12} />
              <SkeletonBlock width={30} height={20} />
            </View>
          </View>
        </View>
      </View>

      {/* Action Buttons Skeleton */}
      <View className="mb-6 flex-row gap-4">
        <SkeletonBlock width="65%" height={42} rounded={999} />
        <SkeletonBlock width="30%" height={42} rounded={999} />
      </View>

      {/* Training Activity Skeleton */}
      <SkeletonTrainingActivity />

      {/* Top Lifts Skeleton */}
      <SkeletonTopLifts />

      {/* Section Title */}
      <View className="mb-4">
        <SkeletonBlock width="40%" height={24} />
      </View>

      {/* Workouts List Skeleton */}
      {Array.from({ length: 2 }).map((_, i) => (
        <SkeletonSocialWorkoutCard key={i} />
      ))}
    </Animated.View>
  )
})
ShimmerProfileScreen.displayName = 'ShimmerProfileScreen'

export default ShimmerProfileScreen
