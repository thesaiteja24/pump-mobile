import type { ExerciseType } from './exercises'
import type { WorkoutTemplate } from './template'

export type SetType = 'warmup' | 'working' | 'dropSet' | 'failureSet'

export type ExerciseGroupType = 'superSet' | 'giantSet'

export type VisibilityType = 'public' | 'private'

export type WorkoutLog = {
	/** Server-assigned ID. null before first save. */
	id: string | null
	title: string
	startTime: Date
	endTime: Date
	exercises: WorkoutLogExercise[]
	exerciseGroups: WorkoutLogGroup[]
	isEdited?: boolean
	editedAt?: Date | null
	visibility?: VisibilityType
	userProgramDayId?: string
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

export type WorkoutHistoryItem = {
	id: string
	shareId?: string | null
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
		isPro: boolean
		proSubscriptionType: string | null
	} | null
	exerciseGroups: WorkoutHistoryGroup[]
	exercises: WorkoutHistoryExercise[]
}

export interface RestState {
	seconds: number | null
	startedAt: number | null
	running: boolean
}

export interface WorkoutState {
	workoutSaving: boolean
	workout: WorkoutLog | null
	rest: RestState
	startWorkout: () => void
	loadWorkoutHistory: (historyItem: WorkoutHistoryItem) => void
	updateWorkout: (patch: Partial<WorkoutLog>) => void
	prepareWorkoutForSave: () => {
		workout: WorkoutLog
		pruneReport: WorkoutPruneReport
	} | null
	resetWorkout: () => void
	discardWorkout: () => void
	addExercise: (exerciseId: string) => void
	removeExercise: (exerciseId: string) => void
	replaceExercise: (oldId: string, newId: string) => void
	reorderExercises: (ordered: WorkoutLogExercise[]) => void
	createExerciseGroup: (type: ExerciseGroupType, exerciseIds: string[]) => void
	removeExerciseFromGroup: (exerciseId: string) => void
	loadTemplate: (template: WorkoutTemplate) => void
	loadProgramDay: (userProgramDayId: string, template: any) => void
	addSet: (exerciseId: string) => void
	updateSet: (exerciseId: string, setId: string, patch: Partial<WorkoutLogSet>) => void
	toggleSetCompleted: (exerciseId: string, setId: string) => void
	removeSet: (exerciseId: string, setId: string) => void
	startSetTimer: (exerciseId: string, setId: string) => void
	stopSetTimer: (exerciseId: string, setId: string) => void
	startRestTimer: (seconds: number) => void
	stopRestTimer: () => void
	adjustRestTimer: (deltaSeconds: number) => void
	saveRestForSet: (exerciseId: string, setId: string, seconds: number) => void
	resetState: () => void
}
