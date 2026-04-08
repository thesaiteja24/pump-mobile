import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { RefreshControl, ScrollView, Text, useWindowDimensions, View } from 'react-native'
import Animated, { Easing, FadeInDown, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated'
import { SafeAreaView } from 'react-native-safe-area-context'

import ShimmerHomeScreen from '@/components/home/ShimmerHomeScreen'
import StreakCard, { StreakDay } from '@/components/home/StreakCard'

import { HabitCard } from '@/components/home/HabitCard'
import { useAuth } from '@/stores/authStore'
import { useHabitStore } from '@/stores/habitStore'
import { useUser } from '@/stores/userStore'
import { router } from 'expo-router'

import { WeightMetricCard } from '@/components/home/WeightMetricCard'
import { Button } from '@/components/ui/Button'
import { useAnalytics } from '@/stores/analyticsStore'
import { calculateBMI, calculateBodyFat, calculateComposition, estimateBodyFatFromBMI } from '@/utils/analytics'
import { convertWeight } from '@/utils/converter'
import { getMotivationLine } from '@/utils/motivation'
import { getGreeting, toDateKey } from '@/utils/time'
import Toast from 'react-native-toast-message'

export default function HomeScreen() {
	// ───────────────── Stores ─────────────────
	const user = useAuth(s => s.user)
	const getUserData = useUser(s => s.getUserData)

	const getMeasurements = useAnalytics(s => s.getMeasurements)
	const getUserAnalytics = useAnalytics(s => s.getUserAnalytics)
	const userAnalytics = useAnalytics(s => s.userAnalytics)
	const latestMeasurements = useAnalytics(state => state.latestMeasurements)

	const { habits, getHabits, getHabitLogs, preSeedDefaultHabits } = useHabitStore()

	const preferredWeightUnit = user?.preferredWeightUnit ?? 'kg'
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
		workoutDates = new Set<string>(),
	} = userAnalytics || {}

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
		const fatMass = convertWeight(fatMassKg, { from: 'kg', to: preferredWeightUnit })
		const leanMass = convertWeight(leanMassKg, { from: 'kg', to: preferredWeightUnit })

		return { bodyFat, fatMass, leanMass, bmi }
	}, [weightKg, heightCm, gender, neckCm, waistCm, hipsCm, preferredWeightUnit, age])

	// ───────────────── Refresh ─────────────────
	const onRefresh = useCallback(async () => {
		try {
			setRefreshing(true)
			await Promise.all([
				getUserData(user?.userId ?? ''),
				getMeasurements(),
				getUserAnalytics(),
				getHabits(),
				getHabitLogs(),
			])
		} finally {
			setRefreshing(false)
		}
	}, [getUserData, getMeasurements, getUserAnalytics, getHabits, getHabitLogs, user?.userId])

	// ───────────────── Header animation ─────────────────
	const headerOpacity = useSharedValue(0)
	const headerTranslateY = useSharedValue(-20)

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

	// ───────────────── Initial Fetch ─────────────────
	useEffect(() => {
		Promise.all([
			getUserData(user?.userId ?? ''),
			getMeasurements(),
			getUserAnalytics(),
			getHabits().then(res => {
				if (res.success && (!res.data || res.data.length === 0)) {
					preSeedDefaultHabits()
				}
			}),
			getHabitLogs(),
		])
	}, [getUserData, getMeasurements, getUserAnalytics, getHabits, getHabitLogs, preSeedDefaultHabits, user?.userId])

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

			{refreshing ? (
				<ShimmerHomeScreen />
			) : (
				<ScrollView
					showsVerticalScrollIndicator={false}
					refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
					contentContainerStyle={{ paddingBottom: 40 }}
				>
					<StreakCard {...streakData} />

					<Animated.View
						entering={FadeInDown.delay(600).duration(500)}
						className="mb-4 flex-row items-center justify-between"
					>
						<View>
							<Text className="text-xl font-bold text-black dark:text-white">Habits</Text>
						</View>
					</Animated.View>

					<Animated.View entering={FadeInDown.delay(700).duration(500)}>
						<ScrollView
							horizontal
							showsHorizontalScrollIndicator={false}
							contentContainerStyle={{ gap: 10, paddingRight: 20 }}
						>
							{habits.map(habit => (
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
						<Text className="my-4 text-xl font-semibold text-black dark:text-white">Metrics</Text>
					</Animated.View>

					<Animated.View entering={FadeInDown.delay(900).duration(500)}>
						<ScrollView
							horizontal
							showsHorizontalScrollIndicator={false}
							contentContainerStyle={{ gap: 10, paddingRight: 20 }}
						>
							<WeightMetricCard width={width * 0.5} />
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
										Toast.show({
											type: 'info',
											text1: 'Coming Soon',
										})
									}}
									variant="outline"
									textClassName="text-sm"
								/>
							</View>
						</ScrollView>
					</Animated.View>
				</ScrollView>
			)}
		</SafeAreaView>
	)
}
