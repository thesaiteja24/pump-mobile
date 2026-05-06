import * as Crypto from 'expo-crypto'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

import { zustandStorage } from '@/lib/storage'
import type { ExerciseType } from '@/types/exercises'
import type { WorkoutTemplateSnapshot } from '@/types/programs'
import type { DraftTemplate, WorkoutTemplate } from '@/types/templates'
import type {
  ActiveWorkoutDraft,
  ActiveWorkoutGroup,
  ActiveWorkoutMetaInput,
  ActiveWorkoutMode,
  ActiveWorkoutSet,
  ActiveWorkoutSource,
  ExerciseGroupType,
  ExerciseRestMode,
  ExerciseTypeMap,
  InitiateWorkoutInput,
  TemplateFinalizeResult,
  WorkoutFinalizeResult,
  WorkoutHistoryItem,
  WorkoutPayloadDraft,
  WorkoutSaveValidationResult,
} from '@/types/workouts'

type ActiveWorkoutStore = {
  workout: ActiveWorkoutDraft | null
  mode: ActiveWorkoutMode | null
  source: ActiveWorkoutSource | null
  initiateWorkout: (input?: InitiateWorkoutInput) => void

  updateWorkoutMeta: (
    patch: Partial<
      Pick<ActiveWorkoutDraft, 'title' | 'notes' | 'startTime' | 'endTime' | 'visibility'>
    >,
  ) => void
  pauseWorkout: () => void
  resumeWorkout: () => void

  addExercise: (exerciseId: string) => string | null
  replaceExercise: (exerciseInstanceId: string, exerciseId: string) => void
  reorderExercises: (exerciseInstanceIds: string[]) => void
  deleteExercise: (exerciseInstanceId: string) => void
  updateExerciseRest: (
    exerciseInstanceId: string,
    input: { restMode?: ExerciseRestMode; sharedRestSeconds?: number | null },
  ) => void

  addSet: (exerciseInstanceId: string) => string | null
  deleteSet: (exerciseInstanceId: string, setId: string) => void
  updateSet: (setId: string, patch: Partial<ActiveWorkoutSet>) => void

  toggleSetCompleted: (setId: string) => void
  startSetTimer: (setId: string) => void
  stopSetTimer: (setId: string) => void
  startRestTimer: (seconds: number, targetSetId?: string | null) => void
  pauseRestTimer: () => void
  resumeRestTimer: () => void
  stopRestTimer: () => void
  adjustRestTimer: (deltaSeconds: number) => void

  createGroup: (input: {
    groupType: ExerciseGroupType
    exerciseInstanceIds: string[]
    restSeconds?: number | null
  }) => string | null
  updateGroup: (
    groupId: string,
    patch: Partial<Omit<ActiveWorkoutGroup, 'id' | 'exerciseInstanceIds'>> & {
      exerciseInstanceIds?: string[]
    },
  ) => void
  deleteGroup: (groupId: string) => void

  discardWorkout: () => void
}

type WorkoutEditorPersistedState = Pick<ActiveWorkoutStore, 'workout' | 'mode' | 'source'>

function createEmptyRestTimer(): ActiveWorkoutDraft['restTimer'] {
  return {
    seconds: null,
    startedAt: null,
    running: false,
    targetSetId: null,
    pausedByWorkout: false,
  }
}

function createEmptyWorkout(input?: ActiveWorkoutMetaInput): ActiveWorkoutDraft {
  return {
    id: null,
    title: input?.title ?? 'New Workout',
    notes: input?.notes,
    startTime: input?.startTime ?? new Date().toISOString(),
    endTime: input?.endTime ?? null,
    pausedAt: null,
    accumulatedPauseSeconds: 0,
    visibility: input?.visibility ?? 'public',
    exerciseOrder: [],
    exercisesById: {},
    setsById: {},
    groupsById: {},
    restTimer: createEmptyRestTimer(),
  }
}

function createWorkoutFromHistory(historyItem: WorkoutHistoryItem): ActiveWorkoutDraft {
  const sortedGroups = [...historyItem.exerciseGroups].sort((a, b) => a.groupIndex - b.groupIndex)
  const sortedExercises = [...historyItem.exercises].sort((a, b) => a.exerciseIndex - b.exerciseIndex)

  const groupsById: ActiveWorkoutDraft['groupsById'] = {}
  const exercisesById: ActiveWorkoutDraft['exercisesById'] = {}
  const setsById: ActiveWorkoutDraft['setsById'] = {}
  const exerciseOrder: string[] = []

  for (const group of sortedGroups) {
    groupsById[group.id] = {
      id: group.id,
      exerciseInstanceIds: [],
      groupType: group.groupType,
      groupIndex: group.groupIndex,
      restSeconds: group.restSeconds ?? null,
    }
  }

  sortedExercises.forEach((exercise, exerciseIndex) => {
    const sortedSets = [...exercise.sets].sort((a, b) => a.setIndex - b.setIndex)
    const setOrder = sortedSets.map((set) => set.id)
    const sharedRestCandidates = sortedSets
      .map((set) => set.restSeconds)
      .filter((restSeconds): restSeconds is number => restSeconds != null)
    const uniqueSharedRest = [...new Set(sharedRestCandidates)]
    const usesExerciseRest =
      sortedSets.length > 0 &&
      sharedRestCandidates.length === sortedSets.length &&
      uniqueSharedRest.length === 1

    exerciseOrder.push(exercise.id)

    exercisesById[exercise.id] = {
      id: exercise.id,
      exerciseId: exercise.exerciseId,
      setOrder,
      groupId: exercise.exerciseGroupId,
      order: exerciseIndex,
      restMode: usesExerciseRest ? 'exercise' : 'perSet',
      sharedRestSeconds: usesExerciseRest ? uniqueSharedRest[0] : null,
    }

    if (exercise.exerciseGroupId && groupsById[exercise.exerciseGroupId]) {
      groupsById[exercise.exerciseGroupId].exerciseInstanceIds.push(exercise.id)
    }

    sortedSets.forEach((set, setIndex) => {
      setsById[set.id] = {
        id: set.id,
        exerciseInstanceId: exercise.id,
        setIndex,
        setType: set.setType,
        weight: set.weight ?? undefined,
        reps: set.reps ?? undefined,
        rpe: set.rpe ?? undefined,
        durationSeconds: set.durationSeconds ?? undefined,
        restSeconds: set.restSeconds ?? undefined,
        note: set.note ?? undefined,
        completed: true,
        durationStartedAt: null,
      }
    })
  })

  return {
    id: historyItem.id,
    title: historyItem.title || 'Untitled Workout',
    notes: undefined,
    startTime: historyItem.startTime,
    endTime: historyItem.endTime,
    pausedAt: null,
    accumulatedPauseSeconds: 0,
    visibility: historyItem.visibility,
    exerciseOrder,
    exercisesById,
    setsById,
    groupsById,
    restTimer: createEmptyRestTimer(),
  }
}

