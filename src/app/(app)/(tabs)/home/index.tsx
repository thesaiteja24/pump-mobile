import { Ionicons } from '@expo/vector-icons'
import { useQueryClient } from '@tanstack/react-query'
import { format } from 'date-fns'
import { useRouter } from 'expo-router'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { RefreshControl, ScrollView, Text, useWindowDimensions, View } from 'react-native'
import Animated, { FadeInDown } from 'react-native-reanimated'

import { HabitCard } from '@/components/habit/HabitCard'
import { BaseEmptyState, Button, SectionHeader } from '@/components/ui'
import BaseScreen from '@/components/ui/BaseScreen'
import { HomeScreenShimmer } from '@/components/ui/shimmers'
import { TopLifts } from '@/components/user'
import { StreakDay, UserStreakCard } from '@/components/user/UserStreakCard'
import {
  WeeklyDurationCard,
  WeeklyRepsCard,
  WeeklyVolumeCard,
} from '@/components/user/UserTrainingMetricCards'
import { UserWeightMetricCard } from '@/components/user/UserWeightMetricCard'
import { useAskNotificationPermission } from '@/hooks/notifications/useAskNotificationPermission'
import { useHabitLogsQuery, useHabitsQuery } from '@/hooks/queries/habits'
import { useMeasurementsQuery, useProfileQuery, useUserAnalyticsQuery } from '@/hooks/queries/me'
import { useUserTopLiftsQuery } from '@/hooks/queries/usePublicUser'
import { useUnitConverter } from '@/hooks/useUnitConverter'
import { Arise } from '@/lib/arise'
import { queryKeys } from '@/lib/queryKeys'
import { listWorkoutsService } from '@/services/workouts.service'
import { SelfUser } from '@/types/me'
import {
  calculateBMI,
  calculateBodyFat,
  calculateComposition,
  estimateBodyFatFromBMI,
} from '@/utils/analytics'
import { getMotivationLine } from '@/utils/motivation'

