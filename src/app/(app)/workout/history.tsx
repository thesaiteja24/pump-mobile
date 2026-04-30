import WorkoutCard from '@/components/engagement/WorkoutCard'
import { useExercises } from '@/hooks/queries/exercises'
import { useUserWorkoutHistoryQuery } from '@/hooks/queries/workouts'
import { useThemeColor } from '@/hooks/theme'
import { ExerciseType } from '@/types/exercises'
import { WorkoutHistoryItem } from '@/types/workouts'
import { useRouter } from 'expo-router'
import { useCallback, useEffect, useMemo } from 'react'
import {
  ActivityIndicator,
  BackHandler,
  DimensionValue,
  FlatList,
  RefreshControl,
  Text,
  useColorScheme,
  View,
  ViewStyle,
} from 'react-native'
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
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
      {[0, 1, 2].map((i) => (
        <View key={i} className="mb-2 flex-row items-center gap-3">
          <SkeletonBlock width={44} height={44} rounded={999} />
          <SkeletonBlock width="70%" height={16} />
        </View>
      ))}
    </View>
  )
}

function SectionHeader() {
  const opacity = useSharedValue(0)
  const translateY = useSharedValue(20)

  useEffect(() => {
    opacity.value = withDelay(500, withTiming(1, { duration: 500 }))
    translateY.value = withDelay(
      500,
      withTiming(0, { duration: 500, easing: Easing.out(Easing.quad) }),
    )
  }, [opacity, translateY])

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }))

  return (
    <Animated.View
      style={style}
      className="mb-4 border-b border-neutral-200 bg-white dark:border-neutral-800 dark:bg-black"
    >
      <Text className="mb-2 text-xl font-semibold text-black dark:text-white">Your Workouts</Text>
    </Animated.View>
  )
}

const History = () => {
  const router = useRouter()
  const colors = useThemeColor()

  // TanStack Query — infinite pagination with offline-first pending merge
  const {
    workoutHistory,
    hasMore: workoutHasMore,
    isFetching: workoutLoading,
    fetchNextPage,
    refetch: refetchHistory,
  } = useUserWorkoutHistoryQuery()

  const { data: exerciseList = [] } = useExercises()

  const showShimmer = workoutLoading && workoutHistory.length === 0

  const exerciseTypeMap = useMemo(() => {
    const map = new Map<string, ExerciseType>()
    exerciseList.forEach((ex) => map.set(ex.id, ex.exerciseType))
    return map
  }, [exerciseList])

  type ListItem = { type: 'section-header' } | { type: 'workout'; workout: WorkoutHistoryItem }

  const listData: ListItem[] = useMemo(() => {
    if (showShimmer) return []
    if (workoutHistory.length === 0) return []

    return [
      { type: 'section-header' },
      ...workoutHistory.map((w) => ({ type: 'workout' as const, workout: w })),
    ]
  }, [workoutHistory, showShimmer])

  const onRefresh = useCallback(async () => {
    await refetchHistory()
  }, [refetchHistory])

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
    <View className="flex-1 bg-white px-4 pt-4 dark:bg-black">
      {showShimmer ? (
        <View className="flex-1">
          <SkeletonBlock width={200} height={32} rounded={8} />
          <View className="mt-8">
            {Array.from({ length: 3 }).map((_, i) => (
              <SkeletonWorkoutCard key={i} />
            ))}
          </View>
        </View>
      ) : (
        <FlatList
          data={listData}
          keyExtractor={(item, index) =>
            item.type === 'section-header' ? `section-header-${index}` : item.workout.id
          }
          renderItem={({ item, index }) => {
            if (item.type === 'section-header') return <SectionHeader />
            return (
              <WorkoutCard workout={item.workout} exerciseTypeMap={exerciseTypeMap} index={index} />
            )
          }}
          stickyHeaderIndices={listData.length > 0 ? [0] : []}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={workoutLoading} onRefresh={onRefresh} />}
          onEndReached={() => {
            if (!workoutLoading && workoutHasMore) fetchNextPage()
          }}
          onEndReachedThreshold={0.5}
          ListFooterComponent={
            <View className="mb-[20%] items-center justify-center p-4 pb-12 pt-6">
              {workoutLoading && workoutHistory.length > 0 && (
                <ActivityIndicator size="small" color={colors.primary} />
              )}
            </View>
          }
          ListEmptyComponent={
            !workoutLoading ? (
              <View className="flex-1 items-center justify-center pt-20">
                <Text className="text-lg text-neutral-500 dark:text-neutral-400">
                  No workouts yet.
                </Text>
              </View>
            ) : null
          }
        />
      )}
    </View>
  )
}

export default History