type TemplateLike = {
  id?: string | null
  clientId?: string
  title: string
  notes?: string | null
  sourceShareId?: string | null
  authorName?: string | null
  exerciseGroups: WorkoutTemplate['exerciseGroups']
  exercises: WorkoutTemplate['exercises']
}

function createDraftFromTemplateLike(
  template: TemplateLike,
  options?: {
    titleFallback?: string
    startTime?: string
    endTime?: string | null
    visibility?: ActiveWorkoutDraft['visibility']
  },
): ActiveWorkoutDraft {
  const sortedGroups = [...template.exerciseGroups].sort((a, b) => a.groupIndex - b.groupIndex)
  const sortedExercises = [...template.exercises].sort((a, b) => a.exerciseIndex - b.exerciseIndex)

  const groupsById: ActiveWorkoutDraft['groupsById'] = {}
  const exercisesById: ActiveWorkoutDraft['exercisesById'] = {}
  const setsById: ActiveWorkoutDraft['setsById'] = {}
  const exerciseOrder: string[] = []

  for (const group of sortedGroups) {
    groupsById[group.id] = {
      id: group.id,
      exerciseInstanceIds: [],
      groupType: group.groupType,
      groupIndex: group.groupIndex,
      restSeconds: group.restSeconds ?? null,
    }
  }

  sortedExercises.forEach((exercise, exerciseIndex) => {
    const exerciseInstanceId = exercise.id || Crypto.randomUUID()
    const sortedSets = [...exercise.sets].sort((a, b) => a.setIndex - b.setIndex)
    const setOrder: string[] = []
    const sharedRestCandidates = sortedSets
      .map((set) => set.restSeconds)
      .filter((restSeconds): restSeconds is number => restSeconds != null)
    const uniqueSharedRest = [...new Set(sharedRestCandidates)]
    const usesExerciseRest =
      sortedSets.length > 0 &&
      sharedRestCandidates.length === sortedSets.length &&
      uniqueSharedRest.length === 1

    exerciseOrder.push(exerciseInstanceId)

    exercisesById[exerciseInstanceId] = {
      id: exerciseInstanceId,
      exerciseId: exercise.exerciseId,
      setOrder,
      groupId: exercise.exerciseGroupId || null,
      order: exerciseIndex,
      restMode: usesExerciseRest ? 'exercise' : 'perSet',
      sharedRestSeconds: usesExerciseRest ? uniqueSharedRest[0] : null,
    }

    if (exercise.exerciseGroupId && groupsById[exercise.exerciseGroupId]) {
      groupsById[exercise.exerciseGroupId].exerciseInstanceIds.push(exerciseInstanceId)
    }

    sortedSets.forEach((set, setIndex) => {
      const setId = set.id || Crypto.randomUUID()
      setOrder.push(setId)

      setsById[setId] = {
        id: setId,
        exerciseInstanceId,
        setIndex,
        setType: set.setType,
        weight: set.weight ?? undefined,
        reps: set.reps ?? undefined,
        rpe: set.rpe ?? undefined,
        durationSeconds: set.durationSeconds ?? undefined,
        restSeconds: set.restSeconds ?? undefined,
        note: set.note ?? undefined,
        completed: false,
        durationStartedAt: null,
      }
    })
  })

  return {
    id: null,
    title: template.title || options?.titleFallback || 'New Workout',
    notes: template.notes ?? undefined,
    startTime: options?.startTime ?? new Date().toISOString(),
    endTime: options?.endTime ?? null,
    pausedAt: null,
    accumulatedPauseSeconds: 0,
    visibility: options?.visibility ?? 'public',
    exerciseOrder,
    exercisesById,
    setsById,
    groupsById,
    restTimer: createEmptyRestTimer(),
  }
}

function createWorkoutFromProgram(templateSnapshot: WorkoutTemplateSnapshot): ActiveWorkoutDraft {
  return createDraftFromTemplateLike(templateSnapshot, {
    titleFallback: 'Program Workout',
  })
}

function createTemplateEditorDraft(template?: TemplateLike): ActiveWorkoutDraft {
  if (!template) {
    return createEmptyWorkout({
      title: 'New Template',
      notes: '',
    })
  }

  return createDraftFromTemplateLike(template, {
    titleFallback: 'New Template',
  })
}

export function getWorkoutElapsedSeconds(
  workout: Pick<ActiveWorkoutDraft, 'startTime' | 'pausedAt' | 'accumulatedPauseSeconds'>,
  now = Date.now(),
) {
  const startTimeMs = new Date(workout.startTime).getTime()
  const effectiveNow = workout.pausedAt ?? now
  return Math.max(
    0,
    Math.floor((effectiveNow - startTimeMs) / 1000) - workout.accumulatedPauseSeconds,
  )
}

export function getWorkoutDurationSeconds(
  workout: Pick<ActiveWorkoutDraft, 'startTime' | 'endTime' | 'pausedAt' | 'accumulatedPauseSeconds'>,
  mode: ActiveWorkoutMode | null,
  now = Date.now(),
) {
  if (mode === 'edit-history' && workout.endTime) {
    return Math.max(
      0,
      Math.floor(
        (new Date(workout.endTime).getTime() - new Date(workout.startTime).getTime()) / 1000,
      ),
    )
  }

  return getWorkoutElapsedSeconds(workout, now)
}

