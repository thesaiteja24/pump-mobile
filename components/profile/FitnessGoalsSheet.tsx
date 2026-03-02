import { Button } from '@/components/ui/Button'
import DateTimePicker from '@/components/ui/DateTimePicker'
import { SelectableCard } from '@/components/ui/SelectableCard'
import { useAuth } from '@/stores/authStore'
import { calculateBodyFat } from '@/utils/analytics'
import { BottomSheetBackdrop, BottomSheetModal, BottomSheetScrollView } from '@gorhom/bottom-sheet'
import React, { forwardRef, useEffect, useMemo, useState } from 'react'
import { BackHandler, Keyboard, Text, TextInput, View, useColorScheme } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Toast from 'react-native-toast-message'

type TargetType = 'weight' | 'bodyFat'
type PlanningMode = 'rateDriven' | 'dateDriven'

export const FitnessGoalsSheet = forwardRef<BottomSheetModal>((props, ref) => {
	const [isOpen, setIsOpen] = useState(false)
	const isDarkMode = useColorScheme() === 'dark'
	const insets = useSafeAreaInsets()

	const user = useAuth(s => s.user)
	const currentWeight = user?.weight
	const height = user?.height
	const gender = user?.gender
	const neck = user?.measurements?.[0]?.neck
	const waist = user?.measurements?.[0]?.waist
	const hips = user?.measurements?.[0]?.hips

	const currentBodyFat = calculateBodyFat({
		gender: gender!,
		height: Number(height),
		neck: Number(neck),
		waist: Number(waist),
		hips: hips ? Number(hips) : undefined,
	})

	const [goalType, setGoalType] = useState<string | null>(null)

	const [targetType, setTargetType] = useState<TargetType>('weight')
	const [targetValue, setTargetValue] = useState('')
	const [weeklyRate, setWeeklyRate] = useState('0.5') // kg or %
	const [targetDate, setTargetDate] = useState<Date | null>(null)
	const [mode, setMode] = useState<PlanningMode>('rateDriven')

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

	const handleSave = () => {
		Keyboard.dismiss()

		const payload = {
			goalType,
			targetType,
			targetValue: Number(targetValue),
			weeklyRate: Number(finalRate),
			targetDate: finalTargetDate,
		}

		console.log('TEMP GOAL PAYLOAD:', payload)

		Toast.show({
			type: 'success',
			text1: 'Goal configured (temporary)',
		})

		// @ts-ignore
		ref?.current?.dismiss()
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
			backgroundStyle={{
				backgroundColor: isDarkMode ? '#171717' : 'white',
			}}
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
					<GoalCard
						title="Recomposition"
						selected={goalType === 'recomp'}
						onSelect={() => setGoalType('recomp')}
					/>
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
						className="mt-2 rounded-xl border border-neutral-200 bg-neutral-50 p-3 text-lg dark:border-neutral-800 dark:bg-neutral-900"
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
							className="mt-2 rounded-xl border border-neutral-200 bg-neutral-50 p-3 text-lg dark:border-neutral-800 dark:bg-neutral-900"
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

				<Button title="Save Goal Plan" variant="primary" onPress={handleSave} />
			</BottomSheetScrollView>
		</BottomSheetModal>
	)
})

function GoalCard({ selected, onSelect, title }: any) {
	return <SelectableCard selected={selected} onSelect={onSelect} title={title} className="basis-[48%] px-3 py-3" />
}

FitnessGoalsSheet.displayName = 'FitnessGoalsSheet'

export default FitnessGoalsSheet
