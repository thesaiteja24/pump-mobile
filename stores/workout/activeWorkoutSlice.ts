import { enqueueWorkoutCreate, enqueueWorkoutUpdate } from '@/lib/sync/queue'
import { SyncStatus } from '@/lib/sync/types'
import { WorkoutTemplate } from '@/stores/template/types'
import { serializeWorkoutForApi } from '@/utils/serializeForApi'
import { finalizeSetTimer, isValidCompletedSet } from '@/utils/workout'
import * as Crypto from 'expo-crypto'
import { StateCreator } from 'zustand'
import { useAuth } from '../authStore'
import { ExerciseType, useExercise } from '../exerciseStore'
import {
	ExerciseGroupType,
	WorkoutHistoryItem,
	WorkoutLog,
	WorkoutLogExercise,
	WorkoutLogSet,
	WorkoutPruneReport,
	WorkoutState,
} from './types'

export interface ActiveWorkoutSlice {
	workoutSaving: boolean
	workout: WorkoutLog | null

	startWorkout: () => void
	loadWorkoutHistory: (historyItem: WorkoutHistoryItem) => void
	loadTemplate: (template: WorkoutTemplate) => void
	updateWorkout: (patch: Partial<WorkoutLog>) => void
	prepareWorkoutForSave: () => {
		workout: WorkoutLog
		pruneReport: WorkoutPruneReport
	} | null
	saveWorkout: (prepared: WorkoutLog) => Promise<{ success: boolean; error?: any }>
	resetWorkout: () => void
	discardWorkout: () => void

	addExercise: (exerciseId: string) => void
	removeExercise: (exerciseId: string) => void
	replaceExercise: (oldId: string, newId: string) => void
	reorderExercises: (ordered: WorkoutLogExercise[]) => void
	createExerciseGroup: (type: ExerciseGroupType, exerciseIds: string[]) => void
	removeExerciseFromGroup: (exerciseId: string) => void

	addSet: (exerciseId: string) => void
	updateSet: (exerciseId: string, setId: string, patch: Partial<WorkoutLogSet>) => void
	toggleSetCompleted: (exerciseId: string, setId: string) => void
	removeSet: (exerciseId: string, setId: string) => void

	startSetTimer: (exerciseId: string, setId: string) => void
	stopSetTimer: (exerciseId: string, setId: string) => void
}