export function getRestTimerRemainingSeconds(
  restTimer: Pick<
    ActiveWorkoutDraft['restTimer'],
    'seconds' | 'startedAt' | 'running'
  >,
  now = Date.now(),
) {
  if (restTimer.seconds == null) return 0
  if (!restTimer.running || !restTimer.startedAt) {
    return Math.max(0, restTimer.seconds)
  }

  const elapsed = Math.floor((now - restTimer.startedAt) / 1000)
  return Math.max(0, restTimer.seconds - elapsed)
}

function reindexExercises(workout: ActiveWorkoutDraft) {
  workout.exerciseOrder.forEach((exerciseInstanceId, index) => {
    const exercise = workout.exercisesById[exerciseInstanceId]
    if (exercise) {
      exercise.order = index
    }
  })
}

function reindexSetsForExercise(workout: ActiveWorkoutDraft, exerciseInstanceId: string) {
  const exercise = workout.exercisesById[exerciseInstanceId]
  if (!exercise) return

  exercise.setOrder.forEach((setId, index) => {
    const set = workout.setsById[setId]
    if (set) {
      set.setIndex = index
    }
  })
}

function reindexGroups(workout: ActiveWorkoutDraft) {
  const orderedGroups = Object.values(workout.groupsById).sort(
    (a, b) => a.groupIndex - b.groupIndex,
  )
  orderedGroups.forEach((group, index) => {
    group.groupIndex = index
  })
}

function clearInvalidGroups(workout: ActiveWorkoutDraft, groupIds: string[]) {
  for (const groupId of groupIds) {
    const group = workout.groupsById[groupId]
    if (!group) continue

    for (const exerciseInstanceId of group.exerciseInstanceIds) {
      const exercise = workout.exercisesById[exerciseInstanceId]
      if (exercise?.groupId === groupId) {
        exercise.groupId = null
      }
    }

    delete workout.groupsById[groupId]
  }

  reindexGroups(workout)
}

function detachExerciseFromGroup(workout: ActiveWorkoutDraft, exerciseInstanceId: string) {
  const exercise = workout.exercisesById[exerciseInstanceId]
  if (!exercise?.groupId) return

  const groupId = exercise.groupId
  const group = workout.groupsById[groupId]
  exercise.groupId = null

  if (!group) return

  group.exerciseInstanceIds = group.exerciseInstanceIds.filter((id) => id !== exerciseInstanceId)

  if (group.exerciseInstanceIds.length < 2) {
    clearInvalidGroups(workout, [groupId])
  }
}

function normalizeSetPatch(patch: Partial<ActiveWorkoutSet>): Partial<ActiveWorkoutSet> {
  const nextPatch = { ...patch }

  const numericKeys: ('weight' | 'reps' | 'rpe' | 'durationSeconds' | 'restSeconds')[] = [
    'weight',
    'reps',
    'rpe',
    'durationSeconds',
    'restSeconds',
  ]

  for (const key of numericKeys) {
    const value = nextPatch[key]

    if (value === null) {
      delete nextPatch[key]
      continue
    }

    if (typeof value === 'number' && Number.isNaN(value)) {
      delete nextPatch[key]
    }
  }

  return nextPatch
}

function isValidGroupSelection(groupType: ExerciseGroupType, exerciseInstanceIds: string[]) {
  if (groupType === 'superSet') {
    return exerciseInstanceIds.length === 2
  }

  return exerciseInstanceIds.length >= 2
}

function finalizeSetTimer(set: ActiveWorkoutSet): ActiveWorkoutSet {
  if (!set.durationStartedAt) return set

  const elapsed = Math.max(0, Math.floor((Date.now() - set.durationStartedAt) / 1000))

  return {
    ...set,
    durationSeconds: (set.durationSeconds ?? 0) + elapsed,
    durationStartedAt: null,
  }
}

function isValidCompletedSet(set: ActiveWorkoutSet, exerciseType: ExerciseType): boolean {
  if (!set.completed) return false

  const reps = set.reps ?? 0
  const weight = set.weight ?? 0
  const duration = set.durationSeconds ?? 0

  switch (exerciseType) {
    case 'repsOnly':
      return reps > 0
    case 'durationOnly':
      return duration > 0
    case 'weighted':
    case 'assisted':
      return reps > 0 && weight > 0
    default:
      return false
  }
}

function buildFinalizeWarnings(removed: WorkoutFinalizeResult['removed']): string[] {
  const warnings: string[] = []

  if (removed.setIds.length > 0) {
    warnings.push(
      `Removed ${removed.setIds.length} invalid set${removed.setIds.length === 1 ? '' : 's'} before save.`,
    )
  }

  if (removed.exerciseInstanceIds.length > 0) {
    warnings.push(
      `Removed ${removed.exerciseInstanceIds.length} empty exercise${removed.exerciseInstanceIds.length === 1 ? '' : 's'} before save.`,
    )
  }

  if (removed.groupIds.length > 0) {
    warnings.push(
      `Removed ${removed.groupIds.length} invalid group${removed.groupIds.length === 1 ? '' : 's'} before save.`,
    )
  }

  return warnings
}

function buildTemplateFinalizeWarnings(removed: TemplateFinalizeResult['removed']): string[] {
  const warnings: string[] = []

  if (removed.exerciseInstanceIds.length > 0) {
    warnings.push(
      `Removed ${removed.exerciseInstanceIds.length} unavailable exercise${removed.exerciseInstanceIds.length === 1 ? '' : 's'} before save.`,
    )
  }

  if (removed.groupIds.length > 0) {
    warnings.push(
      `Removed ${removed.groupIds.length} invalid group${removed.groupIds.length === 1 ? '' : 's'} before save.`,
    )
  }

  return warnings
}

