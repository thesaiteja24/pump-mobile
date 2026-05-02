import { Button } from '@/components/ui/buttons/Button'
import { useUserProgram } from '@/hooks/queries/programs'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { router, useLocalSearchParams, useNavigation } from 'expo-router'
import React, { useEffect, useState } from 'react'
import {
  BackHandler,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
  useColorScheme,
  type DimensionValue,
  type ViewStyle,
} from 'react-native'
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated'
import Toast from 'react-native-toast-message'

import {
  WorkoutDetailsModal,
  WorkoutDetailsModalHandle,
} from '@/components/workouts/modals/WorkoutDetailsModal'
import ShimmerProgramDetails from '@/components/ui/shimmers/ShimmerProgramDetails'
import { useWorkoutEditor } from '@/stores/workout-editor.store'

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

function ShimmerDaysList({ count = 6 }: { count?: number }) {
  return (
    <View className="gap-3">
      {Array.from({ length: count }).map((_, i) => (
        <View
          key={i}
          className="flex-row items-center justify-between rounded-2xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900"
        >
          <View className="flex-1">
            <SkeletonBlock width="55%" height={18} rounded={6} />
            <View className="mt-2" />
            <SkeletonBlock width="40%" height={14} rounded={6} />
          </View>
          <SkeletonBlock width={40} height={40} rounded={999} />
        </View>
      ))}
    </View>
  )
}

