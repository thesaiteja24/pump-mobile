import { Button } from '@/components/ui/Button'
import { useThemeColor } from '@/hooks/useThemeColor'
import { useOnboarding } from '@/stores/onboardingStore'
import { calculateBMR, calculateDailyTargets, calculateTDEE } from '@/utils/analytics'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { router } from 'expo-router'
import React, { useMemo } from 'react'
import { ScrollView, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import Toast from 'react-native-toast-message'

export default function OnboardingSummary() {
	const colors = useThemeColor()
	const { gender, weight, height, dateOfBirth, fitnessGoal, activityLevel, weeklyRate, weightUnit } = useOnboarding()

	// Compute Derived Stats
	const stats = useMemo(() => {
		if (!weight || !height || !gender || !dateOfBirth || !activityLevel || !fitnessGoal) return null

		const age = new Date().getFullYear() - dateOfBirth.getFullYear()

		const bmr = calculateBMR(weight, height, age, gender)
		const tdee = calculateTDEE(bmr, activityLevel)

		const targets = calculateDailyTargets({
			tdee,
			weightKg: weight,
			goal: fitnessGoal,
			weeklyRateKg: weeklyRate,
		})

		// Determine Risk Level (simplified for UI)
		let riskBadge = 'Moderate'
		let riskColor =
			'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800'

		if (fitnessGoal === 'loseWeight' && weeklyRate) {
			const percentPerWeek = (weeklyRate / weight) * 100
			if (percentPerWeek <= 0.5) {
				riskBadge = 'Conservative'
				riskColor =
					'text-green-600 bg-green-100 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800'
			} else if (percentPerWeek > 1) {
				riskBadge = 'Aggressive'
				riskColor =
					'text-red-600 bg-red-100 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800'
			}
		} else if (fitnessGoal === 'gainMuscle' && weeklyRate) {
			if (weeklyRate <= 0.25) {
				riskBadge = 'Conservative'
				riskColor =
					'text-green-600 bg-green-100 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800'
			} else if (weeklyRate > 0.5) {
				riskBadge = 'Aggressive'
				riskColor =
					'text-red-600 bg-red-100 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800'
			}
		}

		return {
			...targets,
			tdee,
			riskBadge,
			riskColor,
		}
	}, [gender, weight, height, dateOfBirth, activityLevel, fitnessGoal, weeklyRate])

	const handleFinish = () => {
		if (!stats) {
			Toast.show({ type: 'error', text1: 'Missing data to complete setup' })
			return
		}

		// Note: At login time in `login.tsx`, we call `onboarding.getPayload()` and push it to `auth.googleLogin` or `updateUserFitnessProfile` if already logged in.
		router.push('/(auth)/login')
	}

	const handleBack = () => {
		router.back()
	}

	return (
		<SafeAreaView className="flex-1 bg-white dark:bg-black">
			<ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 100 }}>
				<Text className="mb-2 text-3xl font-bold text-black dark:text-white">Your Plan</Text>
				<Text className="mb-8 text-neutral-500 dark:text-neutral-400">
					Based on your biology and ambition, here&apos;s the science-backed strategy we&apos;ve built for
					you.
				</Text>

				{stats ? (
					<View className="flex gap-4">
						{/* Strategy Overview */}
						<View className="rounded-3xl border border-neutral-200 bg-neutral-50 p-5 dark:border-neutral-800 dark:bg-neutral-900">
							<View className="mb-4 flex-row items-center justify-between">
								<Text className="text-xl font-bold text-black dark:text-white">
									{fitnessGoal === 'loseWeight' ? 'Fat Loss Phase' : 'Muscle Gain Phase'}
								</Text>
								<View className={`rounded-full border px-3 py-1 ${stats.riskColor}`}>
									<Text className="text-xs font-semibold text-black dark:text-white">
										{stats.riskBadge}
									</Text>
								</View>
							</View>

							<View className="flex-row items-center justify-between border-b border-neutral-200 pb-3 dark:border-neutral-800">
								<Text className="text-neutral-500 dark:text-neutral-400">Weekly Pace</Text>
								<Text className="text-lg font-semibold text-black dark:text-white">
									{weeklyRate ? `${weeklyRate} ${weightUnit}/week` : 'Auto-paced'}
								</Text>
							</View>
							<View className="mt-3 flex-row items-center justify-between">
								<Text className="text-neutral-500 dark:text-neutral-400">Pace Adjustment</Text>
								<Text className="text-lg font-semibold text-black dark:text-white">
									{stats.deficitOrSurplus > 0 ? '+' : ''}
									{stats.deficitOrSurplus} kcal/day
								</Text>
							</View>
						</View>

						{/* Nutrition Targets */}
						<View className="mt-4 flex-row gap-4">
							<View className="flex-1 rounded-3xl border border-neutral-200 bg-neutral-50 p-5 dark:border-neutral-800 dark:bg-neutral-900">
								<MaterialCommunityIcons name="fire" size={24} color={colors.primary} className="mb-2" />
								<Text className="mb-1 text-2xl font-bold text-black dark:text-white">
									{stats.caloriesTarget}
								</Text>
								<Text className="text-sm text-neutral-500 dark:text-neutral-400">
									Daily Calories (kcal)
								</Text>
							</View>
							<View className="flex-1 rounded-3xl border border-neutral-200 bg-neutral-50 p-5 dark:border-neutral-800 dark:bg-neutral-900">
								<MaterialCommunityIcons
									name="food-steak"
									size={24}
									color={colors.primary}
									className="mb-2"
								/>
								<Text className="mb-1 text-2xl font-bold text-black dark:text-white">
									{stats.proteinTarget}g
								</Text>
								<Text className="text-sm text-neutral-500 dark:text-neutral-400">
									Daily Protein Target
								</Text>
							</View>
						</View>

						{stats.riskBadge === 'Aggressive' && (
							<View className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 dark:border-red-900/50 dark:bg-red-900/20">
								<Text className="text-sm font-semibold text-red-800 dark:text-red-200">
									Warning: Aggressive Protocol
								</Text>
								<Text className="mt-1 text-xs text-red-600 dark:text-red-300">
									This goal requires a significant daily change and may be biologically taxing.
									Monitor your energy, mood, and sleep. We recommend adjusting if you feel fatigued.
								</Text>
							</View>
						)}
					</View>
				) : (
					<View className="rounded-2xl border border-red-200 bg-red-50 p-4 dark:border-red-900/50 dark:bg-red-900/20">
						<Text className="text-sm font-semibold text-red-800 dark:text-red-200">Error</Text>
						<Text className="text-xs text-red-600 dark:text-red-300">
							Missing configuration data. Please go back and ensure you&apos;ve filled out your age,
							height, and gender.
						</Text>
					</View>
				)}
			</ScrollView>

			<View className="absolute bottom-0 left-0 right-0 flex items-center justify-center border-t border-neutral-100 bg-white p-6 dark:border-neutral-900 dark:bg-black">
				<View className="flex flex-row items-center justify-between gap-4 px-8">
					<Button
						className="rounded-full"
						title=""
						onPress={handleBack}
						leftIcon={<MaterialCommunityIcons name="chevron-left" size={24} color={colors.icon} />}
					/>
					<Button
						title="Finalize & Start"
						variant="primary"
						onPress={handleFinish}
						fullWidth
						rightIcon={<Text className="text-white">✓</Text>}
					/>
				</View>
			</View>
		</SafeAreaView>
	)
}