export function getWorkoutSummary(
  workout: ActiveWorkoutDraft | null,
  exerciseTypeMap: ExerciseTypeMap,
) {
  if (!workout) {
    return {
      exerciseCount: 0,
      setCount: 0,
      completedSetCount: 0,
      validCompletedSetCount: 0,
    }
  }

  let setCount = 0
  let completedSetCount = 0
  let validCompletedSetCount = 0

  for (const exerciseInstanceId of workout.exerciseOrder) {
    const exercise = workout.exercisesById[exerciseInstanceId]
    if (!exercise) continue

    const exerciseType = exerciseTypeMap.get(exercise.exerciseId)
    setCount += exercise.setOrder.length

    for (const setId of exercise.setOrder) {
      const set = workout.setsById[setId]
      if (!set) continue

      if (set.completed) {
        completedSetCount += 1
      }

      if (exerciseType && isValidCompletedSet(set, exerciseType)) {
        validCompletedSetCount += 1
      }
    }
  }

  return {
    exerciseCount: workout.exerciseOrder.length,
    setCount,
    completedSetCount,
    validCompletedSetCount,
  }
}

export function getWorkoutSaveState(
  workout: ActiveWorkoutDraft,
  exerciseTypeMap: ExerciseTypeMap,
): WorkoutSaveValidationResult {
  const reasons: string[] = []
  const validExerciseInstanceIds: string[] = []
  const invalidExerciseInstanceIds: string[] = []
  const validSetIds: string[] = []
  const invalidSetIds: string[] = []
  const invalidCompletedSetIds: string[] = []

  if (workout.exerciseOrder.length === 0) {
    reasons.push('Add at least one exercise.')
  }

  if (
    new Date(workout.startTime).getTime() >
    new Date(workout.endTime ?? new Date().toISOString()).getTime()
  ) {
    reasons.push('Workout end time cannot be earlier than start time.')
  }

  let completedSetCount = 0

  for (const exerciseInstanceId of workout.exerciseOrder) {
    const exercise = workout.exercisesById[exerciseInstanceId]
    if (!exercise) continue

    const exerciseType = exerciseTypeMap.get(exercise.exerciseId)
    let hasValidSet = false

    for (const setId of exercise.setOrder) {
      const set = workout.setsById[setId]
      if (!set) continue

      if (set.completed) {
        completedSetCount += 1
      }

      if (!exerciseType || !isValidCompletedSet(set, exerciseType)) {
        invalidSetIds.push(setId)
        if (set.completed) {
          invalidCompletedSetIds.push(setId)
        }
        continue
      }

      validSetIds.push(setId)
      hasValidSet = true
    }

    if (hasValidSet) {
      validExerciseInstanceIds.push(exerciseInstanceId)
    } else {
      invalidExerciseInstanceIds.push(exerciseInstanceId)
    }
  }

  if (validSetIds.length === 0) {
    reasons.push('Complete at least one valid set before saving.')
  }

  if (invalidCompletedSetIds.length > 0) {
    reasons.push('Fix the completed sets that are missing required values.')
  }

  return {
    canSave: reasons.length === 0,
    reasons,
    validExerciseInstanceIds,
    invalidExerciseInstanceIds,
    validSetIds,
    invalidSetIds,
    invalidCompletedSetIds,
    stats: {
      exerciseCount: workout.exerciseOrder.length,
      completedSetCount,
      validCompletedSetCount: validSetIds.length,
    },
  }
}

export function finalizeWorkoutForSave(
  workout: ActiveWorkoutDraft,
  exerciseTypeMap: ExerciseTypeMap,
  source?: ActiveWorkoutSource | null,
): WorkoutFinalizeResult {
  const removed: WorkoutFinalizeResult['removed'] = {
    setIds: [],
    exerciseInstanceIds: [],
    groupIds: [],
  }

  const finalizedExercises: WorkoutPayloadDraft['exercises'] = []
  const validExerciseInstanceIds = new Set<string>()

  for (const exerciseInstanceId of workout.exerciseOrder) {
    const exercise = workout.exercisesById[exerciseInstanceId]
    if (!exercise) continue

    const exerciseType = exerciseTypeMap.get(exercise.exerciseId)
    if (!exerciseType) {
      removed.exerciseInstanceIds.push(exerciseInstanceId)
      continue
    }

    const validSets: WorkoutPayloadDraft['exercises'][number]['sets'] = []

    for (const setId of exercise.setOrder) {
      const rawSet = workout.setsById[setId]
      if (!rawSet) continue

      const set = finalizeSetTimer(rawSet)

      if (!isValidCompletedSet(set, exerciseType)) {
        removed.setIds.push(setId)
        continue
      }

      validSets.push({
        setIndex: validSets.length,
        setType: set.setType,
        weight: set.weight ?? null,
        reps: set.reps ?? null,
        rpe: set.rpe ?? null,
        durationSeconds: set.durationSeconds ?? null,
        restSeconds: set.restSeconds ?? null,
        note: set.note ?? null,
      })
    }

    if (validSets.length === 0) {
      removed.exerciseInstanceIds.push(exerciseInstanceId)
      continue
    }

    validExerciseInstanceIds.add(exerciseInstanceId)

    const payloadExercise: WorkoutPayloadDraft['exercises'][number] = {
      exerciseId: exercise.exerciseId,
      exerciseIndex: finalizedExercises.length,
      sets: validSets,
    }

    if (exercise.groupId) {
      payloadExercise.exerciseGroupId = exercise.groupId
    }

    finalizedExercises.push(payloadExercise)
  }

  const validGroups = Object.values(workout.groupsById)
    .filter((group) => {
      const remainingMembers = group.exerciseInstanceIds.filter((id) =>
        validExerciseInstanceIds.has(id),
      )

      if (remainingMembers.length < 2) {
        removed.groupIds.push(group.id)
        return false
      }

      return true
    })
    .sort((a, b) => a.groupIndex - b.groupIndex)
    .map((group, index) => ({
      id: group.id,
      groupType: group.groupType,
      groupIndex: index,
      restSeconds: group.restSeconds ?? null,
    }))

  const validGroupIds = new Set(validGroups.map((group) => group.id))

  const payload: WorkoutPayloadDraft = {
    title: workout.title.trim() ? workout.title.trim() : null,
    startTime: workout.startTime,
    endTime: workout.endTime ?? new Date().toISOString(),
    visibility: workout.visibility,
    userProgramDayId: source?.userProgramDayId ?? undefined,
    exercises: finalizedExercises.map((exercise, index) => {
      const nextExercise = { ...exercise, exerciseIndex: index }

      if (nextExercise.exerciseGroupId && !validGroupIds.has(nextExercise.exerciseGroupId)) {
        delete nextExercise.exerciseGroupId
      }

      return nextExercise
    }),
    exerciseGroups: validGroups.map((group) => {
      if (group.restSeconds == null) {
        return {
          id: group.id,
          groupType: group.groupType,
          groupIndex: group.groupIndex,
        }
      }

      return group
    }),
  }

  return {
    payload,
    removed,
    warnings: buildFinalizeWarnings(removed),
  }
}

