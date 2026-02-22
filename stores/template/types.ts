import { SyncStatus } from '@/lib/sync/types'
import { ExerciseGroupType, SetType } from '../workout/types'

export interface TemplateSet {
	id: string // Frontend UUID for keys
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
	id: string // Frontend UUID or DB ID
	exerciseId: string
	exerciseIndex: number
	exerciseGroupId?: string
	sets: TemplateSet[]

	// Hydrated details
	title?: string
	thumbnailUrl?: string
}

export interface TemplateExerciseGroup {
	id: string
	groupType: ExerciseGroupType
	groupIndex: number
	restSeconds?: number
}

/**
 * Workout template with offline-first support.
 * - clientId: Client-generated stable identifier (for offline lookup)
 * - id: Backend-generated ID (always present in synced items)
 * - syncStatus: Track sync state for UI indicators
 */
export interface WorkoutTemplate {
	clientId: string | null // as of now client side only
	id: string
	syncStatus: SyncStatus // client side only
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
	templateLoading: boolean
	sharedTemplate: WorkoutTemplate | null
	setSharedTemplate: (template: WorkoutTemplate | null) => void

	// Draft state
	draftTemplate: DraftTemplate | null

	getAllTemplates: () => Promise<void>
	getTemplateByShareId: (shareId: string) => Promise<void>
	createTemplate: (data: DraftTemplate) => Promise<any>
	updateTemplate: (id: string, data: Partial<WorkoutTemplate>) => Promise<any>
	saveSharedTemplate: (
		template: WorkoutTemplate,
		options?: { overwriteId?: string }
	) => Promise<{ success: boolean; id?: string; error?: string }>
	deleteTemplate: (id: string) => Promise<any>
	startWorkoutFromTemplate: (templateId: string) => void

	// Validation
	prepareTemplateForSave: () => {
		template: DraftTemplate
		pruneReport: {
			droppedExercises: number
			droppedGroups: number
		}
	} | null

	// Draft Actions
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

	// State Management
	resetState: () => void
}
