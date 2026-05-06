import React, { useEffect } from 'react'
import {
  ScrollView,
  useWindowDimensions,
  View,
  useColorScheme,
  type DimensionValue,
  type ViewStyle,
} from 'react-native'
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
   Home Screen Skeleton (export)
────────────────────────────────────────────── */

export default function ShimmerHomeScreen() {
  const { width } = useWindowDimensions()

  return (
    <Animated.View entering={FadeInDown.duration(300).springify()} className="flex-1">
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        <SkeletonStreakCard />

        {/* Habits */}
        <View className="mb-4">
          <SkeletonBlock width={100} height={28} rounded={6} />
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 10 }}
        >
          <View
            style={{ width: width * 0.5, height: width * 0.4 }}
            className="rounded-2xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900"
          >
            <SkeletonBlock width="60%" height={18} />
            <View className="mt-2">
              <SkeletonBlock width="40%" height={14} />
            </View>
            <View className="mt-auto">
              <SkeletonBlock width="100%" height={50} rounded={12} />
            </View>
          </View>

          <View
            style={{ width: width * 0.5, height: width * 0.4 }}
            className="items-center justify-center rounded-2xl border border-dashed border-neutral-300 bg-transparent px-4 py-4 dark:border-neutral-700"
          >
            <SkeletonBlock width="80%" height={40} rounded={12} />
          </View>
        </ScrollView>

        {/* Metrics */}
        <View className="my-4">
          <SkeletonBlock width={100} height={28} rounded={6} />
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 10 }}
        >
          <View
            style={{ width: width * 0.5, height: width * 0.4 }}
            className="rounded-2xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900"
          >
            <SkeletonBlock width="50%" height={18} />
            <View className="mt-auto">
              <SkeletonBlock width="100%" height={60} rounded={12} />
            </View>
          </View>

          <View
            style={{ width: width * 0.5, height: width * 0.4 }}
            className="rounded-2xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900"
          >
            <SkeletonBlock width="60%" height={18} />
            <View className="mt-4">
              <SkeletonBlock width="80%" height={24} />
            </View>
          </View>

          <View
            style={{ width: width * 0.5, height: width * 0.4 }}
            className="items-center justify-center rounded-2xl bg-transparent px-4 py-4"
          >
            <SkeletonBlock width="60%" height={40} rounded={12} />
          </View>
        </ScrollView>
      </ScrollView>
    </Animated.View>
  )
}
