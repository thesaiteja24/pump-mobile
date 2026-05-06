import React, { useEffect } from 'react'
import { useColorScheme, View, type DimensionValue, type ViewStyle } from 'react-native'
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

export default function ShimmerAnalyticsScreen() {
  return (
    <View className="flex-1">
      {/* MAIN CARD */}
      <View className="p-4">
        <View className="w-full rounded-3xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
          {/* title */}
          <SkeletonBlock width="45%" height={22} />

          <View className="mt-4 flex-row items-center justify-between">
            {/* chart circle */}
            <View className="flex-1 items-center justify-center">
              <SkeletonBlock width={110} height={110} rounded={55} />
            </View>

            {/* stats */}
            <View className="flex-1 gap-4">
              <View className="flex items-center">
                <SkeletonBlock width="40%" height={22} />
                <View className="mt-1" />
                <SkeletonBlock width="55%" height={14} />
              </View>

              <View className="flex items-center">
                <SkeletonBlock width="35%" height={22} />
                <View className="mt-1" />
                <SkeletonBlock width="50%" height={14} />
              </View>

              <View className="flex items-center">
                <SkeletonBlock width="38%" height={22} />
                <View className="mt-1" />
                <SkeletonBlock width="55%" height={14} />
              </View>
            </View>
          </View>
        </View>
      </View>

      {/* NUTRITION CARD */}
      <View className="p-4">
        <View className="rounded-2xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
          <View className="flex-row items-center justify-between">
            <SkeletonBlock width="45%" height={22} />
            <View className="flex-row gap-2">
              <SkeletonBlock width={70} height={26} rounded={13} />
              <SkeletonBlock width={70} height={26} rounded={13} />
            </View>
          </View>

          <View className="mt-6 flex-row justify-between">
            <View className="flex-1 items-center gap-2">
              <SkeletonBlock width={70} height={70} rounded={35} />
              <SkeletonBlock width="60%" height={14} />
            </View>

            <View className="flex-1 items-center gap-2">
              <SkeletonBlock width={70} height={70} rounded={35} />
              <SkeletonBlock width="60%" height={14} />
            </View>

            <View className="flex-1 items-center gap-2">
              <SkeletonBlock width={70} height={70} rounded={35} />
              <SkeletonBlock width="60%" height={14} />
            </View>
          </View>
        </View>
      </View>
    </View>
  )
}