export default function UserProgramDashboard() {
  const params = useLocalSearchParams()
  const navigation = useNavigation()
  const userProgramId = params.id as string

  const initiateWorkout = useWorkoutEditor((s) => s.initiateWorkout)

  // Track the week requested from the API separately from the week highlighted in the UI.
  const [requestedWeekIndex, setRequestedWeekIndex] = useState<number | null>(null)
  const [highlightedWeekIndex, setHighlightedWeekIndex] = useState<number | null>(null)

  const {
    data: userProgram,
    isLoading,
    isFetching,
  } = useUserProgram(userProgramId, requestedWeekIndex ?? undefined)
  const workoutDetailsModalRef = React.useRef<WorkoutDetailsModalHandle>(null)

  const getStatusColor = () => {
    switch (userProgram?.status) {
      case 'active':
        return 'blue'
      case 'completed':
        return 'green'
      case 'paused':
        return 'yellow'
      case 'cancelled':
        return 'red'
      default:
        return 'neutral'
    }
  }

  const statusColor = getStatusColor()

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

  // Set initial week index once data arrives
  useEffect(() => {
    if (userProgram && highlightedWeekIndex === null) {
      setHighlightedWeekIndex(userProgram.progress.currentWeek)
    }
  }, [userProgram, highlightedWeekIndex])

  useEffect(() => {
    if (userProgram) {
      navigation.setOptions({
        title: userProgram.status === 'active' ? 'Active Program' : 'Program Details',
        rightIcons: [
          {
            name: 'settings-outline',
            onPress: () => Toast.show({ type: 'info', text1: 'Program settings coming soon' }),
            color: '#6366f1',
          },
        ],
      })
    }
  }, [navigation, userProgram])

  if (isLoading && !userProgram) {
    return <ShimmerProgramDetails />
  }

  if (!userProgram) {
    return (
      <View className="flex-1 items-center justify-center bg-white dark:bg-black">
        <Text className="text-neutral-500">Program not found.</Text>
        <Button title="Go Back" onPress={() => router.back()} className="mt-4" />
      </View>
    )
  }

  const currentWeekData = userProgram.weeks?.[0] // Backend returns requested week at index 0
  const activeWeekIndex = requestedWeekIndex ?? userProgram.progress.currentWeek
  const isWeekSwitchLoading = Boolean(requestedWeekIndex !== null && isFetching)
  const progressPercent = Math.round(
    ((userProgram.progress.currentWeek * 7 + userProgram.progress.currentDay) /
      (userProgram.durationWeeks * 7)) *
      100,
  )
  const todayDay = currentWeekData?.days.find(
    (d) =>
      userProgram.progress.currentWeek === activeWeekIndex &&
      d.dayIndex === userProgram.progress.currentDay,
  )
  const isRestDay = todayDay?.isRestDay
  const hasWorkout = !!todayDay?.templateSnapshot

  return (
    <View className="relative flex-1 bg-white dark:bg-black">
      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Section */}
        <View className="mb-6">
          <Text className="text-3xl font-bold text-black dark:text-white">
            {userProgram.program.title}
          </Text>
          <View className="mt-2 flex-row items-center gap-2">
            {/* Status Badge */}
            <View
              className={`rounded-full px-2 py-1 bg-${statusColor}-100 dark:bg-${statusColor}-900/40`}
            >
              <Text
                className={`text-sm capitalize text-${statusColor}-600 dark:text-${statusColor}-400`}
              >
                {userProgram.status}
              </Text>
            </View>
            <Text className="text-neutral-500">
              Week {userProgram.progress.currentWeek + 1} • Day{' '}
              {userProgram.progress.currentDay + 1}
            </Text>
          </View>
        </View>

        {/* Progress Stats */}
        <View className="mb-8 rounded-2xl bg-neutral-50 p-4 dark:bg-neutral-900">
          <View className="mb-2 flex-row items-center justify-between">
            <Text className="font-semibold text-black dark:text-white">Overall Progress</Text>
            <Text className="font-bold text-indigo-600">{progressPercent}%</Text>
          </View>
          <View className="h-2 w-full overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-800">
            <View className="h-full bg-indigo-600" style={{ width: `${progressPercent}%` }} />
          </View>
        </View>

        {/* Week Selector */}
        <View className="mb-4">
          <Text className="mb-3 text-lg font-bold text-black dark:text-white">
            Schedule Overview
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row gap-2">
            {Array.from({ length: userProgram.durationWeeks }).map((_, i) => (
              <TouchableOpacity
                key={i}
                onPress={() => {
                  setRequestedWeekIndex(i)
                  setHighlightedWeekIndex(i)
                }}
                className={`mr-2 rounded-xl px-4 py-2 ${
                  highlightedWeekIndex === i
                    ? 'bg-indigo-600'
                    : 'bg-neutral-100 dark:bg-neutral-800'
                }`}
              >
                <Text
                  className={`font-semibold ${
                    highlightedWeekIndex === i ? 'text-white' : 'text-neutral-500'
                  }`}
                >
                  Week {i + 1}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Daily Schedule */}
        {isWeekSwitchLoading ? (
          <ShimmerDaysList count={Math.max(4, currentWeekData?.days?.length ?? 6)} />
        ) : (
          <View className="gap-3">
            {currentWeekData?.days.map((day) => {
              const isToday =
                userProgram.progress.currentWeek === activeWeekIndex &&
                userProgram.progress.currentDay === day.dayIndex

              const isFuture =
                activeWeekIndex > userProgram.progress.currentWeek ||
                (activeWeekIndex === userProgram.progress.currentWeek &&
                  day.dayIndex > userProgram.progress.currentDay)

              const isCompleted = day.completed

              return (
                <TouchableOpacity
                  key={day.id}
                  activeOpacity={0.7}
                  onPress={() =>
                    workoutDetailsModalRef.current?.present(
                      day,
                      isToday && !day.isRestDay && !isCompleted,
                    )
                  }
                  className={`flex-row items-center justify-between rounded-2xl border p-4 ${
                    isToday
                      ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/10'
                      : isFuture
                        ? 'border-neutral-100 bg-neutral-50/50 opacity-60 dark:border-neutral-900 dark:bg-neutral-950'
                        : 'border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900'
                  }`}
                >
                  <View className="flex-1">
                    <View className="flex-row items-center gap-2">
                      <Text className="text-lg font-semibold text-black dark:text-white">
                        {day.name}
                      </Text>
                      {isToday && (
                        <View className="rounded-full bg-indigo-600 px-2 py-0.5">
                          <Text className="text-[10px] font-bold text-white">UP NEXT</Text>
                        </View>
                      )}
                      {isCompleted && (
                        <View className="rounded-full bg-emerald-100 px-2 py-0.5 dark:bg-emerald-900/30">
                          <Text className="text-[10px] font-bold text-emerald-600">DONE</Text>
                        </View>
                      )}
                    </View>
                    {day.isRestDay ? (
                      <Text className="mt-1 text-sm font-medium text-emerald-500">Rest Day</Text>
                    ) : (
                      <Text className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
                        {day.templateSnapshot?.title || 'No Workout Assigned'}
                      </Text>
                    )}
                  </View>
                  <View
                    className={`h-10 w-10 items-center justify-center rounded-full ${
                      isCompleted
                        ? 'bg-emerald-100 dark:bg-emerald-900/30'
                        : 'bg-neutral-100 dark:bg-neutral-800'
                    }`}
                  >
                    <MaterialCommunityIcons
                      name={
                        isCompleted
                          ? 'check-circle'
                          : isFuture
                            ? 'lock-outline'
                            : day.isRestDay
                              ? 'coffee-outline'
                              : 'arm-flex-outline'
                      }
                      size={isCompleted ? 24 : 20}
                      color={isCompleted ? '#059669' : isToday ? '#6366f1' : '#9ca3af'}
                    />
                  </View>
                </TouchableOpacity>
              )
            })}
          </View>
        )}
      </ScrollView>

      <View className="absolute bottom-0 left-0 right-0 bg-transparent p-4 flex items-center">
        {
          <Button
            title={
              isRestDay
                ? 'View Rest Day'
                : hasWorkout
                  ? "Start Today's Workout"
                  : 'No Workout Today'
            }
            variant="primary"
            className="mb-4 rounded-full"
            onPress={() => {
              if (!todayDay) return

              if (isRestDay) {
                workoutDetailsModalRef.current?.present(todayDay, false)
              } else if (todayDay.templateSnapshot) {
                initiateWorkout({
                  mode: 'program-workout',
                  userProgramDayId: todayDay.id,
                  templateSnapshot: todayDay.templateSnapshot,
                })
                router.push('/(app)/workout/start')
              } else {
                initiateWorkout()
                router.push('/(app)/workout/start')
              }
            }}
          />
        }
      </View>
      <WorkoutDetailsModal
        ref={workoutDetailsModalRef}
        onStartWorkout={(day) => {
          if (day.templateSnapshot) {
            initiateWorkout({
              mode: 'program-workout',
              userProgramDayId: day.id,
              templateSnapshot: day.templateSnapshot,
            })
          }
        }}
      />
    </View>
  )
}
