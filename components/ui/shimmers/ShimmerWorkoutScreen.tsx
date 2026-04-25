import React, { useEffect } from 'react'
import { ScrollView, useColorScheme, View, type DimensionValue, type ViewStyle } from 'react-native'
import Animated, {
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

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
    backgroundColor: scheme === 'dark' ? '#3F3F46' : '#E5E7EB', // neutral-700 / neutral-200
  }

  return <Animated.View style={[animatedStyle, blockStyle]} />
}

/* ──────────────────────────────────────────────
   Exercise Row Skeleton
────────────────────────────────────────────── */

function SkeletonExerciseRow() {
  return (
    <View className="mb-4 rounded-2xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
      <View className="mb-3 flex-row items-center gap-3">
        {/* Thumbnail */}
        <SkeletonBlock width={40} height={40} rounded={999} />
        <View className="gap-2">
          {/* Title */}
          <SkeletonBlock width={120} height={20} rounded={4} />
        </View>
      </View>

      <View className="gap-2">
        {/* Set Rows */}
        {Array.from({ length: 2 }).map((_, i) => (
          <View
            key={i}
            className="flex-row items-center rounded bg-neutral-50 p-2 dark:bg-neutral-800/50"
          >
            <View className="w-10">
              <SkeletonBlock width={16} height={16} rounded={4} />
            </View>
            <View className="flex-1">
              <SkeletonBlock width="40%" height={16} />
            </View>
            <View className="w-24 items-end">
              <SkeletonBlock width="80%" height={14} />
            </View>
          </View>
        ))}
      </View>
    </View>
  )
}

/* ──────────────────────────────────────────────
   Shimmer Workout Screen
────────────────────────────────────────────── */

export default function ShimmerWorkoutScreen() {
  const safeAreaInsets = useSafeAreaInsets()

  return (
    <Animated.View
      entering={FadeInDown.duration(300).springify()}
      className="flex-1 bg-white dark:bg-black"
    >
      <ScrollView
        className="p-4"
        contentContainerStyle={{ paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Skeleton */}
        <View className="mb-6 flex-col gap-4">
          <View className="flex-row items-center gap-4">
            {/* Profile Pic */}
            <SkeletonBlock width={48} height={48} rounded={999} />
            {/* User Name */}
            <SkeletonBlock width={120} height={24} rounded={4} />
          </View>

          {/* Title */}
          <SkeletonBlock width="70%" height={28} rounded={8} />

          {/* Metadata Line */}
          <SkeletonBlock width="80%" height={16} rounded={4} />
        </View>

        {/* Exercise List Skeleton */}
        <View className="gap-4">
          <SkeletonExerciseRow />
          <SkeletonExerciseRow />
          <SkeletonExerciseRow />
        </View>
      </ScrollView>

      {/* Footer Buttons Skeleton */}
      <View
        className="absolute bottom-0 left-0 right-0 border-t border-neutral-100 bg-white p-4 dark:border-neutral-900 dark:bg-black"
        style={{ paddingBottom: safeAreaInsets.bottom + 16 }}
      >
        <View className="flex-row items-center justify-center gap-4">
          <SkeletonBlock width="66%" height={42} rounded={999} />
          <SkeletonBlock width="33%" height={42} rounded={999} />
        </View>
      </View>
    </Animated.View>
  )
}
