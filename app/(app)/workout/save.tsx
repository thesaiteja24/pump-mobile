import { Button } from '@/components/ui/Button'
import DateTimePicker from '@/components/ui/DateTimePicker'
import VisibilitySelectionModal, { VisibilitySelectionModalHandle } from '@/components/workout/VisibilitySelectionModal'

import { useAuth } from '@/stores/authStore'
import { ExerciseType, useExercise } from '@/stores/exerciseStore'
import { useWorkout, VisibilityType, WorkoutLog } from '@/stores/workoutStore'

import { convertWeight } from '@/utils/converter'
import { buildPruneMessage, calculateWorkoutMetrics } from '@/utils/workout'

import { BottomSheetBackdrop, BottomSheetModal, BottomSheetView } from '@gorhom/bottom-sheet'
import { router } from 'expo-router'
import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Platform, Text, TextInput, useColorScheme, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Toast from 'react-native-toast-message'

export default function SaveWorkout() {
	/* Local State */
	const lineHeight = Platform.OS === 'ios' ? undefined : 28
	const insets = useSafeAreaInsets()

	const isDark = useColorScheme() === 'dark'

	const [pendingSave, setPendingSave] = useState<WorkoutLog | null>(null)
	const [pruneMessage, setPruneMessage] = useState<string | null>(null)
	const [visibility, setVisibility] = useState<VisibilityType>('public')

	const confirmModalRef = useRef<BottomSheetModal>(null)
	const visibilityModalRef = useRef<VisibilitySelectionModalHandle>(null)

	// Workout Store
	const workoutSaving = useWorkout(s => s.workoutSaving)
	const workout = useWorkout(s => s.workout)
	const updateWorkout = useWorkout(s => s.updateWorkout)
	const saveWorkout = useWorkout(s => s.saveWorkout)
	const discardWorkout = useWorkout(s => s.discardWorkout)

	const { exerciseList, getAllExercises } = useExercise()

	const preferredWeightUnit = useAuth(s => s.user?.preferredWeightUnit) ?? 'kg'

	/* Derived State */
	// Derived Map of exerciseId -> exerciseType
	const exerciseTypeMap = useMemo(() => {
		const map = new Map<string, ExerciseType>()
		exerciseList.forEach(ex => {
			map.set(ex.id, ex.exerciseType)
		})
		return map
	}, [exerciseList])

	// Workout summary
	const summary = useMemo(() => {
		if (!workout) {
			return {
				volume: 0,
				sets: 0,
				startTime: new Date(),
				endTime: new Date(),
			}
		}

		const { tonnage, completedSets } = calculateWorkoutMetrics(workout, exerciseTypeMap)

		return {
			volume: tonnage,
			sets: completedSets,
			startTime: new Date(workout.startTime),
			endTime: new Date(workout.endTime),
		}
	}, [workout, exerciseTypeMap])

	/* Handlers */
	const commitSave = (workoutToSave: WorkoutLog) => {
		saveWorkout(workoutToSave)

		Toast.show({
			type: 'success',
			text1: 'Workout saved!',
		})

		discardWorkout()
		router.replace('/(app)/(tabs)/workout')
	}

	const handleConfirmSave = async () => {
		const startTime = workout?.startTime
		const endTime = workout?.endTime

		if (!startTime || !endTime) {
			Toast.show({
				type: 'error',
				text1: 'Invalid workout time',
				text2: 'Start time and end time must be set.',
			})
			return
		}

		if (new Date(startTime) > new Date(endTime)) {
			Toast.show({
				type: 'error',
				text1: 'Invalid workout time',
				text2: 'Workout cannot end before it starts.',
			})
			return
		}

		const prepared = useWorkout.getState().prepareWorkoutForSave()
		if (!prepared) return

		if (prepared.workout.exercises.length === 0) {
			Toast.show({
				type: 'error',
				text1: 'No valid exercises',
				text2: 'Add at least one completed set to save.',
			})
			return
		}

		const message = buildPruneMessage(prepared.pruneReport)

		if (message) {
			setPendingSave(prepared.workout)
			setPruneMessage(message)
			confirmModalRef.current?.present()
			return // stop here, wait for confirmation
		}

		// no pruning → save immediately
		await commitSave(prepared.workout)
	}

	/* Effects */
	// Set end time to now on mount ONLY if creating a new workout
	useEffect(() => {
		if (workout && !workout.id) {
			updateWorkout({ endTime: new Date() })
		}
	}, [])

	useEffect(() => {
		if (!exerciseList.length) {
			getAllExercises()
		}
	}, [exerciseList.length])

	/* UI Rendering */
	if (!workout) {
		return <View className="flex-1 bg-white dark:bg-black" />
	}

	const isEditing = !!workout.id

	return (
		<View style={{ paddingBottom: insets.bottom }} className="flex-1 bg-white p-4 dark:bg-black">
			{/* ───── Title ───── */}
			<Text className="mb-1 text-neutral-500">Workout title</Text>
			<TextInput
				value={workout.title ?? ''}
				onChangeText={text => updateWorkout({ title: text })}
				className="rounded-xl border border-neutral-300 px-4 py-3 text-lg text-black dark:border-neutral-700 dark:text-white"
				style={{ lineHeight }}
			/>

			{/* ───── Summary ───── */}
			<View className="mt-6 flex-col gap-4">
				<Text className="text-lg font-semibold text-black dark:text-white">Summary</Text>

				<View className="rounded-xl border border-neutral-200 p-4 dark:border-neutral-800">
					<View className="flex-row justify-between">
						{/* LEFT */}
						<View className="flex-1 gap-4">
							<View className="gap-1">
								<Text className="text-sm text-neutral-500">Started</Text>
								<DateTimePicker
									title="Workout Started"
									value={summary.startTime}
									onUpdate={date => updateWorkout({ startTime: date })}
								/>
							</View>

							<View className="gap-1">
								<Text className="text-sm text-neutral-500">Ended</Text>
								<DateTimePicker
									title="Workout Ended"
									value={summary.endTime}
									onUpdate={date => updateWorkout({ endTime: date })}
								/>
							</View>
						</View>

						{/* RIGHT */}
						<View className="flex-1 items-end gap-4">
							<View className="items-end gap-1">
								<Text className="text-sm text-neutral-500">Volume</Text>
								<Text className="text-base font-medium text-black dark:text-white">
									{convertWeight(summary.volume)} {preferredWeightUnit}
								</Text>
							</View>

							<View className="items-end gap-1">
								<Text className="text-sm text-neutral-500">Sets</Text>
								<Text className="text-base font-medium text-black dark:text-white">{summary.sets}</Text>
							</View>
						</View>
					</View>
				</View>

				<View className="rounded-xl border border-neutral-200 p-4 dark:border-neutral-800">
					<View className="flex-row justify-between">
						{/* LEFT */}
						<View className="flex-1 gap-4">
							<View className="gap-1">
								<Text className="text-base font-medium text-black dark:text-white">Visibility</Text>
							</View>
						</View>

						{/* RIGHT */}
						<View className="flex-1 items-end gap-4">
							<Text
								onPress={() => visibilityModalRef.current?.present()}
								className="text-base font-semibold text-blue-500"
							>
								{visibility.slice(0, 1).toUpperCase() + visibility.slice(1)}
							</Text>
						</View>
					</View>
				</View>
			</View>

			{/* ───── Actions ───── */}
			<View className="mt-auto gap-3">
				<Button
					title={isEditing ? 'Save Edits' : 'Save Workout'}
					variant="primary"
					loading={workoutSaving}
					onPress={handleConfirmSave}
				/>
				<Button
					title={isEditing ? 'Discard Changes' : 'Back to Workout'}
					variant="secondary"
					disabled={workoutSaving}
					onPress={() => router.back()}
				/>
			</View>

			<VisibilitySelectionModal
				ref={visibilityModalRef}
				currentType={visibility}
				onSelect={type => {
					setVisibility(type)
					updateWorkout({ visibility: type })
				}}
				onClose={() => visibilityModalRef.current?.dismiss()}
			/>

			{/* Confirm save modal */}
			<BottomSheetModal
				ref={confirmModalRef}
				index={0}
				enableDynamicSizing={true}
				backdropComponent={props => (
					<BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} opacity={0.4} />
				)}
				backgroundStyle={{
					backgroundColor: isDark ? '#171717' : 'white',
				}}
				handleIndicatorStyle={{
					backgroundColor: isDark ? '#525252' : '#d1d5db',
				}}
				onDismiss={() => {
					setPendingSave(null)
					setPruneMessage(null)
				}}
				// Smoother, slightly slower animation
				animationConfigs={{
					duration: 350,
				}}
			>
				<BottomSheetView
					style={{ paddingBottom: insets.bottom + 24 }}
					className="px-6 pt-2 dark:bg-neutral-900"
				>
					<Text className="text-lg font-semibold text-black dark:text-white">Before saving</Text>

					<Text className="mt-2 text-sm text-neutral-600 dark:text-neutral-300">{pruneMessage}</Text>

					<View className="mt-6 flex-row gap-3">
						<View className="flex-1">
							<Button
								title="Cancel"
								variant="secondary"
								onPress={() => {
									confirmModalRef.current?.dismiss()
								}}
							/>
						</View>

						<View className="flex-1">
							<Button
								title="Save anyway"
								variant="primary"
								onPress={() => {
									const workout = pendingSave!
									confirmModalRef.current?.dismiss()
									commitSave(workout)
								}}
							/>
						</View>
					</View>
				</BottomSheetView>
			</BottomSheetModal>
		</View>
	)
}
