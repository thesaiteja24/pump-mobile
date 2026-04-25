/**
 * types/sync.ts
 *
 * API serialization payload types. These are used by the serialization helpers
 * in utils/serializeForApi.ts and the service layer.
 *
 * All offline-sync types (SyncStatus, SyncableEntity, mutation queues) have been removed.
 */

export interface SerializedSet {
  setIndex: number
  setType: string
  weight?: number | null
  reps?: number | null
  rpe?: number | null
  durationSeconds?: number | null
  restSeconds?: number | null
  note?: string | null
}

export interface SerializedExercise {
  exerciseId: string
  exerciseIndex: number
  exerciseGroupId?: string
  sets: SerializedSet[]
}

export interface SerializedExerciseGroup {
  id: string
  groupType: string
  groupIndex: number
  restSeconds?: number | null
}

export interface WorkoutPayload {
  clientId?: string
  title?: string | null
  startTime?: string | null
  endTime?: string | null
  visibility?: string
  userProgramDayId?: string
  exercises: SerializedExercise[]
  exerciseGroups: SerializedExerciseGroup[]
}

export interface SerializedTemplateExercise {
  exerciseId: string
  exerciseIndex: number
  exerciseGroupId?: string
  sets: SerializedSet[]
}

export interface TemplatePayload {
  id?: string | null
  clientId?: string
  title: string
  notes?: string
  sourceShareId?: string
  authorName?: string
  exercises: SerializedTemplateExercise[]
  exerciseGroups: SerializedExerciseGroup[]
}

export interface AnalyticsPayload {
  userId: string
  workoutId: string
  date: string
  volume: number
  duration: number
  reps: number
}

export interface UserPayload {
  userId: string
  firstName?: string
  lastName?: string
  height?: number | null
  weight?: number | null
  dateOfBirth?: string | null
  gender?: string
  preferredWeightUnit?: string
  preferredLengthUnit?: string
}
