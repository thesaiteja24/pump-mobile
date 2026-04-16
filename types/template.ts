import type { SyncStatus } from './sync'
import type { ExerciseGroupType, SetType } from './workout'

export interface TemplateSet {
	id: string
	setIndex: number
	setType: SetType
	weight?: number
	reps?: number
	rpe?: number
	note?: string
	durationSeconds?: number
	restSeconds?: number
}

export interface TemplateExercise {
	id: string
	exerciseId: string
	exerciseIndex: number
	exerciseGroupId?: string
	sets: TemplateSet[]
	title?: string
	thumbnailUrl?: string
}

export interface TemplateExerciseGroup {
	id: string
	groupType: ExerciseGroupType
	groupIndex: number
	restSeconds?: number
}

export interface WorkoutTemplate {
	clientId: string | null
	id: string
	syncStatus: SyncStatus
	userId: string
	title: string
	notes?: string
	shareId?: string
	sourceShareId?: string
	authorName: string
	createdAt?: string
	updatedAt?: string
	exercises: TemplateExercise[]
	exerciseGroups: TemplateExerciseGroup[]
}

export interface DraftTemplate {
	clientId: string
	id?: string | null
	userId: string
	title: string
	notes?: string
	sourceShareId?: string
	authorName?: string
	exercises: TemplateExercise[]
	exerciseGroups: TemplateExerciseGroup[]
}

export interface TemplateState {
	templates: WorkoutTemplate[]
	sharedTemplate: WorkoutTemplate | null
	setSharedTemplate: (template: WorkoutTemplate | null) => void
	draftTemplate: DraftTemplate | null
	createTemplate: (data: DraftTemplate) => Promise<any>
	updateTemplate: (id: string, data: Partial<WorkoutTemplate>) => Promise<any>
	saveSharedTemplate: (
		template: WorkoutTemplate,
		options?: { overwriteId?: string }
	) => Promise<{ success: boolean; id?: string; error?: string }>
	deleteTemplate: (id: string) => Promise<any>
	startWorkoutFromTemplate: (templateId: string) => void
	prepareTemplateForSave: () => {
		template: WorkoutTemplate
		pruneReport: {
			droppedExercises: number
			droppedGroups: number
		}
	} | null
	startDraftTemplate: (initialData?: Partial<DraftTemplate>) => void
	updateDraftTemplate: (patch: Partial<DraftTemplate>) => void
	discardDraftTemplate: () => void
	addExerciseToDraft: (exerciseId: string) => void
	removeExerciseFromDraft: (exerciseId: string) => void
	replaceDraftExercise: (oldId: string, newId: string) => void
	reorderDraftExercises: (ordered: TemplateExercise[]) => void
	addSetToDraft: (exerciseId: string) => void
	updateDraftSet: (exerciseId: string, setId: string, patch: Partial<TemplateSet>) => void
	removeSetFromDraft: (exerciseId: string, setId: string) => void
	createDraftExerciseGroup: (exerciseIds: string[], type: ExerciseGroupType) => void
	removeDraftExerciseGroup: (groupId: string) => void
	resetState: () => void
}
