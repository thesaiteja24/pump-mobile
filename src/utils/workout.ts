import { differenceInMinutes } from 'date-fns'
import { ExerciseType } from '@/types/exercises'

import { WorkoutHistoryItem, WorkoutLog, WorkoutLogSet, WorkoutPruneReport } from '@/types/workouts'

/* ───────────────── Metrics ───────────────── */

export function calculateWorkoutMetrics(
  workout: WorkoutHistoryItem | WorkoutLog,
  exerciseTypeMap: Map<string, ExerciseType>,
) {
  let tonnage = 0
  let completedSets = 0

  // Guard against undefined or null exercises
  if (!workout || !workout.exercises || workout.exercises.length === 0) {
    return { tonnage: 0, completedSets: 0 }
  }

  const isLiveWorkout = workout.exercises.some((ex) => ex.sets?.some((set) => 'completed' in set))

  workout.exercises.forEach((ex) => {
    const type = exerciseTypeMap.get(ex.exerciseId)
    if (!type || !ex.sets) return

    ex.sets.forEach((set) => {
      // Live workout → only completed sets
      if (isLiveWorkout && 'completed' in set && !set.completed) return

      // this will and should only run for live workouts
      // sets in workout history are always valid (as proper validation happens on backend and frontend before saving)
      if (isLiveWorkout && !isValidCompletedSet(set as WorkoutLogSet, type)) return

      completedSets += 1

      if (type === 'weighted' || type === 'assisted') {
        const weight = typeof set.weight === 'string' ? Number(set.weight) : set.weight

        if (weight && set.reps) {
          tonnage += weight * set.reps
        }
      }
    })
  })

  return { tonnage, completedSets }
}

/* ───────────────── Timers ───────────────── */

/**
 * Formats total seconds into MM:SS or HH:MM:SS format.
 * @param totalSeconds - The total number of seconds.
 * @returns A formatted time string.
 */
export function formatSeconds(totalSeconds: number) {
  const h = Math.floor(totalSeconds / 3600)
  const m = Math.floor((totalSeconds % 3600) / 60)
  const s = totalSeconds % 60

  if (h > 0) {
    return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  }

  return `${m}:${String(s).padStart(2, '0')}`
}

/**
 * Calculates the duration between two ISO date strings and returns a formatted string.
 * @param start - The start date ISO string.
 * @param end - The end date ISO string.
 * @returns A string representing the duration (e.g., "45m", "1h 30m", "2h").
 */
export function formatDurationFromDates(start: string, end: string) {
  const minutes = differenceInMinutes(new Date(end), new Date(start))

  if (minutes < 60) return `${minutes}m`

  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m ? `${h}h ${m}m` : `${h}h`
}

export function finalizeSetTimer(set: WorkoutLogSet): WorkoutLogSet {

  if (!set.durationStartedAt) return set

  const elapsed = Math.floor((Date.now() - set.durationStartedAt) / 1000)

  return {
    ...set,
    durationSeconds: (set.durationSeconds ?? 0) + elapsed,
    durationStartedAt: null,
  }
}

/* ───────────────── Validation ───────────────── */
// NOTE: Keep this logic in sync with backend `src/utils/workoutValidation.ts`
export function isValidCompletedSet(set: WorkoutLogSet, exerciseType: ExerciseType): boolean {
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

/* ───────────────── Prune Message ───────────────── */
export function buildPruneMessage(report: WorkoutPruneReport): string | null {
  const parts: string[] = []

  if (report.droppedSets > 0) {
    parts.push(`${report.droppedSets} invalid set${report.droppedSets > 1 ? 's' : ''}`)
  }

  if (report.droppedExercises > 0) {
    parts.push(`${report.droppedExercises} exercise${report.droppedExercises > 1 ? 's' : ''}`)
  }

  if (report.droppedGroups > 0) {
    parts.push(`${report.droppedGroups} group${report.droppedGroups > 1 ? 's' : ''}`)
  }

  if (parts.length === 0) return null

  return `We removed ${parts.join(', ')} because they were incomplete.`
}
