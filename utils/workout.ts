import { ExerciseType } from '@/stores/exerciseStore'
import { WorkoutHistoryItem, WorkoutLog, WorkoutLogSet, WorkoutPruneReport } from '@/stores/workoutStore'

/* ───────────────── Metrics ───────────────── */

export function calculateWorkoutMetrics(
	workout: WorkoutHistoryItem | WorkoutLog,
	exerciseTypeMap: Map<string, ExerciseType>
) {
	let tonnage = 0
	let completedSets = 0

	// Guard against undefined or null exercises
	if (!workout || !workout.exercises || workout.exercises.length === 0) {
		return { tonnage: 0, completedSets: 0 }
	}

	const isLiveWorkout = workout.exercises.some(ex => ex.sets?.some(set => 'completed' in set))

	workout.exercises.forEach(ex => {
		const type = exerciseTypeMap.get(ex.exerciseId)
		if (!type || !ex.sets) return

		ex.sets.forEach(set => {
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
