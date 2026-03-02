import { MuscleCompositionCard } from '@/components/analytics/MuscleCompositionCard'
import { useThemeColor } from '@/hooks/useThemeColor'
import { useAuth } from '@/stores/authStore'
import { calculateBMI, calculateBodyFat, calculateComposition } from '@/utils/analytics'
import { convertWeight, displayWeight } from '@/utils/converter'
import { Ionicons } from '@expo/vector-icons'
import React, { useMemo } from 'react'
import { ScrollView, Text, View } from 'react-native'
import Animated, { FadeInDown } from 'react-native-reanimated'

const AnalyticsScreen = () => {
	const user = useAuth(state => state.user)
	const colors = useThemeColor()

	// All values from store are in backend canonical units (kg / cm)
	const weightKg = Number(user?.weight) // kg
	const heightCm = Number(user?.height) // cm
	const gender = user?.gender
	const neckCm = Number(user?.measurements?.[0]?.neck) // cm
	const waistCm = Number(user?.measurements?.[0]?.waist) // cm
	const hipsCm = Number(user?.measurements?.[0]?.hips) // cm

	const preferredWeightUnit = user?.preferredWeightUnit ?? 'kg'
	// Goal extracted at top level to satisfy Rules of Hooks
	const fitnessGoal = user?.fitnessProfile?.fitnessGoal

	const latestWeightKg = Number(user?.measurements?.[0]?.weight)
	const previousWeightKg = Number(user?.measurements?.[1]?.weight)

	const hasValidLatest = Number.isFinite(latestWeightKg) && latestWeightKg > 0

	const hasValidPrevious = Number.isFinite(previousWeightKg) && previousWeightKg > 0

	const canComputeDiff = hasValidLatest && hasValidPrevious

	const weightDiffKg = canComputeDiff ? Math.abs(latestWeightKg - previousWeightKg) : null

	const isLoss = canComputeDiff ? latestWeightKg < previousWeightKg : null

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

	return (
		<ScrollView contentContainerStyle={{ paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
			{/* Muscle Composition Card */}
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

			{/* Best Workout + Current Weight */}
			<Animated.View
				entering={FadeInDown.delay(120).duration(500)}
				className="flex-row items-center justify-between gap-4 p-4"
			>
				{/* Best Workout */}
				<View className="h-full w-full flex-1 items-center gap-2 rounded-2xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
					<Text className="font-base text-xl text-black dark:text-white">Best Workout</Text>
				</View>
				{/* Weight Card */}
				<View className="h-full w-full flex-1 items-center gap-2 rounded-2xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
					<Text className="font-base font-base text-xl text-black dark:text-white">Current Weight</Text>

					<Text className="font-base text-xl font-semibold text-black dark:text-white">
						{weightDisplay != null ? weightDisplay : '--'} {preferredWeightUnit.toUpperCase()}
					</Text>

					<View
						className={`flex-row items-center gap-2 rounded-full border px-2 py-1 ${
							isLoss === null
								? 'border-neutral-300 bg-neutral-200/40'
								: isLoss
									? 'border-green-500 bg-green-500/15'
									: 'border-red-500 bg-red-500/15'
						}`}
					>
						<Ionicons
							name={
								isLoss === null
									? 'remove-outline'
									: isLoss
										? 'trending-down-sharp'
										: 'trending-up-sharp'
							}
							size={12}
							color={isLoss === null ? colors.text : isLoss ? colors.success : colors.danger}
						/>

						<Text
							className={`font-base text-xs ${
								isLoss === null
									? 'text-neutral-600 dark:text-neutral-300'
									: isLoss
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

			{/* Habit progress */}
			<Animated.View
				entering={FadeInDown.delay(240).duration(500)}
				className="flex-row items-center justify-between gap-4 p-4"
			>
				<View className="h-full w-full flex-1 items-center gap-2 rounded-2xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
					<Text className="font-base text-xl text-black dark:text-white">Habit Progress</Text>
				</View>
			</Animated.View>

			{/* Muscle Heatmap */}
			<Animated.View
				entering={FadeInDown.delay(360).duration(500)}
				className="flex-row items-center justify-between gap-4 p-4"
			>
				<View className="h-full w-full flex-1 items-center gap-2 rounded-2xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
					<Text className="font-base text-xl text-black dark:text-white">Muscle Heatmap</Text>
				</View>
			</Animated.View>
		</ScrollView>
	)
}

export default AnalyticsScreen