export function finalizeTemplateForSave(
  workout: ActiveWorkoutDraft,
  validExerciseIds: Set<string>,
  source?: ActiveWorkoutSource | null,
): TemplateFinalizeResult {
  const removed: TemplateFinalizeResult['removed'] = {
    exerciseInstanceIds: [],
    groupIds: [],
  }

  const finalizedExercises: DraftTemplate['exercises'] = []
  const validExerciseInstanceIds = new Set<string>()

  for (const exerciseInstanceId of workout.exerciseOrder) {
    const exercise = workout.exercisesById[exerciseInstanceId]
    if (!exercise) continue

    if (!validExerciseIds.has(exercise.exerciseId)) {
      removed.exerciseInstanceIds.push(exerciseInstanceId)
      continue
    }

    validExerciseInstanceIds.add(exerciseInstanceId)
    finalizedExercises.push({
      id: exercise.id,
      exerciseId: exercise.exerciseId,
      exerciseIndex: finalizedExercises.length,
      exerciseGroupId: exercise.groupId ?? undefined,
      sets: exercise.setOrder
        .map((setId) => workout.setsById[setId])
        .filter((set): set is NonNullable<typeof set> => Boolean(set))
        .map((set, setIndex) => ({
          id: set.id,
          setIndex,
          setType: set.setType,
          weight: set.weight ?? undefined,
          reps: set.reps ?? undefined,
          rpe: set.rpe ?? undefined,
          durationSeconds: finalizeSetTimer(set).durationSeconds ?? undefined,
          restSeconds: set.restSeconds ?? undefined,
          note: set.note ?? undefined,
        })),
    })
  }

  const validGroups = Object.values(workout.groupsById)
    .filter((group) => {
      const remainingMembers = group.exerciseInstanceIds.filter((id) =>
        validExerciseInstanceIds.has(id),
      )

      if (remainingMembers.length < 2) {
        removed.groupIds.push(group.id)
        return false
      }

      return true
    })
    .sort((a, b) => a.groupIndex - b.groupIndex)
    .map((group, index) => ({
      id: group.id,
      groupType: group.groupType,
      groupIndex: index,
      restSeconds: group.restSeconds ?? undefined,
    }))

  const validGroupIds = new Set(validGroups.map((group) => group.id))

  const template: DraftTemplate = {
    clientId: source?.templateClientId ?? Crypto.randomUUID(),
    id: source?.templateId ?? null,
    userId: '',
    title: workout.title.trim(),
    notes: workout.notes?.trim() || undefined,
    sourceShareId: source?.templateSourceShareId ?? undefined,
    authorName: source?.templateAuthorName ?? undefined,
    exercises: finalizedExercises.map((exercise, index) => ({
      ...exercise,
      exerciseIndex: index,
      exerciseGroupId:
        exercise.exerciseGroupId && validGroupIds.has(exercise.exerciseGroupId)
          ? exercise.exerciseGroupId
          : undefined,
    })),
    exerciseGroups: validGroups,
  }

  return {
    template,
    removed,
    warnings: buildTemplateFinalizeWarnings(removed),
  }
}

