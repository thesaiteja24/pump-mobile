import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { ActivityIndicator, FlatList, RefreshControl, Text, View } from 'react-native'
import Animated, { Easing, useAnimatedStyle, useSharedValue, withDelay, withTiming } from 'react-native-reanimated'
import { SafeAreaView } from 'react-native-safe-area-context'

import StreakCard, { StreakDay } from '@/components/home/StreakCard'
import WorkoutCard from '@/components/home/WorkoutCard'

import ShimmerHomeScreen from '@/components/home/ShimmerHomeScreen'
import { useAnalytics } from '@/hooks/useAnalytics'
import { useThemeColor } from '@/hooks/useThemeColor'
import { useAuth } from '@/stores/authStore'
import { ExerciseType, useExercise } from '@/stores/exerciseStore'
import { useUser } from '@/stores/userStore'
import { useWorkout, WorkoutHistoryItem } from '@/stores/workoutStore'
import { getMotivationLine } from '@/utils/motivation'
import { getGreeting, toDateKey } from '@/utils/time'

export default function HomeScreen() {
	const colors = useThemeColor()

	// ───────────────── Stores ─────────────────
	const user = useAuth(s => s.user)
	const getUserData = useUser(s => s.getUserData)

	const workoutHistory = useWorkout(s => s.workoutHistory)
	const workoutLoading = useWorkout(s => s.workoutLoading)
	const getAllWorkouts = useWorkout(s => s.getAllWorkouts)

	const exerciseList = useExercise(s => s.exerciseList)
	const getAllExercises = useExercise(s => s.getAllExercises)

	const workoutPage = useWorkout(s => s.workoutPage)
	const workoutHasMore = useWorkout(s => s.workoutHasMore)

	const [refreshing, setRefreshing] = useState(false)

	// ───────────────── Derived UI state ─────────────────
	const hasExercises = exerciseList.length > 0
	const showShimmer = refreshing || !hasExercises || (workoutLoading && workoutHistory.length === 0)

	// ───────────────── Derived data ─────────────────
	const exerciseTypeMap = useMemo(() => {
		const map = new Map<string, ExerciseType>()
		exerciseList.forEach(ex => map.set(ex.id, ex.exerciseType))
		return map
	}, [exerciseList])

	type ListItem = { type: 'section-header' } | { type: 'workout'; workout: WorkoutHistoryItem }

	const listData: ListItem[] = useMemo(() => {
		if (showShimmer) return []
		if (workoutHistory.length === 0) return []

		return [{ type: 'section-header' }, ...workoutHistory.map(w => ({ type: 'workout' as const, workout: w }))]
	}, [workoutHistory, showShimmer])

	// ───────────────── Analytics & Motivation ─────────────────
	const { userAnalytics } = useAnalytics()
	const { streakDays, workoutsThisWeek, daysSinceLastWorkout, weeklyVolume, lastWeekVolume, workoutDates } =
		userAnalytics

	const { streakData } = useMemo(() => {
		const today = new Date()
		const todayKey = toDateKey(today)

		const start = new Date(today)
		start.setDate(today.getDate() - 3)

		const end = new Date(today)
		end.setDate(today.getDate() + 3)

		const days: StreakDay[] = []
		const cursor = new Date(start)

		while (cursor <= end) {
			const key = toDateKey(cursor)
			let status: StreakDay['status']

			if (workoutDates.has(key)) status = 'active'
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
	}, [streakDays, workoutsThisWeek, daysSinceLastWorkout, weeklyVolume, lastWeekVolume, workoutDates])

	// ───────────────── Refresh ─────────────────
	const onRefresh = useCallback(async () => {
		try {
			setRefreshing(true)

			await Promise.all([getAllWorkouts(1)])

			if (!exerciseList.length) {
				await getAllExercises()
			}
		} finally {
			setRefreshing(false)
		}
	}, [getAllWorkouts, getAllExercises, exerciseList.length])

	const fetchNextPage = useCallback(() => {
		if (!workoutLoading && workoutHasMore && workoutPage) {
			getAllWorkouts(workoutPage + 1)
		}
	}, [workoutLoading, workoutHasMore, workoutPage, getAllWorkouts])

	// ───────────────── Header animation ─────────────────
	const headerOpacity = useSharedValue(0)
	const headerTranslateY = useSharedValue(-20)

	// Header Animation
	useEffect(() => {
		headerOpacity.value = withTiming(1, { duration: 800 })
		headerTranslateY.value = withTiming(0, {
			duration: 800,
			easing: Easing.out(Easing.exp),
		})
	}, [headerOpacity, headerTranslateY])

	const headerAnimatedStyle = useAnimatedStyle(() => ({
		opacity: headerOpacity.value,
		transform: [{ translateY: headerTranslateY.value }],
	}))

	useEffect(() => {
		Promise.all([getAllWorkouts(1), getAllExercises(), getUserData(user?.userId ?? '')])
	}, [getAllWorkouts, getAllExercises, getUserData, user?.userId])

	// ───────────────── Render ─────────────────
	return (
		<SafeAreaView className="flex-1 bg-white px-4 pt-4 dark:bg-black" edges={['top']}>
			{/* Header */}
			<Animated.View style={headerAnimatedStyle} className="mb-4">
				<Text numberOfLines={1} className="text-2xl font-semibold text-black dark:text-white">
					{getGreeting()}
					{user?.firstName ? `, ${user.firstName.split(' ').at(-1)}` : ''}!
				</Text>
				<Text className="text-base font-normal text-neutral-600 dark:text-neutral-400">
					Ready to get pumped?
				</Text>
			</Animated.View>

			{showShimmer ? (
				<ShimmerHomeScreen />
			) : (
				<FlatList
					data={listData}
					keyExtractor={(item, index) =>
						item.type === 'section-header' ? `section-header-${index}` : item.workout.clientId
					}
					renderItem={({ item, index }) => {
						if (item.type === 'section-header') return <SectionHeader />

						return <WorkoutCard workout={item.workout} exerciseTypeMap={exerciseTypeMap} index={index} />
					}}
					ListHeaderComponent={<StreakCard {...streakData} />}
					stickyHeaderIndices={listData.length > 0 ? [1] : []}
					showsVerticalScrollIndicator={false}
					refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
					onEndReached={fetchNextPage}
					onEndReachedThreshold={0.5}
					ListFooterComponent={
						<View className="mb-[20%] items-center justify-center p-4 pb-12 pt-6">
							{workoutLoading && workoutPage && workoutPage > 1 && (
								<ActivityIndicator size="small" color={colors.primary} />
							)}
						</View>
					}
				/>
			)}
		</SafeAreaView>
	)
}

function SectionHeader() {
	const opacity = useSharedValue(0)
	const translateY = useSharedValue(20)

	useEffect(() => {
		opacity.value = withDelay(500, withTiming(1, { duration: 500 }))
		translateY.value = withDelay(500, withTiming(0, { duration: 500, easing: Easing.out(Easing.quad) }))
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
