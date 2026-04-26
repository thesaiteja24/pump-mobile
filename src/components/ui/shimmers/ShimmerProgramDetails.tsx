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
import { SafeAreaView } from 'react-native-safe-area-context'

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
   Program Details Screen Skeleton (export)
────────────────────────────────────────────── */

export default function ShimmerProgramDetails() {
  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-black" edges={['bottom']}>
      <Animated.View entering={FadeInDown.duration(300).springify()} className="flex-1">
        <ScrollView contentContainerStyle={{ padding: 16 }} showsVerticalScrollIndicator={false}>
          {/* Header Section */}
          <View className="mb-2">
            <SkeletonBlock width="70%" height={36} rounded={8} />
          </View>
          <View className="mb-6">
            <SkeletonBlock width="90%" height={18} rounded={4} />
            <View className="mt-2" />
            <SkeletonBlock width="90%" height={18} rounded={4} />
            <View className="mt-2" />
            <SkeletonBlock width="90%" height={18} rounded={4} />
            <View className="mt-2" />
            <SkeletonBlock width="90%" height={18} rounded={4} />
            <View className="mt-2" />
            <SkeletonBlock width="40%" height={18} rounded={4} />
          </View>

          {/* Action Button */}
          <View className="mb-8">
            <SkeletonBlock width="100%" height={52} rounded={12} />
          </View>

          {/* Schedule Section Title */}
          <View className="mb-4">
            <SkeletonBlock width="50%" height={24} rounded={6} />
          </View>

          {/* Week 1 Placeholder */}
          <View className="mb-6">
            <View className="mb-3">
              <SkeletonBlock width="30%" height={20} rounded={6} />
            </View>
            <View className="gap-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <View
                  key={i}
                  className="flex-row items-center justify-between rounded-xl border border-neutral-200 bg-neutral-100 p-4 dark:border-neutral-800 dark:bg-neutral-900"
                >
                  <View className="flex-1">
                    <SkeletonBlock width="40%" height={18} rounded={4} />
                    <View className="mt-2" />
                    <SkeletonBlock width="30%" height={14} rounded={4} />
                  </View>
                  <SkeletonBlock width={24} height={24} rounded={12} />
                </View>
              ))}
            </View>
          </View>

          {/* Week 2 Placeholder */}
          <View className="mb-6">
            <View className="mb-3">
              <SkeletonBlock width="30%" height={20} rounded={6} />
            </View>
            <View className="gap-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <View
                  key={i}
                  className="flex-row items-center justify-between rounded-xl border border-neutral-200 bg-neutral-100 p-4 dark:border-neutral-800 dark:bg-neutral-900"
                >
                  <View className="flex-1">
                    <SkeletonBlock width="40%" height={18} rounded={4} />
                    <View className="mt-2" />
                    <SkeletonBlock width="30%" height={14} rounded={4} />
                  </View>
                  <SkeletonBlock width={24} height={24} rounded={12} />
                </View>
              ))}
            </View>
          </View>
        </ScrollView>
      </Animated.View>
    </SafeAreaView>
  )
}
