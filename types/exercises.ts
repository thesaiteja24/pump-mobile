import { MetaItem } from './meta'
import type { MuscleGroup } from './muscle-groups'

export type ExerciseType = 'repsOnly' | 'assisted' | 'weighted' | 'durationOnly'

export interface Exercise {
	id: string
	title: string
	instructions: string
	thumbnailUrl: string
	videoUrl: string
	primaryMuscleGroupId: string
	primaryMuscleGroup: MuscleGroup
	equipmentId: string
	equipment: MetaItem
	exerciseType: ExerciseType
	createdAt: string
	updatedAt: string
	otherMuscleGroups: MuscleGroup[]
}
