import { Button } from '@/components/ui/Button'
import DateTimePicker from '@/components/ui/DateTimePicker'
import { GlassBackground } from '@/components/ui/GlassBackground'
import { SelectableCard } from '@/components/ui/SelectableCard'
import {
	useFitnessProfileQuery,
	useMeasurementsQuery,
	useProfileQuery,
	useUpdateFitnessProfileMutation,
	useUpdateNutritionPlanMutation,
} from '@/hooks/queries/useMe'
import { FitnessLevel } from '@/types/program'
import { FitnessGoal, SelfUser } from '@/types/user'

import { calculateBMR, calculateBodyFat, calculateDailyTargets, calculateTDEE } from '@/utils/analytics'
import { BottomSheetBackdrop, BottomSheetModal, BottomSheetScrollView } from '@gorhom/bottom-sheet'
import React, { forwardRef, useEffect, useMemo, useState } from 'react'
import { BackHandler, Keyboard, Pressable, ScrollView, Text, TextInput, View, useColorScheme } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Toast from 'react-native-toast-message'

type TargetType = 'weight' | 'bodyFat'
type PlanningMode = 'rateDriven' | 'dateDriven'

export const FitnessGoalsSheet = forwardRef<BottomSheetModal>((props, ref) => {
	const [isOpen, setIsOpen] = useState(false)
	const isDarkMode = useColorScheme() === 'dark'
	const insets = useSafeAreaInsets()

	const { data: userData } = useProfileQuery()
	const user = userData as SelfUser | null

	const { data: measurements } = useMeasurementsQuery()
	const { data: fitnessProfile } = useFitnessProfileQuery()
	const latestMeasurements = measurements?.latestValues
	const fitnessGoal = fitnessProfile?.fitnessGoal
	const currentWeight = latestMeasurements?.weight ?? user?.weight
	const height = user?.height
	const gender = user?.gender
	const neck = latestMeasurements?.neck
	const waist = latestMeasurements?.waist
	const hips = latestMeasurements?.hips
	const currentGoalType = fitnessGoal || null

	const updateFitnessProfileMutation = useUpdateFitnessProfileMutation()
	const updateNutritionPlanMutation = useUpdateNutritionPlanMutation()

	const currentBodyFat = calculateBodyFat({
		gender: gender!,
		height: Number(height),
		neck: Number(neck),
		waist: Number(waist),
		hips: hips ? Number(hips) : undefined,
	})

	const [goalType, setGoalType] = useState<FitnessGoal | null>(currentGoalType)
	const [targetType, setTargetType] = useState<TargetType>((fitnessProfile?.targetType as TargetType) || 'weight')
	const [targetValue, setTargetValue] = useState(
		fitnessProfile?.targetType === 'bodyFat'
			? fitnessProfile?.targetBodyFat?.toString() || ''
			: fitnessProfile?.targetWeight?.toString() || ''
	)
	const [weeklyRate, setWeeklyRate] = useState(fitnessProfile?.weeklyWeightChange?.toString() || '0.5') // kg or %
	const [targetDate, setTargetDate] = useState<Date | null>(
		fitnessProfile?.targetDate ? new Date(fitnessProfile.targetDate) : null
	)
	const [mode, setMode] = useState<PlanningMode>(fitnessProfile?.targetDate ? 'dateDriven' : 'rateDriven')
	const [isLoading, setIsLoading] = useState(false)

	const currentActivityLevel = fitnessProfile?.activityLevel || 'sedentary'
	const [activityLevel, setActivityLevel] = useState<
		'sedentary' | 'lightlyActive' | 'moderatelyActive' | 'veryActive' | 'athlete'
	>(currentActivityLevel)

	const currentFitnessLevel = fitnessProfile?.fitnessLevel || 'beginner'
	const [fitnessLevel, setFitnessLevel] = useState<FitnessLevel>(currentFitnessLevel)

	// Preferred weight unit for display
	const weightUnit = user?.preferredWeightUnit ?? 'kg'

	// --- Auto calculate target date ---
	const calculatedDate = useMemo(() => {
		if (!targetValue || !weeklyRate) return null

		const current = targetType === 'weight' ? currentWeight : currentBodyFat
		// Guard: if current value is unavailable we cannot calculate
		if (current == null || !Number.isFinite(current)) return null

		const delta = Math.abs(Number(targetValue) - current)
		const weeks = delta / Number(weeklyRate)

		if (!weeks || !isFinite(weeks)) return null

		const d = new Date()
		d.setDate(d.getDate() + Math.ceil(weeks * 7))
		return d
	}, [targetValue, weeklyRate, targetType, currentWeight, currentBodyFat])

	// --- Reverse calculate weekly rate if date is chosen ---
	const calculatedRate = useMemo(() => {
		if (!targetDate || !targetValue) return null

		const current = targetType === 'weight' ? currentWeight : currentBodyFat
		// Guard: if current value is unavailable we cannot calculate
		if (current == null || !Number.isFinite(current)) return null

		const delta = Math.abs(Number(targetValue) - current)

		const days = (targetDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
		const weeks = days / 7

		if (weeks <= 0) return null

		return (delta / weeks).toFixed(2)
	}, [targetDate, targetValue, targetType, currentWeight, currentBodyFat])

	const finalTargetDate = mode === 'rateDriven' ? calculatedDate : targetDate
	const finalRate = mode === 'dateDriven' && calculatedRate ? calculatedRate : weeklyRate

	// Final Goals Logic
	const computedTargets = useMemo(() => {
		if (!currentWeight || !height || !gender || !user?.dateOfBirth || !goalType || !finalRate) return null

		const age = new Date().getFullYear() - new Date(user.dateOfBirth).getFullYear()
		const bmr = calculateBMR(Number(currentWeight), Number(height), age, gender as any)
		const tdee = calculateTDEE(bmr, activityLevel)

		return calculateDailyTargets({
			tdee,
			weightKg: Number(currentWeight),
			goal: goalType,
			weeklyRateKg: Number(finalRate),
			fitnessLevel: fitnessProfile?.fitnessLevel,
		})
	}, [
		currentWeight,
		height,
		gender,
		user?.dateOfBirth,
		goalType,
		finalRate,
		activityLevel,
		fitnessProfile?.fitnessLevel,
	])

	const handleSave = async () => {
		Keyboard.dismiss()

		if (!user?.id) return

		setIsLoading(true)

		let computedTargetBodyFat = null
		let computedTargetWeight = null

		if (targetType === 'weight') {
			computedTargetWeight = Number(targetValue)
			if (currentWeight != null && currentBodyFat != null) {
				const currentLeanMass = currentWeight * (1 - currentBodyFat / 100)
				computedTargetBodyFat = (1 - currentLeanMass / computedTargetWeight) * 100
			}
		} else {
			computedTargetBodyFat = Number(targetValue)
			if (currentWeight != null && currentBodyFat != null) {
				const currentLeanMass = currentWeight * (1 - currentBodyFat / 100)
				computedTargetWeight = currentLeanMass / (1 - computedTargetBodyFat / 100)
			}
		}

		const payload = {
			fitnessGoal: goalType,
			targetType,
			targetWeight: computedTargetWeight ? Number(computedTargetWeight.toFixed(2)) : undefined,
			targetBodyFat: computedTargetBodyFat ? Number(computedTargetBodyFat.toFixed(2)) : undefined,
			weeklyWeightChange: Number(finalRate),
			targetDate: finalTargetDate ? finalTargetDate.toISOString() : undefined,
			activityLevel,
			fitnessLevel,
		}

		const promises = [updateFitnessProfileMutation.mutateAsync(payload)]

		if (computedTargets) {
			const nutritionPayload = {
				caloriesTarget: computedTargets.caloriesTarget,
				proteinTarget: computedTargets.proteinTarget,
				fatsTarget: computedTargets.fatsTarget,
				carbsTarget: computedTargets.carbsTarget,
				calculatedTDEE: computedTargets.caloriesTarget - computedTargets.deficitOrSurplus,
				deficitOrSurplus: computedTargets.deficitOrSurplus,
				startDate: new Date().toISOString(),
			}
			promises.push(updateNutritionPlanMutation.mutateAsync(nutritionPayload))
		}

		try {
			const results = await Promise.all(promises)
			const res = results[0] // Check fitness profile success

			setIsLoading(false)

			if (res) {
				Toast.show({
					type: 'success',
					text1: 'Goals updated successfully',
				})
				// @ts-ignore
				ref?.current?.dismiss()
			}
		} catch (error: any) {
			setIsLoading(false)
			Toast.show({
				type: 'error',
				text1: 'Failed to update goals',
				text2: error?.message || 'Please try again',
			})
		}
	}

	useEffect(() => {
		const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
			if (isOpen) {
				// @ts-ignore
				ref?.current?.dismiss()
				return true // prevent navigation
			}
			return false // allow normal back navigation
		})

		return () => backHandler.remove()
	}, [isOpen, ref])

	return (
		<BottomSheetModal
			ref={ref}
			snapPoints={['90%']}
			enableDynamicSizing={false}
			backdropComponent={props => (
				<BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} opacity={0.4} />
			)}
			backgroundComponent={GlassBackground}
			handleIndicatorStyle={{ backgroundColor: isDarkMode ? '#525252' : '#d1d5db' }}
			onChange={index => {
				setIsOpen(index >= 0)
			}}
		>
			<BottomSheetScrollView
				contentContainerStyle={{
					paddingHorizontal: 24,
					paddingBottom: insets.bottom + 40,
				}}
			>
				<Text className="mb-6 text-center text-xl font-bold text-black dark:text-white">Goal Strategy</Text>

				{/* Goal Type */}
				<Text className="mb-3 text-lg font-semibold text-black dark:text-white">Primary Goal</Text>

				<View className="mb-6 flex-row flex-wrap gap-2">
					<GoalCard
						title="Lose Weight"
						selected={goalType === 'loseWeight'}
						onSelect={() => setGoalType('loseWeight')}
					/>
					<GoalCard
						title="Gain Muscle"
						selected={goalType === 'gainMuscle'}
						onSelect={() => setGoalType('gainMuscle')}
					/>
					{/* <GoalCard
						title="Recomposition"
						selected={goalType === 'recomp'}
						onSelect={() => setGoalType('recomp')}
					/> */}
				</View>

				<View className="mb-6">
					<Text className="mb-2 text-sm font-medium text-neutral-500 dark:text-neutral-400">
						Activity Level
					</Text>
					<ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row">
						{[
							{ value: 'sedentary', label: 'Sedentary' },
							{ value: 'lightlyActive', label: 'Lightly Active' },
							{ value: 'moderatelyActive', label: 'Moderately Active' },
							{ value: 'veryActive', label: 'Very Active' },
							{ value: 'athlete', label: 'Athlete' },
						].map(level => (
							<Pressable
								key={level.value}
								onPress={() => setActivityLevel(level.value as any)}
								className={`mr-3 rounded-full border px-4 py-2 ${
									activityLevel === level.value
										? 'border-blue-500 bg-blue-50 dark:border-blue-400 dark:bg-blue-900/30'
										: 'border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900'
								}`}
							>
								<Text
									className={`font-medium ${
										activityLevel === level.value
											? 'text-blue-600 dark:text-blue-400'
											: 'text-neutral-700 dark:text-neutral-300'
									}`}
								>
									{level.label}
								</Text>
							</Pressable>
						))}
					</ScrollView>
				</View>

				<View className="mb-6">
					<Text className="mb-2 text-sm font-medium text-neutral-500 dark:text-neutral-400">
						Experience Level
					</Text>
					<ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row">
						{[
							{ value: 'beginner', label: 'Beginner' },
							{ value: 'intermediate', label: 'Intermediate' },
							{ value: 'advanced', label: 'Advanced' },
						].map(level => (
							<Pressable
								key={level.value}
								onPress={() => setFitnessLevel(level.value as any)}
								className={`mr-3 rounded-full border px-4 py-2 ${
									fitnessLevel === level.value
										? 'border-blue-500 bg-blue-50 dark:border-blue-400 dark:bg-blue-900/30'
										: 'border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900'
								}`}
							>
								<Text
									className={`font-medium ${
										fitnessLevel === level.value
											? 'text-blue-600 dark:text-blue-400'
											: 'text-neutral-700 dark:text-neutral-300'
									}`}
								>
									{level.label}
								</Text>
							</Pressable>
						))}
					</ScrollView>
				</View>

				{/* Target Metric */}
				<Text className="mb-3 text-lg font-semibold text-black dark:text-white">Target Metric</Text>

				<View className="mb-6 flex-row gap-2">
					<GoalCard
						title="Weight"
						selected={targetType === 'weight'}
						onSelect={() => setTargetType('weight')}
					/>
					<GoalCard
						title="Body Fat %"
						selected={targetType === 'bodyFat'}
						onSelect={() => setTargetType('bodyFat')}
					/>
				</View>

				{/* Target Value */}
				<View className="mb-6">
					<Text className="text-lg font-semibold text-black dark:text-white">
						Target {targetType === 'weight' ? 'Weight' : 'Body Fat %'}
					</Text>

					<TextInput
						value={targetValue}
						onChangeText={setTargetValue}
						keyboardType="decimal-pad"
						placeholder="Enter target value"
						className="mt-2 rounded-xl border border-neutral-200 bg-neutral-50 p-3 text-lg text-black dark:border-neutral-800 dark:bg-neutral-900 dark:text-white"
					/>
				</View>

				{/* Planning Mode */}
				<Text className="mb-3 text-lg font-semibold text-black dark:text-white">Planning Mode</Text>

				<View className="mb-6 flex-row gap-2">
					<GoalCard
						title="Auto Date"
						selected={mode === 'rateDriven'}
						onSelect={() => setMode('rateDriven')}
					/>
					<GoalCard
						title="Manual Date"
						selected={mode === 'dateDriven'}
						onSelect={() => setMode('dateDriven')}
					/>
				</View>

				{/* Weekly Rate */}
				{mode === 'rateDriven' && (
					<View className="mb-6">
						<Text className="text-lg font-semibold text-black dark:text-white">
							Weekly Change ({targetType === 'weight' ? weightUnit : '%'})
						</Text>

						<TextInput
							value={weeklyRate}
							onChangeText={setWeeklyRate}
							keyboardType="decimal-pad"
							className="mt-2 rounded-xl border border-neutral-200 bg-neutral-50 p-3 text-lg text-black dark:border-neutral-800 dark:bg-neutral-900 dark:text-white"
						/>

						{calculatedDate && (
							<Text className="mt-3 text-sm text-neutral-500 dark:text-neutral-400">
								Estimated completion: {calculatedDate.toDateString()}
							</Text>
						)}
					</View>
				)}

				{/* Manual Date */}
				{mode === 'dateDriven' && (
					<View className="mb-6">
						<Text className="text-lg font-semibold text-black dark:text-white">Target Date</Text>

						<DateTimePicker value={targetDate ?? undefined} dateOnly onUpdate={setTargetDate} />

						{calculatedRate && (
							<Text className="mt-3 text-sm text-neutral-500 dark:text-neutral-400">
								Required weekly change: {calculatedRate} {targetType === 'weight' ? weightUnit : '%'}
							</Text>
						)}
					</View>
				)}

				{/* Computed Prediction Panel */}
				{computedTargets && (
					<View className="mb-6 rounded-2xl bg-blue-50 p-4 dark:bg-blue-900/20">
						<Text className="mb-2 text-sm font-semibold text-blue-800 dark:text-blue-200">
							Science-Backed Plan
						</Text>
						<View className="flex-row items-center justify-between">
							<Text className="text-neutral-700 dark:text-neutral-300">Calories/Day:</Text>
							<Text className="font-bold text-black dark:text-white">
								{computedTargets.caloriesTarget} kcal
							</Text>
						</View>
						<View className="flex-row items-center justify-between">
							<Text className="text-neutral-700 dark:text-neutral-300">Protein Target:</Text>
							<Text className="font-bold text-black dark:text-white">
								{computedTargets.proteinTarget}g
							</Text>
						</View>
					</View>
				)}

				<Button
					title="Save Goals"
					onPress={handleSave}
					variant="primary"
					disabled={!targetValue || !weeklyRate || isLoading}
					loading={isLoading}
					liquidGlass
				/>
			</BottomSheetScrollView>
		</BottomSheetModal>
	)
})

function GoalCard({ selected, onSelect, title }: any) {
	return <SelectableCard selected={selected} onSelect={onSelect} title={title} className="basis-[48%] px-3 py-3" />
}

FitnessGoalsSheet.displayName = 'FitnessGoalsSheet'
