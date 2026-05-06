import type { ExerciseType } from './exercises'
import type { WorkoutTemplateSnapshot } from './programs'
import type { DraftTemplate, WorkoutTemplate } from './templates'
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

export type ActiveRestTimer = {
  seconds: number | null
  startedAt: number | null
  running: boolean
  targetSetId: string | null
  pausedByWorkout: boolean
}

export type ActiveWorkoutSet = {
  id: string
  exerciseInstanceId: string
  setIndex: number
  setType: SetType
  weight?: number
  reps?: number
  rpe?: number
  durationSeconds?: number
  restSeconds?: number
  note?: string
  completed: boolean
  durationStartedAt?: number | null
}

export type ExerciseRestMode = 'perSet' | 'exercise'

export type ActiveWorkoutExercise = {
  id: string
  exerciseId: string
  setOrder: string[]
  groupId: string | null
  order: number
  restMode: ExerciseRestMode
  sharedRestSeconds?: number | null
}

export type ActiveWorkoutGroup = {
  id: string
  exerciseInstanceIds: string[]
  groupType: ExerciseGroupType
  groupIndex: number
  restSeconds?: number | null
}

export type ActiveWorkoutDraft = {
  id: string | null
  title: string
  notes?: string
  startTime: string
  endTime: string | null
  pausedAt: number | null
  accumulatedPauseSeconds: number
  visibility: VisibilityType
  exerciseOrder: string[]
  exercisesById: Record<string, ActiveWorkoutExercise>
  setsById: Record<string, ActiveWorkoutSet>
  groupsById: Record<string, ActiveWorkoutGroup>
  restTimer: ActiveRestTimer
}

export type ActiveWorkoutMode =
  | 'create'
  | 'edit-history'
  | 'template-create'
  | 'template-edit'
  | 'program-workout'

export type ActiveWorkoutSource = {
  workoutHistoryId?: string | null
  templateId?: string | null
  userProgramDayId?: string | null
  templateClientId?: string | null
  templateAuthorName?: string | null
  templateSourceShareId?: string | null
  programWeekIndex?: number | null
  programDayIndex?: number | null
}

export type ActiveWorkoutMetaInput = Partial<
  Pick<ActiveWorkoutDraft, 'title' | 'notes' | 'startTime' | 'endTime' | 'visibility'>
>

export type InitiateWorkoutInput =
  | ({
      mode?: 'create'
      template?: WorkoutTemplate | DraftTemplate
    } & ActiveWorkoutMetaInput)
  | {
      mode: 'edit-history'
      historyItem: WorkoutHistoryItem
    }
  | {
      mode: 'program-workout'
      userProgramDayId: string
      templateSnapshot: WorkoutTemplateSnapshot
    }
  | {
      mode: 'template-create'
      template?: WorkoutTemplate | DraftTemplate
      programWeekIndex?: number
      programDayIndex?: number
    }
  | {
      mode: 'template-edit'
      template: WorkoutTemplate
      programWeekIndex?: number
      programDayIndex?: number
    }

export type WorkoutSaveValidationResult = {
  canSave: boolean
  reasons: string[]
  validExerciseInstanceIds: string[]
  invalidExerciseInstanceIds: string[]
  validSetIds: string[]
  invalidSetIds: string[]
  invalidCompletedSetIds: string[]
  stats: {
    exerciseCount: number
    completedSetCount: number
    validCompletedSetCount: number
  }
}

export type WorkoutPayloadDraft = {
  title: string | null
  startTime: string
  endTime: string
  visibility: VisibilityType
  userProgramDayId?: string
  exercises: {
    exerciseId: string
    exerciseIndex: number
    exerciseGroupId?: string
    sets: {
      setIndex: number
      setType: SetType
      weight?: number | null
      reps?: number | null
      rpe?: number | null
      durationSeconds?: number | null
      restSeconds?: number | null
      note?: string | null
    }[]
  }[]
  exerciseGroups: {
    id: string
    groupType: ExerciseGroupType
    groupIndex: number
    restSeconds?: number | null
  }[]
}

export type WorkoutFinalizeResult = {
  payload: WorkoutPayloadDraft
  removed: {
    setIds: string[]
    exerciseInstanceIds: string[]
    groupIds: string[]
  }
  warnings: string[]
}

export type TemplateFinalizeResult = {
  template: DraftTemplate
  removed: {
    exerciseInstanceIds: string[]
    groupIds: string[]
  }
  warnings: string[]
}

export type ActiveWorkoutSummary = {
  exerciseCount: number
  setCount: number
  completedSetCount: number
  validCompletedSetCount: number
}

export type ExerciseTypeMap = Map<string, ExerciseType>

export type WorkoutsPaginatedResponse = {
  workouts: WorkoutHistoryItem[]
  meta: {
    hasMore: boolean
    currentPage: number
    totalPages: number
    totalItems: number
  }
}

export type WorkoutHistoryPage = {
  workouts: WorkoutHistoryItem[]
  meta: {
    hasMore?: boolean
    currentPage?: number
  } | null
}

export type WorkoutHistoryInfiniteData = {
  pages: WorkoutHistoryPage[]
  pageParams: unknown[]
}
