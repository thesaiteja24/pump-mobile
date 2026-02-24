import { SyncStatus } from '@/lib/sync/types'
import { WorkoutTemplate } from '@/stores/template/types'
import { ExerciseType } from '../exerciseStore'

/* ───────────────── Types ───────────────── */

export type SetType = 'warmup' | 'working' | 'dropSet' | 'failureSet'

export type ExerciseGroupType = 'superSet' | 'giantSet'

/**
 * Re-export SyncStatus for convenience
 */
export type { SyncStatus } from '@/lib/sync/types'

export type VisibilityType = 'public' | 'private'

/**
 * Active workout state during a workout session.
 * - clientId: Always present, generated at creation (stable local identifier)
 * - id: Backend-generated ID, null until synced
 * - syncStatus: Track sync state for offline-first
 */
export type WorkoutLog = {
	clientId: string
	id: string | null
	syncStatus: SyncStatus
	title: string
	startTime: Date
	endTime: Date
	exercises: WorkoutLogExercise[]
	exerciseGroups: WorkoutLogGroup[]
	isEdited?: boolean
	editedAt?: Date | null
	visibility?: VisibilityType
}

export type WorkoutLogExercise = {
	exerciseId: string
	exerciseIndex: number
	groupId?: string | null
	sets: WorkoutLogSet[]
}

export type WorkoutLogSet = {
	id: string
	setIndex: number

	weight?: number
	reps?: number
	rpe?: number
	durationSeconds?: number
	restSeconds?: number
	note?: string
	setType: SetType

	// runtime-only
	completed: boolean
	durationStartedAt?: number | null
}

export type WorkoutLogGroup = {
	id: string
	groupType: ExerciseGroupType
	groupIndex: number
	restSeconds?: number | null
}

export type WorkoutPruneReport = {
	droppedSets: number
	droppedExercises: number
	droppedGroups: number
}

export type WorkoutHistoryGroup = {
	id: string
	groupType: ExerciseGroupType
	groupIndex: number
	restSeconds: number | null
}

export type WorkoutHistoryExercise = {
	id: string
	exerciseId: string
	exerciseIndex: number
	exerciseGroupId: string | null

	exercise: {
		id: string
		title: string
		thumbnailUrl: string
		exerciseType: ExerciseType
	}

	sets: WorkoutHistorySet[]
}

export type WorkoutHistorySet = {
	id: string
	setIndex: number
	setType: SetType
	weight: number | null
	reps: number | null
	rpe: number | null
	durationSeconds: number | null
	restSeconds: number | null
	note: string | null
}

/**
 * Workout history item returned from backend or created optimistically.
 * - clientId: Client-generated stable identifier (for offline lookup)
 * - id: Backend-generated ID (always present in synced items)
 * - syncStatus: Track sync state for UI indicators
 */
export type WorkoutHistoryItem = {
	clientId: string
	id: string
	shareId?: string | null
	syncStatus: SyncStatus
	title: string | null
	startTime: string
	endTime: string
	visibility: VisibilityType
	createdAt: string
	updatedAt: string
	isEdited: boolean
	editedAt: string | null
	likesCount?: number
	commentsCount?: number
	user?: {
		id: string
		firstName: string
		lastName: string
		profilePicUrl: string
	} | null

	exerciseGroups: WorkoutHistoryGroup[]
	exercises: WorkoutHistoryExercise[]
}

/* ───────────────── State Interface ───────────────── */

export interface RestState {
	seconds: number | null
	startedAt: number | null
	running: boolean
}

export interface WorkoutState {
	workoutLoading: boolean
	discoverLoading: boolean
	workoutSaving: boolean
	workoutHistory: WorkoutHistoryItem[]
	discoverWorkouts: WorkoutHistoryItem[]
	workout: WorkoutLog | null
	rest: RestState

	/* Workout */
	getAllWorkouts: () => Promise<void>
	getDiscoverWorkouts: () => Promise<void>
	getWorkoutById: (id: string) => WorkoutHistoryItem | undefined
	upsertWorkoutHistoryItem: (item: WorkoutHistoryItem) => void
	updateWorkoutSyncStatus: (clientId: string, syncStatus: SyncStatus) => void
	deleteWorkout: (clientId: string, dbId: string | null) => Promise<boolean>
	startWorkout: () => void
	loadWorkoutHistory: (historyItem: WorkoutHistoryItem) => void
	updateWorkout: (patch: Partial<WorkoutLog>) => void
	prepareWorkoutForSave: () => {
		workout: WorkoutLog
		pruneReport: WorkoutPruneReport
	} | null
	saveWorkout: (prepared: WorkoutLog) => Promise<{ success: boolean; error?: any }>
	resetWorkout: () => void
	discardWorkout: () => void

	/* Exercises */
	addExercise: (exerciseId: string) => void
	removeExercise: (exerciseId: string) => void
	replaceExercise: (oldId: string, newId: string) => void
	reorderExercises: (ordered: WorkoutLogExercise[]) => void
	createExerciseGroup: (type: ExerciseGroupType, exerciseIds: string[]) => void
	removeExerciseFromGroup: (exerciseId: string) => void

	loadTemplate: (template: WorkoutTemplate) => void

	/* Sets */
	addSet: (exerciseId: string) => void
	updateSet: (exerciseId: string, setId: string, patch: Partial<WorkoutLogSet>) => void
	toggleSetCompleted: (exerciseId: string, setId: string) => void
	removeSet: (exerciseId: string, setId: string) => void

	/* Timers */
	startSetTimer: (exerciseId: string, setId: string) => void
	stopSetTimer: (exerciseId: string, setId: string) => void

	/* Rest */
	startRestTimer: (seconds: number) => void
	stopRestTimer: () => void
	adjustRestTimer: (deltaSeconds: number) => void
	saveRestForSet: (exerciseId: string, setId: string, seconds: number) => void

	resetState: () => void
}
