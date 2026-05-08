import { useEffect } from 'react'
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
    height,
    borderRadius: rounded,
    backgroundColor: scheme === 'dark' ? '#3F3F46' : '#E5E7EB',
  }

  return <Animated.View style={[animatedStyle, blockStyle]} />
}

/* ──────────────────────────────────────────────
   Workout Card Skeleton
────────────────────────────────────────────── */

function SkeletonSocialWorkoutCard() {
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
}

/* ──────────────────────────────────────────────
   Profile Screen Skeleton (export)
────────────────────────────────────────────── */

export function ShimmerProfileScreen() {
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

      {/* Follow Button Skeleton */}
      <View className="mb-6">
        <SkeletonBlock width="100%" height={48} rounded={12} />
      </View>

      {/* Workouts List Skeleton */}
      {Array.from({ length: 2 }).map((_, i) => (
        <SkeletonSocialWorkoutCard key={i} />
      ))}
    </Animated.View>
  )
}

export default ShimmerProfileScreen
