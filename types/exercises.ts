import { MetaItem } from './meta'

export type ExerciseType = 'repsOnly' | 'assisted' | 'weighted' | 'durationOnly'

export interface Exercise {
	id: string
	title: string
	instructions: string
	thumbnailUrl: string
	videoUrl: string
	primaryMuscleGroupId: string
	equipmentId: string
	exerciseType: ExerciseType
	createdAt: string
	updatedAt: string
	primaryMuscleGroup: MetaItem
	equipment: MetaItem
	otherMuscleGroups: MetaItem[]
}
