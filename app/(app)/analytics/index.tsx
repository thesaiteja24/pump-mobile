import { MuscleCompositionCard } from '@/components/analytics/MuscleCompositionCard'
import { NutritionTargetsCard } from '@/components/analytics/NutritionTargetsCard'
import { useThemeColor } from '@/hooks/useThemeColor'
import { useAnalytics } from '@/stores/analyticsStore'
import { useAuth } from '@/stores/authStore'
import { calculateBMI, calculateBMR, calculateBodyFat, calculateComposition } from '@/utils/analytics'
import { convertWeight, displayWeight } from '@/utils/converter'
import { Ionicons } from '@expo/vector-icons'
import React, { useEffect, useMemo } from 'react'
import { ActivityIndicator, ScrollView, Text, View } from 'react-native'
import Animated, { FadeInDown } from 'react-native-reanimated'

const AnalyticsScreen = () => {
	const user = useAuth(state => state.user)
	const getMeasurements = useAnalytics(state => state.getMeasurements)
	const isLoading = useAnalytics(state => state.isLoading)
	const latestMeasurements = useAnalytics(state => state.latestMeasurements)
	const dailyWeightChange = useAnalytics(state => state.dailyWeightChange)
	const fitnessProfile = useAnalytics(state => state.fitnessProfile)
	const nutritionPlan = useAnalytics(state => state.nutritionPlan)
	const colors = useThemeColor()

	// All values from store are in backend canonical units (kg / cm)
	const weightKg = Number(latestMeasurements?.weight ?? user?.weight) // kg
	const heightCm = Number(user?.height) // cm
	const gender = user?.gender
	const neckCm = Number(latestMeasurements?.neck) // cm
	const waistCm = Number(latestMeasurements?.waist) // cm
	const hipsCm = Number(latestMeasurements?.hips) // cm

	const preferredWeightUnit = user?.preferredWeightUnit ?? 'kg'
	// Goal extracted at top level to satisfy Rules of Hooks
	const fitnessGoal = fitnessProfile?.fitnessGoal
	console.log('fitnessProfile', fitnessProfile)

	const weightDiffKg = dailyWeightChange?.diff

	const isLoss = !dailyWeightChange?.isPositive

	const showPositive = (fitnessGoal === 'gainMuscle' && !isLoss) || (fitnessGoal === 'loseWeight' && isLoss)

	const weightDiffDisplay =
		weightDiffKg != null ? convertWeight(weightDiffKg, { from: 'kg', to: preferredWeightUnit }) : null

	// Weight in the user's display unit for rendering
	const weightDisplay = Number.isFinite(weightKg) && weightKg > 0 ? displayWeight(weightKg) : null

	const composition = useMemo(() => {
		if (!weightKg || !heightCm || !gender || !neckCm || !waistCm) return null

		// Body-fat formula requires cm — values from store are already in cm
		const bodyFat = calculateBodyFat({
			gender,
			height: heightCm,
			neck: neckCm,
			waist: waistCm,
			hips: hipsCm ? hipsCm : undefined,
		})

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
	}, [weightKg, heightCm, gender, neckCm, waistCm, hipsCm, preferredWeightUnit])

	const age = useMemo(() => {
		if (!user?.dateOfBirth) return 25 // fallback
		return new Date().getFullYear() - new Date(user.dateOfBirth).getFullYear()
	}, [user?.dateOfBirth])

	const bmr = useMemo(() => {
		if (!weightKg || !heightCm || !gender) return null
		return calculateBMR(weightKg, heightCm, age, gender as any)
	}, [weightKg, heightCm, age, gender])

	const riskBadge = useMemo(() => {
		if (!fitnessGoal || !fitnessProfile?.weeklyWeightChange || !weightKg) return null
		const weeklyRate = fitnessProfile.weeklyWeightChange

		if (fitnessGoal === 'loseWeight') {
			const percentPerWeek = (weeklyRate / weightKg) * 100
			if (percentPerWeek <= 0.5)
				return {
					label: 'Conservative',
					color: 'text-green-700 dark:text-green-300',
					bg: 'bg-green-100 dark:bg-green-900/30',
				}
			if (percentPerWeek > 1)
				return {
					label: 'Aggressive',
					color: 'text-red-700 dark:text-red-300',
					bg: 'bg-red-100 dark:bg-red-900/30',
				}
			return {
				label: 'Moderate',
				color: 'text-yellow-700 dark:text-yellow-300',
				bg: 'bg-yellow-100 dark:bg-yellow-900/30',
			}
		} else if (fitnessGoal === 'gainMuscle') {
			if (weeklyRate <= 0.25)
				return {
					label: 'Conservative',
					color: 'text-green-700 dark:text-green-300',
					bg: 'bg-green-100 dark:bg-green-900/30',
				}
			if (weeklyRate > 0.5)
				return {
					label: 'Aggressive',
					color: 'text-red-700 dark:text-red-300',
					bg: 'bg-red-100 dark:bg-red-900/30',
				}
			return {
				label: 'Moderate',
				color: 'text-yellow-700 dark:text-yellow-300',
				bg: 'bg-yellow-100 dark:bg-yellow-900/30',
			}
		}
		return null
	}, [fitnessGoal, fitnessProfile?.weeklyWeightChange, weightKg])

	useEffect(() => {
		getMeasurements()
	}, [getMeasurements])

	return (
		<ScrollView contentContainerStyle={{ paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
			{isLoading ? (
				<View className="flex-1 items-center justify-center">
					<ActivityIndicator size="large" color={colors.primary} />
				</View>
			) : (
				<>
					<Animated.View
						entering={FadeInDown.delay(0).duration(500)}
						className="flex-row items-center justify-between gap-4 p-4"
					>
						<View className="relative w-full rounded-3xl">
							{/* Actual Card — MuscleCompositionCard has its own entry animation */}
							<MuscleCompositionCard
								composition={composition}
								gender={gender}
								goal={fitnessGoal}
								preferredWeightUnit={preferredWeightUnit}
							/>
						</View>
					</Animated.View>

					<Animated.View
						entering={FadeInDown.delay(120).duration(500)}
						className="flex-row items-center justify-between gap-4 p-4"
					>
						{/* Best Workout */}
						<View className="h-full w-full flex-1 items-center gap-2 rounded-2xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
							<Text className="font-base text-xl text-black dark:text-white">Best Workout</Text>
							<Text className="font-base text-center text-sm text-black dark:text-white">
								Your best workouts will be displayed here...
							</Text>
						</View>
						{/* Weight Card */}
						<View className="h-full w-full flex-1 items-center gap-2 rounded-2xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
							<Text className="font-base font-base text-xl text-black dark:text-white">
								Current Weight
							</Text>

							<Text className="font-base text-xl font-semibold text-black dark:text-white">
								{weightDisplay != null ? weightDisplay : '--'} {preferredWeightUnit.toUpperCase()}
							</Text>

							<View
								className={`flex-row items-center gap-2 rounded-full border px-2 py-1 ${
									isLoss === null || weightDiffDisplay === null
										? 'border-neutral-300 bg-neutral-200/40'
										: showPositive
											? 'border-green-500 bg-green-500/15'
											: 'border-red-500 bg-red-500/15'
								}`}
							>
								<Ionicons
									name={
										isLoss === null || weightDiffDisplay === null
											? 'remove-outline'
											: isLoss
												? 'trending-down-sharp'
												: 'trending-up-sharp'
									}
									size={12}
									color={
										isLoss === null || weightDiffDisplay === null
											? colors.text
											: showPositive
												? colors.success
												: colors.danger
									}
								/>

								<Text
									className={`font-base text-xs ${
										isLoss === null || weightDiffDisplay === null
											? 'text-neutral-600 dark:text-neutral-300'
											: showPositive
												? 'text-green-600'
												: 'text-red-600'
									}`}
								>
									{weightDiffDisplay != null ? weightDiffDisplay.toFixed(1) : '--'}{' '}
									{preferredWeightUnit.toUpperCase()}
								</Text>
							</View>

							<View className="absolute bottom-[-8] right-[-8]">
								<Ionicons name="scale-outline" size={120} color={colors.text} opacity={0.04} />
							</View>
						</View>
					</Animated.View>

					<NutritionTargetsCard
						nutritionPlan={nutritionPlan}
						fitnessProfile={fitnessProfile}
						riskBadge={riskBadge}
						bmr={bmr}
						colors={colors}
						preferredWeightUnit={preferredWeightUnit}
					/>

					{/* <Animated.View
						entering={FadeInDown.delay(240).duration(500)}
						className="flex-row items-center justify-between gap-4 p-4"
					>
						<View className="h-full w-full flex-1 items-center gap-2 rounded-2xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
							<Text className="font-base text-xl text-black dark:text-white">Habit Progress</Text>
						</View>
					</Animated.View> */}

					{/* <Animated.View
						entering={FadeInDown.delay(360).duration(500)}
						className="flex-row items-center justify-between gap-4 p-4"
					>
						<View className="h-full w-full flex-1 items-center gap-2 rounded-2xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
							<Text className="font-base text-xl text-black dark:text-white">Muscle Heatmap</Text>
						</View>
					</Animated.View> */}
				</>
			)}
		</ScrollView>
	)
}

export default AnalyticsScreen
