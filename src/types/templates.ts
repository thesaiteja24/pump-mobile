import type { ExerciseGroupType, SetType } from './workouts'

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
  /** The server-assigned ID. Always present for synced templates. */
  id: string
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
