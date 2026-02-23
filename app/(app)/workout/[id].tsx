import { Button } from '@/components/ui/Button'
import { DeleteConfirmModal, DeleteConfirmModalHandle } from '@/components/ui/DeleteConfirmModal'
import { ExerciseType, useExercise } from '@/stores/exerciseStore'
import { TemplateExercise, TemplateExerciseGroup } from '@/stores/template/types'
import { useTemplate } from '@/stores/templateStore'
import { useWorkout, WorkoutHistoryExercise, WorkoutHistorySet, WorkoutLogGroup } from '@/stores/workoutStore'
import { formatDate, formatDurationFromDates } from '@/utils/time'
import { calculateWorkoutMetrics } from '@/utils/workout'
import * as Crypto from 'expo-crypto'
import { router, useLocalSearchParams, useNavigation } from 'expo-router'
import React, { useEffect, useMemo, useRef } from 'react'
import { BackHandler, ScrollView, Text, View } from 'react-native'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'
import Toast from 'react-native-toast-message'

import { ReadOnlyExerciseRow } from '@/components/workout/ReadOnlyExerciseRow'
import { useThemeColor } from '@/hooks/useThemeColor'
import { useAuth } from '@/stores/authStore'
import { Image } from 'expo-image'

/* ───────────────── Component ───────────────── */

