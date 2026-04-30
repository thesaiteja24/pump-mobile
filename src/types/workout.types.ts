import type { ExerciseType } from './exercises'
import type { WorkoutTemplateSnapshot } from './programs'
import type { DraftTemplate, WorkoutTemplate } from './templates'
import type {
  ExerciseGroupType,
  SetType,
  VisibilityType,
  WorkoutHistoryItem,
} from './workouts'

export type { ExerciseGroupType, SetType, VisibilityType }

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