export const createActiveWorkoutSlice: StateCreator<WorkoutState, [], [], ActiveWorkoutSlice> = (set, get) => ({
	workoutSaving: false,
	workout: null,

	/**
	 * This function is used to start a new workout
	 * used in start.tsx using useEffect to start a new workout when the component mounts
	 */
	startWorkout: () => {
		if (get().workout) return

		// Generate clientId at creation time (stable identifier)
		const clientId = Crypto.randomUUID()

		set({
			workout: {
				clientId,
				id: null, // No DB ID until synced
				syncStatus: 'pending' as SyncStatus,
				title: 'New Workout',
				startTime: new Date(),
				endTime: new Date(),
				exercises: [],
				exerciseGroups: [],
			},
		})
	},

	/**
	 * This function is used to discard the active workout
	 * Used in index.tsx(WorkoutScreen) when the user clicks on the discard button
	 * Used in [id].tsx(WorkoutDetails) when the user decides to edit previous workout
	 * but an workout is already active
	 * Used in save.tsx(SaveWorkout) to save the workout and reset the workout state
	 * Used in start.tsx to reset the workout state when leaving from editing a workout
	 */
	discardWorkout: () => {
		set({
			workout: null,
			rest: {
				seconds: null,
				startedAt: null,
				running: false,
			},
		})
	},

	/**
	 * This function is used to update the active workout
	 * used in index.tsx(WorkoutScreen) when the user updates the workout
	 * used in [id].tsx(WorkoutDetails) when user is editing the workout
	 * used multiple times in save.tsx(SaveWorkout)
	 */
	updateWorkout: patch =>
		set(state => {
			if (!state.workout) return state

			return {
				workout: {
					...state.workout,
					...patch,
				},
			}
		}),

	prepareWorkoutForSave: () => {
		const workout = get().workout
		if (!workout) return null

		const exerciseList = useExercise.getState().exerciseList
		const exerciseMap = new Map(exerciseList.map(e => [e.id, e.exerciseType]))

		let droppedSets = 0
		let droppedExercises = 0
		let droppedGroups = 0

		const finalizedExercises: WorkoutLogExercise[] = []

		for (const ex of workout.exercises) {
			const type = exerciseMap.get(ex.exerciseId)
			if (!type) continue

			const finalizedSets = ex.sets.map(finalizeSetTimer)
			const validSets = finalizedSets.filter(set => isValidCompletedSet(set, type))

			droppedSets += finalizedSets.length - validSets.length

			if (validSets.length === 0) {
				droppedExercises += 1
				continue
			}

			finalizedExercises.push({ ...ex, sets: validSets })
		}

		const finalizedWorkout: WorkoutLog = {
			...workout,
			endTime: workout.endTime ?? new Date(),
			exercises: finalizedExercises,
		}

		// group pruning
		const groupCounts = new Map<string, number>()
		for (const ex of finalizedWorkout.exercises) {
			if (ex.groupId) {
				groupCounts.set(ex.groupId, (groupCounts.get(ex.groupId) ?? 0) + 1)
			}
		}

		const validGroupIds = new Set([...groupCounts.entries()].filter(([, c]) => c >= 2).map(([id]) => id))

		droppedGroups =
			finalizedWorkout.exerciseGroups.length -
			finalizedWorkout.exerciseGroups.filter(g => validGroupIds.has(g.id)).length

		finalizedWorkout.exerciseGroups = finalizedWorkout.exerciseGroups.filter(g => validGroupIds.has(g.id))

		finalizedWorkout.exercises = finalizedWorkout.exercises.map(ex =>
			ex.groupId && !validGroupIds.has(ex.groupId) ? { ...ex, groupId: null } : ex
		)

		return {
			workout: finalizedWorkout,
			pruneReport: {
				droppedSets,
				droppedExercises,
				droppedGroups,
			},
		}
	},

	/**
	 * This function is used to load a workout history item into the active workout state
	 * It is used when the user wants to edit a previous workout
	 */
	loadWorkoutHistory: (historyItem: WorkoutHistoryItem) => {
		// Map history item to active workout state
		const workoutLog: WorkoutLog = {
			clientId: historyItem.clientId,
			id: historyItem.id,
			syncStatus: 'synced' as SyncStatus, // Editing a synced workout
			title: historyItem.title || 'Untitled Workout',
			startTime: new Date(historyItem.startTime),
			endTime: new Date(historyItem.endTime),
			isEdited: true, // Mark as edited since we're modifying
			editedAt: new Date(),
			exercises: historyItem.exercises.map(ex => ({
				exerciseId: ex.exerciseId,
				exerciseIndex: ex.exerciseIndex,
				groupId: ex.exerciseGroupId,
				sets: ex.sets.map(s => ({
					id: s.id,
					setIndex: s.setIndex,
					setType: s.setType,
					weight: s.weight ?? undefined,
					reps: s.reps ?? undefined,
					rpe: s.rpe ?? undefined,
					durationSeconds: s.durationSeconds ?? undefined,
					restSeconds: s.restSeconds ?? undefined,
					note: s.note ?? undefined,
					completed: true, // past workouts are completed
				})),
			})),
			exerciseGroups: historyItem.exerciseGroups.map(g => ({
				id: g.id,
				groupType: g.groupType,
				groupIndex: g.groupIndex,
				restSeconds: g.restSeconds,
			})),
		}

		set({ workout: workoutLog })
	},

	/**
	 * This function is used to load a workout template into the active workout state
	 * It is used when the user wants to start a new workout from a template
	 * It is called in StartWorkoutFromTemplate() in templateStore
	 */
	loadTemplate: (template: WorkoutTemplate) => {
		const exerciseStore = useExercise.getState()
		const exerciseMap = new Map(exerciseStore.exerciseList.map(e => [e.id, e]))

		// Validate and filter exercises that still exist
		const validExercises = template.exercises.filter(ex => {
			const exists = exerciseMap.has(ex.exerciseId)
			if (!exists) {
				console.warn(
					`Exercise ${ex.exerciseId} from template "${template.title}" not found in exercise store, skipping`
				)
			}
			return exists
		})

		// Generate clientId at creation time (stable identifier)
		const clientId = Crypto.randomUUID()

		// Map template to NEW active workout state
		const workoutLog: WorkoutLog = {
			clientId,
			id: null, // No DB ID until synced
			syncStatus: 'pending' as SyncStatus,
			title: template.title || 'New Workout',
			startTime: new Date(),
			endTime: new Date(),
			exercises: validExercises.map((ex, index) => ({
				exerciseId: ex.exerciseId,
				exerciseIndex: index,
				groupId: ex.exerciseGroupId || null,
				sets: ex.sets.map(s => ({
					id: Crypto.randomUUID(),
					setIndex: s.setIndex,
					setType: s.setType,
					weight: s.weight,
					reps: s.reps,
					rpe: s.rpe,
					durationSeconds: s.durationSeconds,
					restSeconds: s.restSeconds,
					note: s.note,
					completed: false,
				})),
			})),
			exerciseGroups: template.exerciseGroups.map(g => ({
				id: g.id,
				groupType: g.groupType,
				groupIndex: g.groupIndex,
				restSeconds: g.restSeconds,
			})),
		}

		set({ workout: workoutLog })
	},

	/**
	 * Save workout with optimistic-first approach:
	 * 1. Always update local state immediately (no network delay for user)
	 * 2. Enqueue for background sync (useSyncQueue handles sync reactively)
	 */
	saveWorkout: async (prepared: WorkoutLog) => {
		set({ workoutSaving: true })

		const userId = useAuth.getState().user?.userId
		if (!userId) {
			set({ workoutSaving: false })
			return { success: false, error: 'No user logged in' }
		}

		// Use the clientId from the prepared workout (set at creation time)
		const { clientId } = prepared

		// --- Helper to create optimistic history item ---
		const createOptimisticItem = (log: WorkoutLog, syncStatus: SyncStatus): WorkoutHistoryItem => ({
			clientId: log.clientId,
			id: log.id || clientId, // Use DB ID if exists, else clientId temporarily
			syncStatus,
			title: log.title || 'Untitled Workout',
			startTime: log.startTime.toISOString(),
			endTime: log.endTime.toISOString(),
			visibility: log.visibility || 'public',
			createdAt: new Date().toISOString(),
			updatedAt: new Date().toISOString(),
			isEdited: log.isEdited || false,
			editedAt: log.editedAt?.toISOString() || null,
			exerciseGroups: log.exerciseGroups.map(g => ({
				id: g.id,
				groupType: g.groupType,
				groupIndex: g.groupIndex,
				restSeconds: g.restSeconds ?? null,
			})),
			exercises: log.exercises.map(ex => ({
				id: Crypto.randomUUID(),
				exerciseId: ex.exerciseId,
				exerciseIndex: ex.exerciseIndex,
				exerciseGroupId: ex.groupId ?? null,
				exercise: (useExercise.getState().exerciseList.find(e => e.id === ex.exerciseId) || {
					id: ex.exerciseId,
					title: 'Unknown Exercise',
					thumbnailUrl: '',
					exerciseType: 'repsOnly' as ExerciseType,
					description: '',
					muscleGroups: [],
					equipment: [],
				}) as any,
				sets: ex.sets.map(s => ({
					id: s.id,
					setIndex: s.setIndex,
					setType: s.setType,
					weight: s.weight ?? null,
					reps: s.reps ?? null,
					rpe: s.rpe ?? null,
					durationSeconds: s.durationSeconds ?? null,
					restSeconds: s.restSeconds ?? null,
					note: s.note ?? null,
				})),
			})),
			user: {
				id: useAuth.getState().user?.userId || '',
				firstName: useAuth.getState().user?.firstName || '',
				lastName: useAuth.getState().user?.lastName || '',
				profilePicUrl: useAuth.getState().user?.profilePicUrl || '',
			},
		})

		// Serialize for API
		const payload = serializeWorkoutForApi(prepared)
		const workoutPayload = {
			clientId,
			id: prepared.id,
			...payload,
		}

		// Step 1: ALWAYS update local state immediately (optimistic-first)
		const isEdit = prepared.id !== null
		const optimisticItem = createOptimisticItem(prepared, 'pending')
		get().upsertWorkoutHistoryItem(optimisticItem)

		// Step 2: Enqueue for background sync
		// useSyncQueue will automatically sync when online (reactive via queueEvents)
		if (isEdit) {
			enqueueWorkoutUpdate(workoutPayload, userId)
		} else {
			enqueueWorkoutCreate(workoutPayload, userId)
		}

		set({ workoutSaving: false })
		return { success: true }
	},

	resetWorkout: () => {
		set({
			workout: null,
			rest: {
				seconds: null,
				startedAt: null,
				running: false,
			},
		})
	},

	/* ───── Exercises ───── */

	addExercise: exerciseId =>
		set(state => {
			if (!state.workout) return state

			if (state.workout.exercises.some(e => e.exerciseId === exerciseId)) {
				return state
			}

			return {
				workout: {
					...state.workout,
					exercises: [
						...state.workout.exercises,
						{
							exerciseId,
							exerciseIndex: state.workout.exercises.length,
							groupId: null,
							sets: [],
						},
					],
				},
			}
		}),

	removeExercise: exerciseId =>
		set(state => {
			if (!state.workout) return state

			const workout = state.workout
			const target = workout.exercises.find(e => e.exerciseId === exerciseId)

			if (!target) return state

			let exercises = workout.exercises.filter(e => e.exerciseId !== exerciseId)

			let exerciseGroups = workout.exerciseGroups

			// Handle grouping invariant
			if (target.groupId) {
				const groupId = target.groupId
				const remaining = exercises.filter(e => e.groupId === groupId)

				if (remaining.length < 2) {
					// Kill the group
					exerciseGroups = exerciseGroups
						.filter(g => g.id !== groupId)
						.map((g, index) => ({ ...g, groupIndex: index }))

					// Clean leftover exercise
					exercises = exercises.map(e => (e.groupId === groupId ? { ...e, groupId: null } : e))
				}
			}

			// Reindex exercises
			exercises = exercises.map((e, index) => ({
				...e,
				exerciseIndex: index,
			}))

			return {
				workout: {
					...workout,
					exercises,
					exerciseGroups,
				},
			}
		}),

	replaceExercise: (oldId, newId) =>
		set(state => {
			if (!state.workout) return state

			// Prevent replacing with an exercise that already exists
			if (state.workout.exercises.some(e => e.exerciseId === newId)) {
				return state
			}

			return {
				workout: {
					...state.workout,
					exercises: state.workout.exercises.map(e =>
						e.exerciseId === oldId ? { ...e, exerciseId: newId } : e
					),
				},
			}
		}),

	reorderExercises: ordered =>
		set(state => {
			if (!state.workout) return state

			return {
				workout: {
					...state.workout,
					exercises: ordered.map((e, index) => ({
						...e,
						exerciseIndex: index,
					})),
				},
			}
		}),

	createExerciseGroup: (type, exerciseIds) =>
		set(state => {
			if (!state.workout) return state

			const groupId = Crypto.randomUUID()

			return {
				workout: {
					...state.workout,
					exerciseGroups: [
						...state.workout.exerciseGroups,
						{
							id: groupId,
							groupType: type,
							groupIndex: state.workout.exerciseGroups.length,
							restSeconds: null,
						},
					],
					exercises: state.workout.exercises.map(ex =>
						exerciseIds.includes(ex.exerciseId) ? { ...ex, groupId } : ex
					),
				},
			}
		}),

	removeExerciseFromGroup: exerciseId =>
		set(state => {
			if (!state.workout) return state

			const workout = state.workout

			// Find the exercise
			const targetExercise = workout.exercises.find(e => e.exerciseId === exerciseId)

			if (!targetExercise?.groupId) return state

			const groupId = targetExercise.groupId

			// Remove exercise from the group
			const updatedExercises = workout.exercises.map(ex =>
				ex.exerciseId === exerciseId ? { ...ex, groupId: null } : ex
			)

			// Count remaining exercises in this group
			const remainingInGroup = updatedExercises.filter(ex => ex.groupId === groupId)

			// If group still valid (>= 2), keep it
			if (remainingInGroup.length >= 2) {
				return {
					workout: {
						...workout,
						exercises: updatedExercises,
					},
				}
			}

			// Otherwise, remove the group entirely
			const updatedGroups = workout.exerciseGroups
				.filter(g => g.id !== groupId)
				.map((g, index) => ({
					...g,
					groupIndex: index,
				}))

			// Clear groupId for any leftover exercise
			const cleanedExercises = updatedExercises.map(ex =>
				ex.groupId === groupId ? { ...ex, groupId: null } : ex
			)

			return {
				workout: {
					...workout,
					exerciseGroups: updatedGroups,
					exercises: cleanedExercises,
				},
			}
		}),

	/* ───── Sets ───── */

	addSet: exerciseId =>
		set(state => {
			if (!state.workout) return state

			return {
				workout: {
					...state.workout,
					exercises: state.workout.exercises.map(ex =>
						ex.exerciseId === exerciseId
							? {
									...ex,
									sets: [
										...ex.sets,
										{
											id: Crypto.randomUUID(),
											setIndex: ex.sets.length,
											setType: 'working',
											completed: false,
										},
									],
								}
							: ex
					),
				},
			}
		}),

	updateSet: (exerciseId, setId, patch) =>
		set(state => {
			if (!state.workout) return state

			return {
				workout: {
					...state.workout,
					exercises: state.workout.exercises.map(ex =>
						ex.exerciseId === exerciseId
							? {
									...ex,
									sets: ex.sets.map(s => (s.id === setId ? { ...s, ...patch } : s)),
								}
							: ex
					),
				},
			}
		}),

	toggleSetCompleted: (exerciseId, setId) =>
		set(state => {
			if (!state.workout) return state

			return {
				workout: {
					...state.workout,
					exercises: state.workout.exercises.map(ex =>
						ex.exerciseId === exerciseId
							? {
									...ex,
									sets: ex.sets.map(s => (s.id === setId ? { ...s, completed: !s.completed } : s)),
								}
							: ex
					),
				},
			}
		}),

	removeSet: (exerciseId, setId) =>
		set(state => {
			if (!state.workout) return state

			return {
				workout: {
					...state.workout,
					exercises: state.workout.exercises.map(ex =>
						ex.exerciseId === exerciseId
							? {
									...ex,
									sets: ex.sets
										.filter(s => s.id !== setId)
										.map((s, index) => ({ ...s, setIndex: index })),
								}
							: ex
					),
				},
			}
		}),

	/* ───── Set Timers ───── */

	startSetTimer: (exerciseId, setId) =>
		set(state => {
			if (!state.workout) return state

			return {
				workout: {
					...state.workout,
					exercises: state.workout.exercises.map(ex =>
						ex.exerciseId === exerciseId
							? {
									...ex,
									sets: ex.sets.map(s =>
										s.id === setId && !s.durationStartedAt
											? { ...s, durationStartedAt: Date.now() }
											: s
									),
								}
							: ex
					),
				},
			}
		}),

	stopSetTimer: (exerciseId, setId) =>
		set(state => {
			if (!state.workout) return state

			return {
				workout: {
					...state.workout,
					exercises: state.workout.exercises.map(ex =>
						ex.exerciseId === exerciseId
							? {
									...ex,
									sets: ex.sets.map(s => (s.id === setId ? finalizeSetTimer(s) : s)),
								}
							: ex
					),
				},
			}
		}),
})
