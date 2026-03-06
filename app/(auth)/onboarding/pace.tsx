import { Button } from '@/components/ui/Button'
import DateTimePicker from '@/components/ui/DateTimePicker'
import { SelectableCard } from '@/components/ui/SelectableCard'
import { useThemeColor } from '@/hooks/useThemeColor'
import { useOnboarding } from '@/stores/onboardingStore'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { router } from 'expo-router'
import React, { useState } from 'react'
import { ScrollView, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import Toast from 'react-native-toast-message'

export default function OnboardingPace() {
	const colors = useThemeColor()
	const { fitnessGoal, weightUnit, setWeeklyRate, setTargetDate } = useOnboarding()

	const [mode, setMode] = useState<'auto' | 'manual'>('auto')
	const [manualDate, setManualDate] = useState<Date | null>(null)

	// Note: bodyFat calc requires measurements we might not have in onboarding if neck/waist aren't asked.
	// We'll approximate for now or assume weight targets if they haven't set bodyFat

	const handleNext = () => {
		if (mode === 'manual') {
			if (!manualDate) {
				Toast.show({ type: 'error', text1: 'Please select a target date' })
				return
			}
			setTargetDate(manualDate)
			setWeeklyRate(0, weightUnit) // We'll compute it dynamically downstream
		} else {
			setTargetDate(null)
			// Apply recommended pace (simplified auto rate logic for onboarding MVP)
			if (fitnessGoal === 'loseWeight') {
				setWeeklyRate(0.5, 'kg') // Default conservative fat loss
			} else {
				setWeeklyRate(0.25, 'kg') // Default muscle gain
			}
		}

		router.push('/(auth)/onboarding/activity')
	}

	const handleBack = () => {
		router.back()
	}

	return (
		<SafeAreaView className="flex-1 bg-white dark:bg-black">
			<ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 100 }}>
				<Text className="mb-2 text-3xl font-bold text-black dark:text-white">
					How fast would you like to reach this?
				</Text>
				<Text className="mb-8 text-neutral-500 dark:text-neutral-400">
					Choose to let us recommend a safe pace, or set a target date.
				</Text>

				<View className="mb-8 flex-row gap-2">
					<SelectableCard
						title="Auto (Recommended)"
						selected={mode === 'auto'}
						onSelect={() => setMode('auto')}
						className="flex-1 p-4"
					/>
					<SelectableCard
						title="Choose End Date"
						selected={mode === 'manual'}
						onSelect={() => setMode('manual')}
						className="flex-1 p-4"
					/>
				</View>

				{mode === 'manual' && (
					<View className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-800 dark:bg-neutral-900">
						<Text className="mb-3 text-lg font-semibold text-black dark:text-white">Target Date</Text>
						<DateTimePicker
							value={manualDate || new Date()}
							onUpdate={setManualDate}
							isModal={true}
							dateOnly={true}
							title="Select End Date"
							textClassName="text-lg text-black dark:text-white text-center"
						/>
					</View>
				)}

				<View className="mt-8 rounded-xl bg-blue-50 p-4 dark:bg-blue-900/20">
					<Text className="text-sm text-blue-800 dark:text-blue-200">
						{mode === 'auto'
							? "We'll apply a scientifically safe weekly rate. For fat loss, this is usually 0.5% - 1% of body weight per week."
							: "We'll auto-calculate your required weekly deficit/surplus to hit this date. If it's too aggressive, you'll be warned."}
					</Text>
				</View>
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
						title="Next Step"
						variant="primary"
						onPress={handleNext}
						fullWidth
						rightIcon={<MaterialCommunityIcons name="chevron-right" size={24} color={colors.icon} />}
					/>
				</View>
			</View>
		</SafeAreaView>
	)
}
