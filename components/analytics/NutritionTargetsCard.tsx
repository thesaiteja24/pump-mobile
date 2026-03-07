import { convertWeight, displayWeight } from '@/utils/converter'
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons'
import { router } from 'expo-router'
import React from 'react'
import { StyleSheet, Text, View } from 'react-native'
import Animated, { FadeInDown } from 'react-native-reanimated'

interface NutritionTargetsCardProps {
	nutritionPlan: any
	fitnessProfile: any
	riskBadge: { label: string; color: string; bg: string } | null
	bmr: number | null
	colors: any
	preferredWeightUnit: string
}

export function NutritionTargetsCard({
	nutritionPlan,
	fitnessProfile,
	riskBadge,
	bmr,
	colors,
	preferredWeightUnit,
}: NutritionTargetsCardProps) {
	const isDark = colors.isDark

	const isIncomplete = !nutritionPlan || !nutritionPlan.caloriesTarget || !nutritionPlan.proteinTarget

	return (
		<Animated.View entering={FadeInDown.delay(180).duration(500)} style={styles.container}>
			<View
				style={[
					styles.card,
					{
						backgroundColor: isDark ? '#171717' : '#fff',
						borderColor: isDark ? '#262626' : '#e5e7eb',
					},
				]}
			>
				<View className="mb-4 flex-row items-center justify-between">
					<Text className="text-xl font-bold text-black dark:text-white">Nutrition Targets</Text>
					<View className="flex-row gap-2">
						{riskBadge && (
							<View className={`rounded-full px-3 py-1 ${riskBadge.bg}`}>
								<Text className={`text-xs font-semibold ${riskBadge.color}`}>{riskBadge.label}</Text>
							</View>
						)}
						{nutritionPlan?.deficitOrSurplus != null && (
							<View
								className={`rounded-full px-3 py-1 ${nutritionPlan.deficitOrSurplus > 0 ? 'bg-blue-100 dark:bg-blue-900/30' : 'bg-red-100 dark:bg-red-900/30'}`}
							>
								<Text
									className={`text-xs font-semibold ${nutritionPlan.deficitOrSurplus > 0 ? 'text-blue-700 dark:text-blue-300' : 'text-red-700 dark:text-red-300'}`}
								>
									{nutritionPlan.deficitOrSurplus > 0 ? 'Surplus' : 'Deficit'}
								</Text>
							</View>
						)}
					</View>
				</View>
				<View className="flex-row gap-4">
					<View className="flex-1 items-center rounded-2xl bg-neutral-50 px-2 py-4 dark:bg-neutral-800/50">
						<MaterialCommunityIcons name="fire" size={24} color={colors.primary} className="mb-2" />
						<Text className="mb-1 text-2xl font-bold text-black dark:text-white">
							{nutritionPlan?.caloriesTarget ?? '--'}
						</Text>
						<Text className="text-xs text-neutral-500 dark:text-neutral-400">Calories/Day</Text>
					</View>
					<View className="flex-1 items-center rounded-2xl bg-neutral-50 px-2 py-4 dark:bg-neutral-800/50">
						<MaterialCommunityIcons name="food-steak" size={24} color={colors.primary} className="mb-2" />
						<Text className="mb-1 text-2xl font-bold text-black dark:text-white">
							{nutritionPlan?.proteinTarget != null ? `${nutritionPlan.proteinTarget}g` : '--'}
						</Text>
						<Text className="text-xs text-neutral-500 dark:text-neutral-400">Protein/Day</Text>
					</View>
				</View>

				{/* Detailed Stats Sub-Block */}
				<View className="mt-4 border-t border-neutral-100 pt-4 dark:border-neutral-800/80">
					<Text className="mb-3 text-sm font-semibold text-neutral-500 dark:text-neutral-400">
						Biological Details
					</Text>
					<View className="flex-row flex-wrap gap-y-3">
						<View className="w-1/2 pr-2">
							<Text className="mb-1 text-xs text-neutral-500 dark:text-neutral-400">Est. TDEE</Text>
							<Text className="font-semibold text-black dark:text-white">
								{nutritionPlan?.calculatedTDEE ? `${nutritionPlan.calculatedTDEE} kcal` : '--'}
							</Text>
						</View>
						<View className="w-1/2 pl-2">
							<Text className="mb-1 text-xs text-neutral-500 dark:text-neutral-400">Est. BMR</Text>
							<Text className="font-semibold text-black dark:text-white">
								{bmr ? `${bmr} kcal` : '--'}
							</Text>
						</View>
						<View className="w-1/2 pr-2">
							<Text className="mb-1 text-xs text-neutral-500 dark:text-neutral-400">Target Weight</Text>
							<Text className="font-semibold text-black dark:text-white">
								{fitnessProfile?.targetWeight
									? `${displayWeight(convertWeight(fitnessProfile.targetWeight, { from: 'kg', to: preferredWeightUnit as any }))} ${preferredWeightUnit.toUpperCase()}`
									: '--'}
							</Text>
						</View>
						<View className="w-1/2 pl-2">
							<Text className="mb-1 text-xs text-neutral-500 dark:text-neutral-400">Target Date</Text>
							<Text className="font-semibold text-black dark:text-white">
								{fitnessProfile?.targetDate
									? new Date(fitnessProfile.targetDate).toLocaleDateString(undefined, {
											month: 'short',
											day: 'numeric',
											year: 'numeric',
										})
									: '--'}
							</Text>
						</View>
					</View>
				</View>

				{/* Overlay when data is incomplete */}
				{isIncomplete && (
					<View
						style={[
							styles.overlay,
							{ backgroundColor: isDark ? 'rgba(23,23,23,0.88)' : 'rgba(255,255,255,0.88)' },
						]}
					>
						<View style={styles.overlayContent}>
							<Ionicons name="lock-closed-outline" size={28} color={colors.text} />
							<Text style={[styles.overlayText, { color: colors.text }]}>
								Update your fitness profile to unlock personalized nutrition targets
							</Text>

							<View style={[styles.overlayButton, { backgroundColor: colors.text }]}>
								<Text
									style={[styles.overlayButtonText, { color: colors.background }]}
									onPress={() => router.push('/(app)/(tabs)/profile')}
								>
									Update Fitness Profile
								</Text>
							</View>
						</View>
					</View>
				)}
			</View>
		</Animated.View>
	)
}

const styles = StyleSheet.create({
	container: {
		paddingHorizontal: 16,
		paddingBottom: 16,
	},
	card: {
		position: 'relative',
		borderRadius: 24,
		borderWidth: 1,
		padding: 20,
		overflow: 'hidden',
	},
	overlay: {
		...StyleSheet.absoluteFillObject,
		alignItems: 'center',
		justifyContent: 'center',
		zIndex: 10,
	},
	overlayContent: {
		alignItems: 'center',
		paddingHorizontal: 24,
	},
	overlayText: {
		marginTop: 12,
		textAlign: 'center',
		fontSize: 13,
		fontWeight: '500',
	},
	overlayButton: {
		marginTop: 16,
		borderRadius: 999,
		paddingHorizontal: 16,
		paddingVertical: 8,
	},
	overlayButtonText: {
		fontSize: 12,
		fontWeight: '600',
	},
})
