import { useUserWorkoutHistoryQuery } from '@/hooks/queries/workouts'
import { useCallback } from 'react'

/* ────────────────────────────────────────────── */
/* Exercise analytics types */
/* ────────────────────────────────────────────── */

export interface ExerciseAnalytics {
  frequency: number
  heaviestWeight: number
  best1RM: number
  bestSetVolume: number
  setRecords: Record<number, number>
  heaviestWeightRecords: Record<string, number>
  best1RMRecords: Record<string, number>
  bestSetVolumeRecords: Record<string, number>
}

/* Epley 1RM formula */
function calculate1RM(weight: number, reps: number): number {
  if (weight <= 0 || reps <= 0) return 0
  return weight * (1 + reps / 30)
}

/* ────────────────────────────────────────────── */
/* Hook */
/* ────────────────────────────────────────────── */

export interface UseAnalyticsResult {
  getExerciseAnalytics: (exerciseId: string) => ExerciseAnalytics
}

export function useAnalytics(): UseAnalyticsResult {
  const { workoutHistory } = useUserWorkoutHistoryQuery()

  /* ───────────── User-level analytics ───────────── */
  /* ───────────── Exercise-level analytics ───────────── */

  const getExerciseAnalytics = useCallback(
    (exerciseId: string): ExerciseAnalytics => {
      let frequency = 0
      let heaviestWeight = 0
      let best1RM = 0
      let bestSetVolume = 0
      let setRecords: Record<number, number> = {}
      // Data for graphs
      let heaviestWeightRecords: Record<string, number> = {}
      let best1RMRecords: Record<string, number> = {}
      let bestSetVolumeRecords: Record<string, number> = {}

      for (const workout of workoutHistory) {
        for (const exercise of workout.exercises) {
          if (exercise.exerciseId !== exerciseId) continue

          // Exercise appeared in this workout
          frequency++

          // Per-workout bests (reset for each workout)
          let workoutHeaviestWeight = 0
          let workoutBest1RM = 0
          let workoutBestSetVolume = 0

          for (const set of exercise.sets) {
            const weight = set.weight ?? 0
            const reps = set.reps ?? 0

            // Lifetime heaviest weight
            if (weight > heaviestWeight) {
              heaviestWeight = weight
            }

            // Lifetime best 1RM
            const estimated1RM = calculate1RM(weight, reps)
            if (estimated1RM > best1RM) {
              best1RM = estimated1RM
            }

            // Lifetime best set volume
            const volume = weight * reps
            if (volume > bestSetVolume) {
              bestSetVolume = volume
            }

            // Rep-based record (lifetime)
            setRecords[reps] = Math.max(setRecords[reps] ?? 0, weight)

            // Per-workout bests
            workoutHeaviestWeight = Math.max(workoutHeaviestWeight, weight)
            workoutBest1RM = Math.max(workoutBest1RM, estimated1RM)
            workoutBestSetVolume = Math.max(workoutBestSetVolume, volume)
          }

          // Store per-workout records (historically correct)
          heaviestWeightRecords[workout.startTime] = workoutHeaviestWeight
          best1RMRecords[workout.startTime] = workoutBest1RM
          bestSetVolumeRecords[workout.startTime] = workoutBestSetVolume
        }
      }

      return {
        frequency,
        heaviestWeight,
        best1RM: best1RM,
        bestSetVolume,
        setRecords,
        heaviestWeightRecords,
        best1RMRecords,
        bestSetVolumeRecords,
      }
    },
    [workoutHistory],
  )

  /* ───────────── Public API ───────────── */

  return {
    getExerciseAnalytics,
  }
}
