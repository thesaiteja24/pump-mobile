import { TemplatePayload, UserPayload } from '@/lib/sync/types'
import { DraftTemplate } from '@/stores/template/types'
import { WorkoutLog } from '@/stores/workoutStore'

/**
 * Serializes a template for API
 * @param template - The template to serialize
 * @returns The serialized template
 */
export function serializeTemplateForApi(
	template: DraftTemplate & { sourceShareId?: string; authorName?: string }
): TemplatePayload {
	return {
		id: template.id,
		clientId: template.clientId,
		title: template.title,
		notes: template.notes ?? undefined,
		sourceShareId: template.sourceShareId,
		authorName: template.authorName,

		exerciseGroups: template.exerciseGroups.map(group => {
			const baseGroup = {
				id: group.id,
				groupType: group.groupType,
				groupIndex: group.groupIndex,
			}

			const restProp =
				group.restSeconds !== null && group.restSeconds !== undefined
					? { restSeconds: Number(group.restSeconds) }
					: {}

			return {
				...baseGroup,
				...restProp,
			}
		}),

		exercises: template.exercises.map(exercise => {
			const baseExercise = {
				exerciseId: exercise.exerciseId,
				exerciseIndex: exercise.exerciseIndex,
			}

			const groupProp = exercise.exerciseGroupId ? { exerciseGroupId: exercise.exerciseGroupId } : {}

			return {
				...baseExercise,
				...groupProp,
				sets: exercise.sets.map(set => ({
					setIndex: set.setIndex,
					setType: set.setType,
					weight: set.weight ? Number(set.weight) : undefined,
					reps: set.reps ? Number(set.reps) : undefined,
					rpe: set.rpe ? Number(set.rpe) : undefined,
					durationSeconds: set.durationSeconds ? Number(set.durationSeconds) : undefined,
					restSeconds: set.restSeconds ? Number(set.restSeconds) : undefined,
					note: set.note ?? undefined,
				})),
			}
		}),
	}
}

/**
 * Serializes a workout for API
 * @param workout - The workout to serialize
 * @returns The serialized workout
 */
export function serializeWorkoutForApi(workout: WorkoutLog) {
	return {
		title: workout.title ?? null,
		startTime: workout.startTime?.toISOString() ?? null,
		endTime: workout.endTime?.toISOString() ?? null,
		visibility: workout.visibility,

		exerciseGroups: workout.exerciseGroups.map(group => {
			const baseGroup = {
				id: group.id,
				groupType: group.groupType,
				groupIndex: group.groupIndex,
			}
			// Omit restSeconds if null/undefined. Allow 0.
			const restProp =
				group.restSeconds !== null && group.restSeconds !== undefined
					? { restSeconds: Number(group.restSeconds) }
					: {}

			return {
				...baseGroup,
				...restProp,
			}
		}),

		exercises: workout.exercises.map(exercise => {
			// 1. Omit exerciseGroupId if it is null/undefined to avoid schema errors
			const baseExercise = {
				exerciseId: exercise.exerciseId,
				exerciseIndex: exercise.exerciseIndex,
			}

			const groupProp = exercise.groupId ? { exerciseGroupId: exercise.groupId } : {}

			return {
				...baseExercise,
				...groupProp,
				sets: exercise.sets.map(set => ({
					setIndex: set.setIndex,
					setType: set.setType,
					// 2. Ensure numbers are numbers, handling strings from inputs
					weight: set.weight ? Number(set.weight) : null,
					reps: set.reps ? Number(set.reps) : null,
					rpe: set.rpe ? Number(set.rpe) : null,
					durationSeconds: set.durationSeconds ? Number(set.durationSeconds) : null,
					restSeconds: set.restSeconds ? Number(set.restSeconds) : null,
					note: set.note ?? null,
				})),
			}
		}),
	}
}

export function serializeUserUpdateForApi(user: UserPayload): UserPayload {
	// @ts-ignore
	const payload: UserPayload = {}

	if (user.userId !== undefined) {
		payload.userId = user.userId
	}

	if (user.firstName !== undefined) {
		payload.firstName = user.firstName
	}

	if (user.lastName !== undefined) {
		payload.lastName = user.lastName
	}

	if (user.height !== undefined) {
		payload.height = user.height !== null ? Number(user.height) : null
	}

	if (user.weight !== undefined) {
		payload.weight = user.weight !== null ? Number(user.weight) : null
	}

	if (user.dateOfBirth !== undefined) {
		payload.dateOfBirth = user.dateOfBirth ? new Date(user.dateOfBirth).toISOString() : null
	}

	if (user.preferredWeightUnit !== undefined) {
		payload.preferredWeightUnit = user.preferredWeightUnit
	}

	if (user.preferredLengthUnit !== undefined) {
		payload.preferredLengthUnit = user.preferredLengthUnit
	}

	return payload
}