export default function WorkoutDetails() {
	/* Local State */
	const { id } = useLocalSearchParams<{ id: string }>()
	const safeAreaInsets = useSafeAreaInsets()
	const navigation = useNavigation()
	const isDark = useThemeColor().isDark

	const deleteModalRef = useRef<DeleteConfirmModalHandle>(null)
	const discardModalRef = useRef<DeleteConfirmModalHandle>(null)

	/* Store Related State */
	const { getWorkoutById, deleteWorkout } = useWorkout()
	const { exerciseList } = useExercise()
	const currentUserId = useAuth(state => state.user?.userId)

	/* Derived State */
	const exerciseTypeMap = useMemo(() => {
		const map = new Map<string, ExerciseType>()
		exerciseList.forEach(ex => {
			map.set(ex.id, ex.exerciseType)
		})
		return map
	}, [exerciseList])

	const workout = getWorkoutById(id!)

	const isAuthrized = currentUserId === workout?.user?.id

	const groupMap = useMemo(() => {
		const map = new Map<string, WorkoutLogGroup>()
		workout?.exerciseGroups.forEach(g => map.set(g.id, g))
		return map
	}, [workout?.exerciseGroups])

	/* Handlers */
	const handleEdit = () => {
		if (!workout) return

		const activeWorkout = useWorkout.getState().workout

		if (activeWorkout) {
			if (activeWorkout.id === workout.id) {
				// Resuming same edit
				router.push('/(app)/workout/start')
				return
			}

			// Warn about overwriting
			discardModalRef.current?.present()
		} else {
			useWorkout.getState().loadWorkoutHistory(workout)
			router.push('/(app)/workout/start')
		}
	}

	const handleDiscardConfirm = () => {
		if (!workout) return
		useWorkout.getState().discardWorkout()
		useWorkout.getState().loadWorkoutHistory(workout)
		// Modal auto dismisses on confirm
		router.push('/(app)/workout/start')
	}

	const handleDeleteConfirm = async () => {
		if (!workout) return
		// Modal auto dismisses on confirm

		Toast.show({
			type: 'success',
			text1: 'Workout deleted',
		})

		router.back()
		await deleteWorkout(workout.clientId, workout.id)
	}

	const handleSaveAsTemplate = () => {
		if (!workout) return

		const { startDraftTemplate } = useTemplate.getState()

		// 1. Create ID Mappings for Groups
		// We Map <OldDBGroupId, NewDraftGroupUUID>
		const groupIdMap = new Map<string, string>()
		workout.exerciseGroups.forEach(g => {
			groupIdMap.set(g.id, Crypto.randomUUID())
		})

		// 2. Clone Groups with New IDs
		const exerciseGroups: TemplateExerciseGroup[] = workout.exerciseGroups.map(
			(g: WorkoutLogGroup, gIdx: number) => ({
				id: groupIdMap.get(g.id)!, // Use the mapped new UUID
				groupIndex: gIdx,
				groupType: g.groupType,
				restSeconds: g.restSeconds ?? undefined,
			})
		)

		// 3. Clone Exercises & Sets with New IDs
		const exercises: TemplateExercise[] = workout.exercises.map((ex: WorkoutHistoryExercise, exIdx: number) => {
			// Resolve new Group ID if applicable
			const newGroupId = ex.exerciseGroupId ? groupIdMap.get(ex.exerciseGroupId) : undefined

			return {
				id: Crypto.randomUUID(), // New Draft Item UUID
				exerciseId: ex.exercise.id,
				exerciseIndex: exIdx,
				exerciseGroupId: newGroupId,
				sets: ex.sets.map((s: WorkoutHistorySet, sIdx: number) => ({
					id: Crypto.randomUUID(), // New Set UUID
					setIndex: sIdx,
					setType: s.setType,
					weight: s.weight ?? undefined,
					reps: s.reps ?? undefined,
					note: s.note ?? undefined,
					rpe: s.rpe ?? undefined,
					durationSeconds: s.durationSeconds ?? undefined,
					restSeconds: s.restSeconds ?? undefined,
				})),
			}
		})

		startDraftTemplate({
			title: workout.title || 'Untitled Workout',
			notes: 'Created from workout history',
			exercises: exercises,
			exerciseGroups: exerciseGroups,
		})

		router.push('/(app)/template/editor')
	}

	useEffect(() => {
		const rightIcons = [{ name: 'create-outline', onPress: handleEdit }]

		if (isAuthrized) {
			navigation.setOptions({
				rightIcons,
			})
		}
	}, [navigation])
	if (!workout) {
		return (
			<View className="flex-1 items-center justify-center bg-white dark:bg-black">
				<Text className="text-lg text-neutral-500">Workout not found</Text>
			</View>
		)
	}

	useEffect(() => {
		const onBackPress = () => {
			router.back()
			return true
		}

		const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress)

		return () => subscription.remove()
	}, [])

	const duration = formatDurationFromDates(workout.startTime, workout.endTime)

	const timeAgo = formatDate(new Date(workout.endTime))

	const { tonnage, completedSets } = calculateWorkoutMetrics(workout, exerciseTypeMap)

	/* UI Rendering */
	return (
		<SafeAreaView style={{ flex: 1 }} edges={['bottom']} className="bg-white dark:bg-black">
			<ScrollView
				className="flex-1 bg-white p-4 dark:bg-black"
				contentContainerStyle={{ paddingBottom: 120 }}
				showsVerticalScrollIndicator={false}
			>
				{/* Header */}
				<View className="mb-6 flex-col gap-2">
					<View className="w-2/3 flex-row items-center gap-4">
						<Image
							source={
								workout?.user?.profilePicUrl
									? { uri: workout.user.profilePicUrl }
									: require('../../../assets/images/icon.png')
							}
							style={{
								width: 48,
								height: 48,
								borderRadius: 100,
								borderColor: isDark ? 'white' : '#black',
								borderWidth: 0.25,
							}}
							contentFit="cover"
						/>
						<Text className="text-base text-black dark:text-white">
							{workout?.user?.firstName} {workout?.user?.lastName}
						</Text>
					</View>
					<View className="flex-row items-center justify-between">
						<Text className="flex-1 text-xl font-bold text-black dark:text-white">
							{workout.title || 'Workout'}
						</Text>
						{workout.isEdited && (
							<View className="rounded-full bg-neutral-100 px-3 py-1 dark:bg-neutral-800">
								<Text className="text-xs font-medium text-neutral-600 dark:text-neutral-400">
									Edited
								</Text>
							</View>
						)}
					</View>

					<Text className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
						{timeAgo} · {duration} · {tonnage.toLocaleString()} kg · {completedSets} sets
					</Text>
				</View>

				{/* Exercises */}
				{workout.exercises.map((ex: any) => {
					const groupDetails = ex.exerciseGroupId ? groupMap.get(ex.exerciseGroupId) : null

					return <ReadOnlyExerciseRow key={ex.id} exercise={ex} group={groupDetails} />
				})}
			</ScrollView>

			{/* Floating Action Button */}
			<View
				className="absolute bottom-0 left-0 right-0 border-t border-neutral-100 bg-white p-4 dark:border-neutral-900 dark:bg-black"
				style={{ paddingBottom: safeAreaInsets.bottom + 16 }}
			>
				<View className="flex-row items-center justify-center gap-4">
					<Button
						variant="primary"
						title="Save as Template"
						className="w-2/3"
						onPress={handleSaveAsTemplate}
					/>

					{isAuthrized && (
						<Button
							title="Delete"
							className="w-1/3"
							variant="danger"
							onPress={() => deleteModalRef.current?.present()}
						/>
					)}
				</View>
			</View>

			{/* Delete Confirmation Modal */}
			<DeleteConfirmModal
				ref={deleteModalRef}
				title="Delete Workout?"
				description="This workout and all its data will be permanently deleted. This action cannot be undone."
				onCancel={() => {}}
				onConfirm={handleDeleteConfirm}
			/>

			{/* Discard Confirmation Modal */}
			<DeleteConfirmModal
				ref={discardModalRef}
				title="Discard Current Workout?"
				description="You have an active workout in progress. Editing this history item will discard your current progress."
				confirmText="Discard & Edit"
				onCancel={() => {}}
				onConfirm={handleDiscardConfirm}
			/>
		</SafeAreaView>
	)
}
