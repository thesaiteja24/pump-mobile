import { Button } from '@/components/ui/Button'
import { ElapsedTime } from '@/components/workout/ElapsedTime'
import ExerciseGroupModal, { ExerciseGroupModalHandle } from '@/components/workout/ExerciseGroupModal'
import ExerciseRow from '@/components/workout/ExerciseRow'
import RestTimerSnack from '@/components/workout/RestTimerSnack'

import { useExercises } from '@/hooks/queries/useExercises'
import { useUserQuery } from '@/hooks/queries/useUser'
import { useAuth } from '@/stores/authStore'
import { SelfUser } from '@/types/user'
import { Exercise, ExerciseType } from '@/types/exercises'
import { ExerciseGroupType, WorkoutLogGroup } from '@/types/workout'
import { useWorkout } from '@/stores/workoutStore'

import { convertWeight } from '@/utils/converter'
import { calculateWorkoutMetrics } from '@/utils/workout'

import { Ionicons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import { router, useNavigation } from 'expo-router'

import { DeleteConfirmModal, DeleteConfirmModalHandle } from '@/components/ui/DeleteConfirmModal'
import { useThemeColor } from '@/hooks/useThemeColor'
import { usePreventRemove } from '@react-navigation/native'
import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { Keyboard, KeyboardAvoidingView, Text, useColorScheme, Vibration, View } from 'react-native'
import DraggableFlatList from 'react-native-draggable-flatlist'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Toast from 'react-native-toast-message'

export default function StartWorkout() {
	const colors = useThemeColor()

	/* Local State */
	const isDark = useColorScheme() === 'dark'
	const safeAreaInsets = useSafeAreaInsets()
	const navigation = useNavigation()

	const [isDragging, setIsDragging] = useState(false)
	const [keyboardVisible, setKeyboardVisible] = useState(false)
	// state for grouping mode (superset/giantset) and selected exercise
	const [groupingMode, setGroupingMode] = useState<{
		type: ExerciseGroupType
		sourceExerciseId: string
	} | null>(null)
	// selected exercises for grouping
	const [selectedGroupExerciseIds, setSelectedGroupExerciseIds] = useState<Set<string>>(new Set())

	const exerciseGroupModalRef = useRef<ExerciseGroupModalHandle>(null)
	const discardConfirmModalRef = useRef<DeleteConfirmModalHandle>(null)

	const lastIndexRef = useRef<number | null>(null)
	const prevCompletedRef = useRef<Map<string, boolean>>(new Map())

	// Workout Store
	const workoutSaving = useWorkout(s => s.workoutSaving)
	const workout = useWorkout(s => s.workout)

	// Refs for stable callbacks
	const workoutRef = useRef(workout)
	const workoutSavingRef = useRef(workoutSaving)

	useEffect(() => {
		workoutRef.current = workout
	}, [workout])

	useEffect(() => {
		workoutSavingRef.current = workoutSaving
	}, [workoutSaving])
	const rest = useWorkout(s => s.rest)
	const startWorkout = useWorkout(s => s.startWorkout)
	const discardWorkout = useWorkout(s => s.discardWorkout)
	const removeExercise = useWorkout(s => s.removeExercise)
	const reorderExercises = useWorkout(s => s.reorderExercises)
	const createExerciseGroup = useWorkout(s => s.createExerciseGroup)
	const removeExerciseFromGroup = useWorkout(s => s.removeExerciseFromGroup)
	const addSet = useWorkout(s => s.addSet)
	const updateSet = useWorkout(s => s.updateSet)
	const toggleSetCompleted = useWorkout(s => s.toggleSetCompleted)
	const removeSet = useWorkout(s => s.removeSet)
	const startSetTimer = useWorkout(s => s.startSetTimer)
	const stopSetTimer = useWorkout(s => s.stopSetTimer)
	const startRestTimer = useWorkout(s => s.startRestTimer)
	const saveRestForSet = useWorkout(s => s.saveRestForSet)
	const stopRestTimer = useWorkout(s => s.stopRestTimer)
	const adjustRestTimer = useWorkout(s => s.adjustRestTimer)

	// Exercises (TanStack Query)
	const { data: exerciseList = [] } = useExercises()

	// Auth Store
	const currentUserId = useAuth(s => s.userId)
	const { data: userData } = useUserQuery(currentUserId!)
	const user = userData as SelfUser | null
	const preferredWeightUnit = user?.preferredWeightUnit ?? 'kg'

	/* Derived State */
	// Derived Map of exerciseId -> exerciseType
	const exerciseTypeMap = useMemo(() => {
		const map = new Map<string, ExerciseType>()
		exerciseList.forEach(ex => {
			map.set(ex.id, ex.exerciseType)
		})
		return map
	}, [exerciseList])

	// Derived Map of exerciseId -> Exercise
	const exerciseMap = useMemo<Map<string, Exercise>>(() => new Map(exerciseList.map(e => [e.id, e])), [exerciseList])

	// Derived Map of exerciseGroupId -> WorkoutLogGroup
	const exerciseGroupMap = useMemo<Map<string, WorkoutLogGroup>>(
		() => new Map(workout?.exerciseGroups.map(g => [g.id, g]) || []),
		[workout?.exerciseGroups]
	)

	// Exercises in the workout formatted for grouping
	const workoutExercisesForGrouping = useMemo(() => {
		if (!workout || !groupingMode) return []

		return workout.exercises
			.map(we => {
				const ex = exerciseMap.get(we.exerciseId)
				if (!ex) return null

				return {
					id: ex.id,
					title: ex.title,
					thumbnailUrl: ex.thumbnailUrl,
					selected: selectedGroupExerciseIds.has(ex.id),
					disabled: Boolean(we.groupId) && !selectedGroupExerciseIds.has(ex.id),
				}
			})
			.filter((item): item is NonNullable<typeof item> => item !== null)
	}, [workout, groupingMode, selectedGroupExerciseIds, exerciseMap])

	/* Handlers */
	const handleOpenSave = useCallback(() => {
		Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)

		const currentWorkout = workoutRef.current
		if (!currentWorkout) return

		if (currentWorkout.exercises.length === 0) {
			Toast.show({
				type: 'error',
				text1: 'No exercises added',
				text2: 'Add at least one exercise to continue.',
			})
			return
		}

		let valid = 0
		currentWorkout.exercises.forEach(ex => {
			const exerciseType = exerciseTypeMap.get(ex.exerciseId)
			if (!exerciseType) return

			ex.sets.forEach(set => {
				if (!set.completed) return

				const reps = set.reps ?? 0
				const weight = set.weight ?? 0
				const duration = set.durationSeconds ?? 0

				switch (exerciseType) {
					case 'repsOnly':
						if (reps > 0) valid += 1
						break
					case 'durationOnly':
						if (duration > 0) valid += 1
						break
					case 'weighted':
					case 'assisted':
						if (reps > 0 && weight > 0) valid += 1
						break
				}
			})
		})

		if (valid === 0) {
			Toast.show({
				type: 'error',
				text1: 'No valid sets added',
				text2: 'Add at least one valid set to continue.',
				onPress: () => Toast.hide(),
			})
			return
		}

		router.push('/(app)/workout/save')
	}, [exerciseTypeMap])

	const handleConfirmExerciseGroup = () => {
		// if no grouping mode or less than 2 exercises selected, do nothing
		if (!groupingMode || selectedGroupExerciseIds.size < 2) {
			return
		}

		// Create the exercise group
		createExerciseGroup(groupingMode.type, Array.from(selectedGroupExerciseIds))

		// Reset local UI state
		setGroupingMode(null)
		setSelectedGroupExerciseIds(new Set())
		exerciseGroupModalRef.current?.dismiss()
	}

	usePreventRemove(Boolean(workout?.id), () => {
		discardConfirmModalRef.current?.present()
	})

	/* Effects */
	// Start a new workout if none exists
	useEffect(() => {
		if (!workout) startWorkout()
	}, [startWorkout, workout])

	// Set Completion Effect - Start/Stop rest timer based on set completion
	useEffect(() => {
		if (!workout) return

		workout.exercises.forEach(exercise => {
			exercise.sets.forEach(set => {
				const key = `${exercise.exerciseId}:${set.id}`
				const prevCompleted = prevCompletedRef.current.get(key) ?? false

				if (!prevCompleted && set.completed && set.restSeconds) {
					startRestTimer(set.restSeconds)
				}

				if (prevCompleted && !set.completed) {
					stopRestTimer()
				}

				prevCompletedRef.current.set(key, set.completed)
			})
		})
	}, [workout, startRestTimer, stopRestTimer])

	// Navigation Options Effect
	const handleLeftPress = useCallback(() => {
		if (workoutRef.current?.id) {
			discardConfirmModalRef.current?.present()
			return
		}
		router.back()
	}, [])

	useLayoutEffect(() => {
		navigation.setOptions({
			onLeftPress: handleLeftPress,
			headerBackButtonMenuEnabled: false,
			rightIcons: [
				{
					name: 'checkmark-done',
					onPress: workoutSaving ? undefined : handleOpenSave,
					disabled: workoutSaving,
					color: 'green',
				},
			],
		})
	}, [navigation, handleLeftPress, handleOpenSave, workoutSaving])

	useEffect(() => {
		const showSub = Keyboard.addListener('keyboardDidShow', () => setKeyboardVisible(true))
		const hideSub = Keyboard.addListener('keyboardDidHide', () => setKeyboardVisible(false))

		return () => {
			showSub.remove()
			hideSub.remove()
		}
	}, [])

	/* UI Rendering */
	if (!workout) {
		return <View className="flex-1 bg-white dark:bg-black" />
	}

	return (
		<View style={{ paddingBottom: safeAreaInsets.bottom }} className="flex-1 bg-white dark:bg-black">
			{/* ───── Top bar ───── */}
			<View className="flex-row items-center justify-between gap-2 border-b border-neutral-200 p-4 dark:border-neutral-800">
				<View className="flex flex-row gap-2">
					<Ionicons
						name={workout.id ? 'create-outline' : 'hourglass-outline'}
						size={20}
						color={colors.icon}
					/>

					{workout.id ? (
						<ElapsedTime
							baseSeconds={Math.floor((workout.endTime.getTime() - workout.startTime.getTime()) / 1000)}
							textClassName="text-lg font-semibold text-primary"
						/>
					) : (
						<ElapsedTime startTime={workout.startTime} textClassName="text-lg font-semibold text-primary" />
					)}
				</View>
				<View className="flex flex-row gap-2">
					<Text className="text-sm text-black dark:text-white">Volume: </Text>
					<Text className="text-sm text-black dark:text-white">
						{/* converts from KG to User preferred unit as we by default store as kg */}
						{convertWeight(calculateWorkoutMetrics(workout, exerciseTypeMap).tonnage)} {preferredWeightUnit}
					</Text>
				</View>
				<View className="flex flex-row gap-2">
					<Text className="text-sm text-black dark:text-white">Sets: </Text>
					<Text className="text-sm text-black dark:text-white">
						{calculateWorkoutMetrics(workout, exerciseTypeMap).completedSets}
					</Text>
				</View>
			</View>
			<KeyboardAvoidingView
				style={{ flex: 1, backgroundColor: 'transparent' }}
				behavior={keyboardVisible ? 'padding' : undefined}
				keyboardVerticalOffset={100}
			>
				{/* ───── Exercises list ───── */}
				<DraggableFlatList
					data={workout.exercises}
					keyExtractor={item => item.exerciseId}
					activationDistance={12}
					showsVerticalScrollIndicator={false}
					contentContainerStyle={{ marginBottom: safeAreaInsets.bottom }}
					onPlaceholderIndexChange={index => {
						if (lastIndexRef.current !== index) {
							lastIndexRef.current = index
							Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
						}
					}}
					onDragBegin={index => {
						setIsDragging(true)
						lastIndexRef.current = index
						Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
					}}
					onDragEnd={({ data }) => {
						setIsDragging(false)
						reorderExercises(data)
					}}
					renderItem={({ item, drag, isActive }) => {
						const details = exerciseMap.get(item.exerciseId)
						const groupDetails = exerciseGroupMap.get(item.groupId || '')
						if (!details) return null

						return (
							<ExerciseRow
								exercise={item}
								exerciseDetails={details}
								isActive={isActive}
								isDragging={isDragging}
								groupDetails={groupDetails}
								drag={drag}
								preferredWeightUnit={preferredWeightUnit}
								onPress={() => router.navigate(`/(app)/exercises/${item.exerciseId}/(tabs)/summary`)}
								onReplaceExercise={() =>
									router.push({
										pathname: '/(app)/exercises',
										params: { replace: item.exerciseId },
									})
								}
								onRemoveExerciseGroup={() => {
									removeExerciseFromGroup(item.exerciseId)
									exerciseGroupModalRef.current?.dismiss()
								}}
								onCreateSuperSet={() => {
									setGroupingMode({
										type: 'superSet',
										sourceExerciseId: item.exerciseId,
									})

									setSelectedGroupExerciseIds(new Set([item.exerciseId]))
									exerciseGroupModalRef.current?.present()
								}}
								onCreateGiantSet={() => {
									setGroupingMode({
										type: 'giantSet',
										sourceExerciseId: item.exerciseId,
									})

									setSelectedGroupExerciseIds(new Set([item.exerciseId]))
									exerciseGroupModalRef.current?.present()
								}}
								onDeleteExercise={() => removeExercise(item.exerciseId)}
								onAddSet={addSet}
								onUpdateSet={updateSet}
								onToggleCompleteSet={toggleSetCompleted}
								onDeleteSet={removeSet}
								onStartSetTimer={startSetTimer}
								onStopSetTimer={stopSetTimer}
								onSaveRestPreset={saveRestForSet}
							/>
						)
					}}
					ListEmptyComponent={
						<View className="flex-1 items-center justify-center px-6 py-20">
							<Ionicons name="accessibility-outline" size={40} color={isDark ? '#9ca3af' : '#6b7280'} />

							<Text className="mt-4 text-lg font-semibold text-neutral-700 dark:text-neutral-300">
								No exercises yet
							</Text>

							<Text className="mt-2 text-center text-sm text-neutral-500 dark:text-neutral-400">
								Add an exercise to start your workout
							</Text>
						</View>
					}
					ListFooterComponent={
						<View className="mb-[50%] p-4">
							<Button
								title="Add an Exercise"
								onPress={() =>
									router.push({
										pathname: '/(app)/exercises',
										params: { mode: 'select' },
									})
								}
							/>
						</View>
					}
				/>
			</KeyboardAvoidingView>
			<RestTimerSnack
				visible={rest.running}
				startedAt={rest.startedAt}
				targetSeconds={rest.seconds ?? 0}
				onAddTime={adjustRestTimer}
				onSkip={stopRestTimer}
				onComplete={() => {
					Vibration.vibrate([0, 500, 200, 500, 200, 500])
					stopRestTimer()
				}}
			/>

			{/* Superset and Giantset Modal */}
			<ExerciseGroupModal
				ref={exerciseGroupModalRef}
				exercises={workoutExercisesForGrouping}
				onSelect={exercise => {
					if (!exercise || exercise.disabled) return

					setSelectedGroupExerciseIds(prev => {
						const next = new Set(prev)

						// Deselect if already selected
						if (next.has(exercise.id)) {
							if (exercise.id === groupingMode?.sourceExerciseId) {
								return prev
							}
							next.delete(exercise.id)
							return next
						}

						// For supersets, limit to 2 exercises
						if (groupingMode?.type === 'superSet' && next.size >= 2) {
							return prev
						}

						// Select exercise
						next.add(exercise.id)
						return next
					})
				}}
				onConfirm={handleConfirmExerciseGroup} // ADD
				onClose={() => {
					setGroupingMode(null)
					setSelectedGroupExerciseIds(new Set())
				}}
			/>

			<DeleteConfirmModal
				ref={discardConfirmModalRef}
				title="Discard Changes?"
				description="You have unsaved changes. Are you sure you want to discard them?"
				confirmText="Discard"
				onConfirm={() => {
					discardWorkout()
					router.back()
				}}
				onCancel={() => {}}
			/>
		</View>
	)
}
