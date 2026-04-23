import { MuscleCompositionCard } from '@/components/analytics/MuscleCompositionCard'
import { NutritionTargetsCard } from '@/components/analytics/NutritionTargetsCard'
import ShimmerAnalyticsScreen from '@/components/analytics/ShimmerAnalyticsScreen'
import { useFitnessProfileQuery, useMeasurementsQuery, useNutritionPlanQuery } from '@/hooks/queries/useAnalytics'
import { useUserQuery } from '@/hooks/queries/useUser'
import { useThemeColor } from '@/hooks/useThemeColor'
import { useAuth } from '@/stores/authStore'
import { SelfUser } from '@/types/user'
import {
	calculateBMI,
	calculateBMR,
	calculateBodyFat,
	calculateComposition,
	estimateBodyFatFromBMI,
} from '@/utils/analytics'
import { convertWeight } from '@/utils/converter'
import { router } from 'expo-router'
import React, { useEffect, useMemo } from 'react'
import { BackHandler, ScrollView, View } from 'react-native'

const AnalyticsScreen = () => {
	const currentUserId = useAuth(state => state.userId)
	const { data: userData } = useUserQuery(currentUserId!)
	const user = userData as SelfUser | null

	const { data: measurements, isLoading: measurementsLoading } = useMeasurementsQuery()
	const { data: fitnessProfile, isLoading: profileLoading } = useFitnessProfileQuery()
	const { data: nutritionPlan, isLoading: nutritionLoading } = useNutritionPlanQuery()
	const isLoading = measurementsLoading || profileLoading || nutritionLoading

	const latestMeasurements = measurements?.latestValues
	const colors = useThemeColor()

	// All values from store are in backend canonical units (kg / cm)
	const weightKg = Number(latestMeasurements?.weight ?? user?.weight) // kg
	const heightCm = Number(user?.height) // cm
	const gender = user?.gender as any // Or Gender from types
	const neckCm = Number(latestMeasurements?.neck) // cm
	const waistCm = Number(latestMeasurements?.waist) // cm
	const hipsCm = Number(latestMeasurements?.hips) // cm

	const preferredWeightUnit = user?.preferredWeightUnit ?? 'kg'
	// Goal extracted at top level to satisfy Rules of Hooks
	const fitnessGoal = fitnessProfile?.fitnessGoal

	const age = useMemo(() => {
		if (!user?.dateOfBirth) return 25 // fallback
		return new Date().getFullYear() - new Date(user.dateOfBirth).getFullYear()
	}, [user?.dateOfBirth])

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
		const onBackPress = () => {
			router.back()
			return true
		}

		const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress)

		return () => subscription.remove()
	}, [])

	return (
		<ScrollView contentContainerStyle={{ paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
			{isLoading ? (
				<ShimmerAnalyticsScreen />
			) : (
				<View className="flex items-center justify-center gap-4">
					<MuscleCompositionCard
						composition={composition}
						gender={gender}
						goal={fitnessGoal}
						preferredWeightUnit={preferredWeightUnit}
					/>

					<NutritionTargetsCard
						nutritionPlan={nutritionPlan}
						fitnessProfile={fitnessProfile}
						riskBadge={riskBadge}
						bmr={bmr}
						colors={colors}
						preferredWeightUnit={preferredWeightUnit}
					/>
				</View>
			)}
		</ScrollView>
	)
}

export default AnalyticsScreen