export const useWorkoutEditor = create<ActiveWorkoutStore>()(
  persist(
    (set, get) => ({
      workout: null,
      mode: null,
      source: null,

      initiateWorkout: (input) => {
        if (get().workout) return

        if (input?.mode === 'edit-history') {
          set({
            workout: createWorkoutFromHistory(input.historyItem),
            mode: 'edit-history',
            source: {
              workoutHistoryId: input.historyItem.id,
            },
          })
          return
        }

        if (input?.mode === 'template-edit') {
          set({
            workout: createTemplateEditorDraft(input.template),
            mode: 'template-edit',
            source: {
              templateId: input.template.id,
              templateAuthorName: input.template.authorName,
              templateSourceShareId: input.template.sourceShareId ?? null,
              programWeekIndex: input.programWeekIndex ?? null,
              programDayIndex: input.programDayIndex ?? null,
            },
          })
          return
        }

        if (input?.mode === 'template-create') {
          const template =
            input.template && 'clientId' in input.template
              ? input.template
              : input.template
                ? { ...input.template, clientId: Crypto.randomUUID() }
                : undefined

          set({
            workout: createTemplateEditorDraft(template),
            mode: 'template-create',
            source: {
              templateClientId: template?.clientId ?? Crypto.randomUUID(),
              templateAuthorName: template?.authorName ?? null,
              templateSourceShareId: template?.sourceShareId ?? null,
              programWeekIndex: input.programWeekIndex ?? null,
              programDayIndex: input.programDayIndex ?? null,
            },
          })
          return
        }

        if (input?.mode === 'program-workout') {
          set({
            workout: createWorkoutFromProgram(input.templateSnapshot),
            mode: 'program-workout',
            source: {
              userProgramDayId: input.userProgramDayId,
              templateId: input.templateSnapshot.originalTemplateId,
            },
          })
          return
        }

        if (input?.template) {
          set({
            workout: createDraftFromTemplateLike(input.template),
            mode: 'create',
            source: {
              templateId: input.template.id ?? null,
            },
          })
          return
        }

        set({
          workout: createEmptyWorkout(input),
          mode: 'create',
          source: null,
        })
      },

      updateWorkoutMeta: (patch) =>
        set((state) => {
          if (!state.workout) return state

          return {
            workout: {
              ...state.workout,
              ...patch,
            },
          }
        }),

  pauseWorkout: () =>
    set((state) => {
      if (!state.workout || state.workout.pausedAt) return state

      const currentRestTimer = state.workout.restTimer
      const nextRestTimer =
        currentRestTimer.running && currentRestTimer.seconds != null
          ? {
              seconds: getRestTimerRemainingSeconds(currentRestTimer),
              startedAt: null,
              running: false,
              targetSetId: currentRestTimer.targetSetId,
              pausedByWorkout: true,
            }
          : currentRestTimer

      return {
        workout: {
          ...state.workout,
          pausedAt: Date.now(),
          restTimer: nextRestTimer,
        },
      }
    }),

  resumeWorkout: () =>
    set((state) => {
      if (!state.workout || !state.workout.pausedAt) return state

      const pausedSeconds = Math.max(
        0,
        Math.floor((Date.now() - state.workout.pausedAt) / 1000),
      )

      return {
        workout: {
          ...state.workout,
          pausedAt: null,
          accumulatedPauseSeconds: state.workout.accumulatedPauseSeconds + pausedSeconds,
          restTimer:
            state.workout.restTimer.pausedByWorkout && state.workout.restTimer.seconds != null
              ? {
                  ...state.workout.restTimer,
                  startedAt: Date.now(),
                  running: true,
                  pausedByWorkout: false,
                }
              : state.workout.restTimer,
        },
      }
    }),

  addExercise: (exerciseId) => {
    const workout = get().workout
    if (!workout) return null
    const mode = get().mode

    if (
      (mode === 'template-create' || mode === 'template-edit') &&
      workout.exerciseOrder.some((id) => workout.exercisesById[id]?.exerciseId === exerciseId)
    ) {
      return null
    }

    const exerciseInstanceId = Crypto.randomUUID()

    set((state) => {
      if (!state.workout) return state

      const nextWorkout: ActiveWorkoutDraft = {
        ...state.workout,
        exerciseOrder: [...state.workout.exerciseOrder, exerciseInstanceId],
        exercisesById: {
          ...state.workout.exercisesById,
          [exerciseInstanceId]: {
            id: exerciseInstanceId,
            exerciseId,
            setOrder: [],
            groupId: null,
            order: state.workout.exerciseOrder.length,
            restMode: 'perSet',
            sharedRestSeconds: null,
          },
        },
      }

      return { workout: nextWorkout }
    })

    return exerciseInstanceId
  },

  replaceExercise: (exerciseInstanceId, exerciseId) =>
    set((state) => {
      if (!state.workout) return state

      const exercise = state.workout.exercisesById[exerciseInstanceId]
      if (!exercise) return state

      const isTemplateMode = state.mode === 'template-create' || state.mode === 'template-edit'
      if (
        isTemplateMode &&
        state.workout.exerciseOrder.some(
          (id) => id !== exerciseInstanceId && state.workout?.exercisesById[id]?.exerciseId === exerciseId,
        )
      ) {
        return state
      }

      return {
        workout: {
          ...state.workout,
          exercisesById: {
            ...state.workout.exercisesById,
            [exerciseInstanceId]: {
              ...exercise,
              exerciseId,
            },
          },
        },
      }
    }),

  reorderExercises: (exerciseInstanceIds) =>
    set((state) => {
      if (!state.workout) return state

      if (exerciseInstanceIds.length !== state.workout.exerciseOrder.length) {
        return state
      }

      const uniqueIds = [...new Set(exerciseInstanceIds)]
      if (uniqueIds.length !== state.workout.exerciseOrder.length) {
        return state
      }

      const currentIds = new Set(state.workout.exerciseOrder)
      if (!uniqueIds.every((id) => currentIds.has(id))) {
        return state
      }

      const nextWorkout: ActiveWorkoutDraft = {
        ...state.workout,
        exerciseOrder: uniqueIds,
        exercisesById: { ...state.workout.exercisesById },
      }

      reindexExercises(nextWorkout)
      return { workout: nextWorkout }
    }),

  deleteExercise: (exerciseInstanceId) =>
    set((state) => {
      if (!state.workout) return state

      const target = state.workout.exercisesById[exerciseInstanceId]
      if (!target) return state

      const nextWorkout: ActiveWorkoutDraft = {
        ...state.workout,
        exerciseOrder: state.workout.exerciseOrder.filter((id) => id !== exerciseInstanceId),
        exercisesById: { ...state.workout.exercisesById },
        setsById: { ...state.workout.setsById },
        groupsById: Object.fromEntries(
          Object.entries(state.workout.groupsById).map(([groupId, group]) => [
            groupId,
            { ...group, exerciseInstanceIds: [...group.exerciseInstanceIds] },
          ]),
        ),
      }

      for (const setId of target.setOrder) {
        if (nextWorkout.restTimer.targetSetId === setId) {
          nextWorkout.restTimer = {
            seconds: null,
            startedAt: null,
            running: false,
            targetSetId: null,
            pausedByWorkout: false,
          }
        }
        delete nextWorkout.setsById[setId]
      }

      if (target.groupId) {
        detachExerciseFromGroup(nextWorkout, exerciseInstanceId)
      }

      delete nextWorkout.exercisesById[exerciseInstanceId]
      reindexExercises(nextWorkout)

      return { workout: nextWorkout }
    }),

  updateExerciseRest: (exerciseInstanceId, input) =>
    set((state) => {
      if (!state.workout) return state

      const target = state.workout.exercisesById[exerciseInstanceId]
      if (!target) return state

      const nextRestMode = input.restMode ?? target.restMode
      const nextSharedRestSeconds =
        input.sharedRestSeconds !== undefined ? input.sharedRestSeconds : target.sharedRestSeconds

      const nextWorkout: ActiveWorkoutDraft = {
        ...state.workout,
        exercisesById: {
          ...state.workout.exercisesById,
          [exerciseInstanceId]: {
            ...target,
            restMode: nextRestMode,
            sharedRestSeconds: nextSharedRestSeconds,
          },
        },
        setsById: { ...state.workout.setsById },
      }

      if (nextRestMode === 'exercise' && nextSharedRestSeconds != null) {
        for (const setId of target.setOrder) {
          const set = nextWorkout.setsById[setId]
          if (!set) continue

          nextWorkout.setsById[setId] = {
            ...set,
            restSeconds: nextSharedRestSeconds,
          }
        }
      }

      return { workout: nextWorkout }
    }),

  addSet: (exerciseInstanceId) => {
    const workout = get().workout
    const exercise = workout?.exercisesById[exerciseInstanceId]
    if (!workout || !exercise) return null

    const setId = Crypto.randomUUID()

    set((state) => {
      if (!state.workout) return state
      const target = state.workout.exercisesById[exerciseInstanceId]
      if (!target) return state

      return {
        workout: {
          ...state.workout,
          exercisesById: {
            ...state.workout.exercisesById,
            [exerciseInstanceId]: {
              ...target,
              setOrder: [...target.setOrder, setId],
            },
          },
          setsById: {
            ...state.workout.setsById,
            [setId]: {
              id: setId,
              exerciseInstanceId,
              setIndex: target.setOrder.length,
              setType: 'working',
              restSeconds:
                target.restMode === 'exercise' ? (target.sharedRestSeconds ?? undefined) : undefined,
              completed: false,
            },
          },
        },
      }
    })

    return setId
  },

  deleteSet: (exerciseInstanceId, setId) =>
    set((state) => {
      if (!state.workout) return state

      const target = state.workout.exercisesById[exerciseInstanceId]
      if (!target || !state.workout.setsById[setId]) return state

      const nextWorkout: ActiveWorkoutDraft = {
        ...state.workout,
        exercisesById: {
          ...state.workout.exercisesById,
          [exerciseInstanceId]: {
            ...target,
            setOrder: target.setOrder.filter((id) => id !== setId),
          },
        },
        setsById: { ...state.workout.setsById },
      }

      delete nextWorkout.setsById[setId]
      reindexSetsForExercise(nextWorkout, exerciseInstanceId)

      if (nextWorkout.restTimer.targetSetId === setId) {
        nextWorkout.restTimer = {
          seconds: null,
          startedAt: null,
          running: false,
          targetSetId: null,
          pausedByWorkout: false,
        }
      }

      return { workout: nextWorkout }
    }),

  updateSet: (setId, patch) =>
    set((state) => {
      if (!state.workout) return state

      const target = state.workout.setsById[setId]
      if (!target) return state

      return {
        workout: {
          ...state.workout,
          setsById: {
            ...state.workout.setsById,
            [setId]: {
              ...target,
              ...normalizeSetPatch(patch),
            },
          },
        },
      }
    }),

  toggleSetCompleted: (setId) =>
    set((state) => {
      if (!state.workout) return state

      const target = state.workout.setsById[setId]
      if (!target) return state

      const nextCompleted = !target.completed
      const nextRestSeconds = target.restSeconds ?? 0

      return {
        workout: {
          ...state.workout,
          setsById: {
            ...state.workout.setsById,
            [setId]: {
              ...target,
              completed: nextCompleted,
            },
          },
          restTimer: nextCompleted
            ? nextRestSeconds > 0
              ? {
                  seconds: nextRestSeconds,
                  startedAt: Date.now(),
                  running: true,
                  targetSetId: setId,
                  pausedByWorkout: false,
                }
              : state.workout.restTimer
            : state.workout.restTimer.targetSetId === setId
              ? {
                  seconds: null,
                  startedAt: null,
                  running: false,
                  targetSetId: null,
                  pausedByWorkout: false,
                }
              : state.workout.restTimer,
        },
      }
    }),

  startSetTimer: (setId) =>
    set((state) => {
      if (!state.workout) return state

      const target = state.workout.setsById[setId]
      if (!target || target.durationStartedAt) return state

      return {
        workout: {
          ...state.workout,
          setsById: {
            ...state.workout.setsById,
            [setId]: {
              ...target,
              durationStartedAt: Date.now(),
            },
          },
        },
      }
    }),

  stopSetTimer: (setId) =>
    set((state) => {
      if (!state.workout) return state

      const target = state.workout.setsById[setId]
      if (!target) return state

      return {
        workout: {
          ...state.workout,
          setsById: {
            ...state.workout.setsById,
            [setId]: finalizeSetTimer(target),
          },
        },
      }
    }),

  startRestTimer: (seconds, targetSetId = null) =>
    set((state) => {
      if (!state.workout) return state

      const nextSeconds = Math.max(0, Math.floor(seconds))

      return {
        workout: {
          ...state.workout,
          restTimer:
            nextSeconds === 0
              ? {
                  seconds: null,
                  startedAt: null,
                  running: false,
                  targetSetId: null,
                  pausedByWorkout: false,
                }
              : {
                  seconds: nextSeconds,
                  startedAt: Date.now(),
                  running: true,
                  targetSetId,
                  pausedByWorkout: false,
                },
        },
      }
    }),

  pauseRestTimer: () =>
    set((state) => {
      if (!state.workout) return state

      const currentRestTimer = state.workout.restTimer
      if (!currentRestTimer.running || currentRestTimer.seconds == null) return state

      return {
        workout: {
          ...state.workout,
          restTimer: {
            seconds: getRestTimerRemainingSeconds(currentRestTimer),
            startedAt: null,
            running: false,
            targetSetId: currentRestTimer.targetSetId,
            pausedByWorkout: false,
          },
        },
      }
    }),

  resumeRestTimer: () =>
    set((state) => {
      if (!state.workout) return state

      const currentRestTimer = state.workout.restTimer
      if (currentRestTimer.running || currentRestTimer.seconds == null) return state

      return {
        workout: {
          ...state.workout,
          restTimer: {
            ...currentRestTimer,
            startedAt: Date.now(),
            running: true,
            pausedByWorkout: false,
          },
        },
      }
    }),

  stopRestTimer: () =>
    set((state) => {
      if (!state.workout) return state

      return {
        workout: {
          ...state.workout,
          restTimer: {
            seconds: null,
            startedAt: null,
            running: false,
            targetSetId: null,
            pausedByWorkout: false,
          },
        },
      }
    }),

  adjustRestTimer: (deltaSeconds) =>
    set((state) => {
      if (!state.workout) return state

      const currentRestTimer = state.workout.restTimer
      if (currentRestTimer.seconds == null) return state

      const remaining = getRestTimerRemainingSeconds(currentRestTimer)
      const nextSeconds = Math.max(0, remaining + deltaSeconds)

      return {
        workout: {
          ...state.workout,
          restTimer:
            nextSeconds === 0
              ? {
                  seconds: 0,
                  startedAt: null,
                  running: false,
                  targetSetId: currentRestTimer.targetSetId,
                  pausedByWorkout: false,
                }
              : {
                  seconds: nextSeconds,
                  startedAt: currentRestTimer.running ? Date.now() : null,
                  running: currentRestTimer.running,
                  targetSetId: currentRestTimer.targetSetId,
                  pausedByWorkout: false,
                }
        },
      }
    }),

  createGroup: ({ groupType, exerciseInstanceIds, restSeconds = null }) => {
    const workout = get().workout
    if (!workout || exerciseInstanceIds.length < 2) return null

    const uniqueIds = [...new Set(exerciseInstanceIds)]
    if (!isValidGroupSelection(groupType, uniqueIds)) return null

    const allUngrouped = uniqueIds.every((id) => {
      const exercise = workout.exercisesById[id]
      return exercise && !exercise.groupId
    })

    if (!allUngrouped) return null

    const groupId = Crypto.randomUUID()

    set((state) => {
      if (!state.workout) return state

      const nextExercisesById = { ...state.workout.exercisesById }
      for (const exerciseInstanceId of uniqueIds) {
        const exercise = nextExercisesById[exerciseInstanceId]
        if (exercise) {
          nextExercisesById[exerciseInstanceId] = { ...exercise, groupId }
        }
      }

      return {
        workout: {
          ...state.workout,
          exercisesById: nextExercisesById,
          groupsById: {
            ...state.workout.groupsById,
            [groupId]: {
              id: groupId,
              exerciseInstanceIds: uniqueIds,
              groupType,
              groupIndex: Object.keys(state.workout.groupsById).length,
              restSeconds,
            },
          },
        },
      }
    })

    return groupId
  },

  updateGroup: (groupId, patch) =>
    set((state) => {
      if (!state.workout) return state

      const target = state.workout.groupsById[groupId]
      if (!target) return state

      const nextWorkout: ActiveWorkoutDraft = {
        ...state.workout,
        exercisesById: { ...state.workout.exercisesById },
        groupsById: Object.fromEntries(
          Object.entries(state.workout.groupsById).map(([id, group]) => [
            id,
            { ...group, exerciseInstanceIds: [...group.exerciseInstanceIds] },
          ]),
        ),
      }

      const nextGroup = nextWorkout.groupsById[groupId]
      const requestedIds = patch.exerciseInstanceIds
      const nextGroupType = patch.groupType ?? nextGroup.groupType

      if (requestedIds) {
        const uniqueIds = [...new Set(requestedIds)]
        if (!isValidGroupSelection(nextGroupType, uniqueIds)) {
          clearInvalidGroups(nextWorkout, [groupId])
          return { workout: nextWorkout }
        }

        const canAssign = uniqueIds.every((exerciseInstanceId) => {
          const exercise = nextWorkout.exercisesById[exerciseInstanceId]
          return exercise && (!exercise.groupId || exercise.groupId === groupId)
        })

        if (!canAssign) {
          return state
        }

        for (const exerciseInstanceId of nextGroup.exerciseInstanceIds) {
          const exercise = nextWorkout.exercisesById[exerciseInstanceId]
          if (exercise?.groupId === groupId && !uniqueIds.includes(exerciseInstanceId)) {
            nextWorkout.exercisesById[exerciseInstanceId] = { ...exercise, groupId: null }
          }
        }

        for (const exerciseInstanceId of uniqueIds) {
          const exercise = nextWorkout.exercisesById[exerciseInstanceId]
          if (exercise) {
            nextWorkout.exercisesById[exerciseInstanceId] = { ...exercise, groupId }
          }
        }

        nextGroup.exerciseInstanceIds = uniqueIds
      }

      nextWorkout.groupsById[groupId] = {
        ...nextGroup,
        groupType: nextGroupType,
        groupIndex: patch.groupIndex ?? nextGroup.groupIndex,
        restSeconds: patch.restSeconds ?? nextGroup.restSeconds,
      }

      reindexGroups(nextWorkout)
      return { workout: nextWorkout }
    }),

  deleteGroup: (groupId) =>
    set((state) => {
      if (!state.workout || !state.workout.groupsById[groupId]) return state

      const nextWorkout: ActiveWorkoutDraft = {
        ...state.workout,
        exercisesById: { ...state.workout.exercisesById },
        groupsById: { ...state.workout.groupsById },
      }

      clearInvalidGroups(nextWorkout, [groupId])
      return { workout: nextWorkout }
    }),

      discardWorkout: () =>
        set({
          workout: null,
          mode: null,
          source: null,
        }),
    }),
    {
      name: 'workout-editor-store',
      storage: zustandStorage,
      partialize: (state): WorkoutEditorPersistedState => ({
        workout: state.workout,
        mode: state.mode,
        source: state.source,
      }),
    },
  ),
)

export const useActiveWorkout = useWorkoutEditor