export default function HomeScreen() {
  const router = useRouter()
  const { data: userData } = useProfileQuery()
  const user = userData as SelfUser | null

  // TanStack Query — analytics (auto-fetches on mount, syncs into Zustand)
  const {
    data: measurements,
    refetch: refetchMeasurements,
    isLoading: isLoadingMeasurements,
  } = useMeasurementsQuery()
  const {
    data: userAnalytics,
    refetch: refetchUserAnalytics,
    isLoading: isLoadingUserAnalytics,
  } = useUserAnalyticsQuery()
  const { data: topLifts = [], isLoading: isTopLiftsLoading } = useUserTopLiftsQuery(user?.id!, 10)

  const qc = useQueryClient()

  useEffect(() => {
    const fetchFullHistory = async () => {
      // Only prefetch if we don't have any cached data yet
      const cachedData = qc.getQueryData(queryKeys.workouts.all)
      if (cachedData || !user?.id) return

      try {
        const allPages: { workouts: any[]; meta: any }[] = []
        const allParams: number[] = []
        let currentPage = 1
        let hasMore = true

        // Fetch until we have everything (with a safety cap of 20 pages / 1000 workouts)
        while (hasMore && currentPage <= 20) {
          const data = await listWorkoutsService(currentPage, 50, user.id)
          allPages.push({ workouts: data.workouts || [], meta: data.meta })
          allParams.push(currentPage)
          hasMore = data.meta.hasMore
          currentPage++
        }

        // Manually seed the infinite query cache
        qc.setQueryData(queryKeys.workouts.all, {
          pages: allPages,
          pageParams: allParams,
        })
      } catch (error) {
        console.error('Failed to prefetch full workout history:', error)
      }
    }

    fetchFullHistory()
  }, [qc, user?.id])

  const latestMeasurements = measurements?.latestValues

  // Habits from TanStack Query
  const { data: habits = [], refetch: refetchHabits, isLoading: isLoadingHabits } = useHabitsQuery()
  const { refetch: refetchHabitLogs, isLoading: isLoadingHabitLogs } = useHabitLogsQuery()

  const { formatWeight } = useUnitConverter()

  const age = useMemo(() => {
    if (!user?.dateOfBirth) return 25 // fallback
    return new Date().getFullYear() - new Date(user.dateOfBirth).getFullYear()
  }, [user?.dateOfBirth])

  const [refreshing, setRefreshing] = useState(false)

  // All values from store are in backend canonical units (kg / cm)
  const weightKg = Number(latestMeasurements?.weight ?? user?.weight) // kg
  const heightCm = Number(user?.height) // cm
  const gender = user?.gender
  const neckCm = Number(latestMeasurements?.neck) // cm
  const waistCm = Number(latestMeasurements?.waist) // cm
  const hipsCm = Number(latestMeasurements?.hips) // cm

  const { width } = useWindowDimensions()

  // ───────────────── Analytics ─────────────────

  const {
    streakDays = 0,
    workoutsThisWeek = 0,
    daysSinceLastWorkout = 0,
    weeklyVolume = 0,
    lastWeekVolume = 0,
    weeklyDuration = 0,
    lastWeekDuration = 0,
    weeklyReps = 0,
    lastWeekReps = 0,
    workoutDates: workoutDatesArray = [],
  } = userAnalytics || {}

  const workoutDates = useMemo(
    () => new Set(Array.isArray(workoutDatesArray) ? workoutDatesArray : []),
    [workoutDatesArray],
  )

  const { streakData } = useMemo(() => {
    const today = new Date()
    const todayKey = format(today, 'yyyy-MM-dd')

    const start = new Date(today)
    start.setDate(today.getDate() - 3)

    const end = new Date(today)
    end.setDate(today.getDate() + 3)

    const days: StreakDay[] = []
    const cursor = new Date(start)

    while (cursor <= end) {
      const key = format(cursor, 'yyyy-MM-dd')
      let status: StreakDay['status']

      if (workoutDates?.has?.(key)) status = 'active'
      else if (key === todayKey) status = 'today'
      else if (cursor > today) status = 'future'
      else status = 'missed'

      days.push({ date: key, status })
      cursor.setDate(cursor.getDate() + 1)
    }

    const motivationLine = getMotivationLine({
      weeklyVolume,
      lastWeekVolume,
      streakDays,
      workoutsThisWeek,
      daysSinceLastWorkout,
    })

    return {
      streakData: {
        monthLabel: today.toLocaleDateString('en-US', {
          month: 'long',
          year: 'numeric',
        }),
        days,
        message: motivationLine.text,
      },
    }
  }, [
    streakDays,
    workoutsThisWeek,
    daysSinceLastWorkout,
    weeklyVolume,
    lastWeekVolume,
    workoutDates,
  ])

  const composition = useMemo(() => {
    if (!weightKg || !heightCm || !gender) return null

    let bodyFat: number | null = null

    if (neckCm && waistCm) {
      bodyFat = calculateBodyFat({
        gender,
        height: heightCm,
        neck: neckCm,
        waist: waistCm,
        hips: hipsCm ? hipsCm : undefined,
      })
    } else {
      bodyFat = estimateBodyFatFromBMI({
        gender,
        height: heightCm,
        weight: weightKg,
        age,
      })
    }

    if (!bodyFat) return null

    // calculateComposition expects weight in kg (backend unit)
    const { fatMass: fatMassKg, leanMass: leanMassKg } = calculateComposition({
      weight: weightKg,
      bodyFat,
    }) ?? { fatMass: null, leanMass: null }

    if (fatMassKg == null || leanMassKg == null) return null

    const bmi = calculateBMI(weightKg, heightCm)

    // Convert fat/lean mass to user's preferred unit for display
    const fatMass = formatWeight(fatMassKg)
    const leanMass = formatWeight(leanMassKg)

    return { bodyFat, fatMass, leanMass, bmi }
  }, [weightKg, heightCm, gender, neckCm, waistCm, hipsCm, age, formatWeight])

  // ───────────────── Refresh ─────────────────
  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    await Promise.all([
      refetchMeasurements(),
      refetchUserAnalytics(),
      refetchHabits(),
      refetchHabitLogs(),
    ])
    setRefreshing(false)
  }, [refetchMeasurements, refetchUserAnalytics, refetchHabits, refetchHabitLogs])

  const isFullyLoaded =
    !isLoadingMeasurements &&
    !isLoadingUserAnalytics &&
    !isLoadingHabits &&
    !isLoadingHabitLogs &&
    !refreshing

  const [hasFinishedAnimations, setHasFinishedAnimations] = useState(false)

  useEffect(() => {
    if (isFullyLoaded) {
      const timer = setTimeout(() => {
        setHasFinishedAnimations(true)
      }, 1500) // Wait for the longest FadeInDown (delay 900ms + duration 500ms) plus a small buffer
      return () => clearTimeout(timer)
    } else {
      setHasFinishedAnimations(false)
    }
  }, [isFullyLoaded])

  useAskNotificationPermission(isFullyLoaded && hasFinishedAnimations)

  const title = useMemo(() => {
    const hours = new Date().getHours()
    if (hours < 12)
      return `Good Morning, ${user?.firstName ? `${user.firstName.split(' ').at(-1)}` : ''}!`
    if (hours < 18)
      return `Good Afternoon, ${user?.firstName ? `${user.firstName.split(' ').at(-1)}` : ''}!`
    return `Good Evening, ${user?.firstName ? `${user.firstName.split(' ').at(-1)}` : ''}!`
  }, [user?.firstName])

  const subTitle = useMemo(() => {
    return `Ready to get pumped?`
  }, [])

  const isScreenLoading =
    refreshing ||
    isLoadingMeasurements ||
    isLoadingUserAnalytics ||
    isLoadingHabits ||
    isLoadingHabitLogs

  // ───────────────── Render ─────────────────
  return (
    <BaseScreen
      title={title}
      subTitle={subTitle}
      scroll
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      contentContainerStyle={{ paddingBottom: '50%' }}
      isLoading={isScreenLoading}
      shimmer={<HomeScreenShimmer />}
    >
      <UserStreakCard {...streakData} />

      <Animated.View entering={FadeInDown.delay(600).duration(500)}>
        <SectionHeader title="Habits" className="mb-4" />
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(700).duration(500)}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 10, paddingRight: 20 }}
        >
          {habits.map((habit) => (
            <HabitCard key={habit.id} habit={habit} />
          ))}

          <View
            style={{ width: width * 0.5, height: width * 0.4 }}
            className="flex items-center justify-center rounded-2xl border border-dashed border-neutral-300 bg-transparent px-4 py-4 dark:border-neutral-700"
          >
            <Button
              title="Track New Habit"
              onPress={() => {
                router.push('/habit')
              }}
              variant="outline"
              textClassName="text-sm"
            />
          </View>
        </ScrollView>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(800).duration(500)}>
        <SectionHeader title="Metrics" className="my-4" />
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(900).duration(500)}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 10, paddingRight: 20 }}
        >
          <UserWeightMetricCard width={width * 0.5} />
          <View
            style={{ width: width * 0.5, height: width * 0.4 }}
            className="flex flex-col justify-between rounded-2xl border border-neutral-200 bg-white p-2 px-4 dark:border-neutral-800 dark:bg-neutral-900"
          >
            <Text className="text-base font-medium text-neutral-600 dark:text-neutral-400">
              Body Fat
            </Text>
            <Text className="text-base font-semibold text-black dark:text-white">
              {composition?.bodyFat.toFixed(1)}%
            </Text>
          </View>

          <View
            style={{ width: width * 0.5 }}
            className="flex items-center justify-center rounded-2xl border border-dashed border-neutral-300 bg-transparent px-4 py-4 dark:border-neutral-700"
          >
            <Button
              title="View All"
              onPress={() => {
                Arise.info({ heading: 'Coming Soon' })
              }}
              variant="outline"
              textClassName="text-sm"
            />
          </View>
        </ScrollView>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(800).duration(500)}>
        <SectionHeader title="Training" className="my-4" />
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(900).duration(500)}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 10, paddingRight: 20 }}
        >
          <WeeklyVolumeCard
            volume={weeklyVolume}
            lastWeekVolume={lastWeekVolume}
            width={width * 0.5}
          />
          <WeeklyDurationCard
            duration={weeklyDuration}
            lastWeekDuration={lastWeekDuration}
            width={width * 0.5}
          />
          <WeeklyRepsCard reps={weeklyReps} lastWeekReps={lastWeekReps} width={width * 0.5} />

          <View
            style={{ width: width * 0.5 }}
            className="flex items-center justify-center rounded-2xl border border-dashed border-neutral-300 bg-transparent px-4 py-4 dark:border-neutral-700"
          >
            <Button
              title="View Trends"
              onPress={() => {
                router.push('/(app)/analytics')
              }}
              variant="outline"
              textClassName="text-sm"
            />
          </View>
        </ScrollView>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(800).duration(500)}>
        <SectionHeader title="Top Lifts" className="my-4" />
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(900).duration(500)} className="mb-12">
        {topLifts.length > 0 ? (
          <TopLifts lifts={topLifts} isLoading={isTopLiftsLoading} showTitle={false} />
        ) : (
          <BaseEmptyState
            message="No Personal Records Yet"
            description="Finish your first workout to start tracking your strongest lifts here."
            actionLabel="Start Your First Workout"
            onActionPress={() => router.push('/(app)/(tabs)/workout')}
            icon={
              <View className="h-16 w-16 items-center justify-center rounded-full bg-neutral-100 dark:bg-neutral-800">
                <Ionicons name="trophy-outline" size={32} color="#A3A3A3" />
              </View>
            }
            dashed={false}
            className="bg-neutral-50/50 dark:bg-neutral-900/50"
          />
        )}
      </Animated.View>
    </BaseScreen>
  )
}
