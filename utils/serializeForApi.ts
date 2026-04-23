import { TemplatePayload, UserPayload } from '@/types/sync'
import { DraftProgram, ProgramCreatePayload, ProgramDayPayload, ProgramUpdatePayload } from '@/types/program'
import { DraftTemplate } from '@/types/template'
import { WorkoutLog } from '@/types/workout'

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
		userProgramDayId: workout.userProgramDayId,

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


// Program serialization
/**
 * Normalizes duration options for API
 * @param durationOptions - The duration options to normalize
 * @returns The normalized duration options
 */
function normalizeDurationOptions(durationOptions: number[]): number[] {
	return [...new Set(durationOptions.map(Number).filter(n => Number.isInteger(n) && n > 0))].sort((a, b) => a - b)
}

/**
 * Serializes a program day for API
 * @param day - The program day to serialize
 * @returns The serialized program day
 */
function serializeProgramDay(day: DraftProgram['weeks'][number]['days'][number]): ProgramDayPayload {
	const baseDay: ProgramDayPayload = {
		name: day.name.trim(),
		dayIndex: day.dayIndex,
		isRestDay: day.isRestDay,
	}

	if (!day.isRestDay) {
		baseDay.templateId = day.templateId && day.templateId.trim().length > 0 ? day.templateId : null
	}

	return baseDay
}

/**
 * Serializes program weeks for API
 * @param program - The program to serialize
 * @returns The serialized program weeks
 */
function serializeProgramWeeks(program: DraftProgram): ProgramCreatePayload['weeks'] {
	return [...program.weeks]
		.sort((a, b) => a.weekIndex - b.weekIndex)
		.map(week => ({
			name: week.name.trim(),
			weekIndex: week.weekIndex,
			days: [...week.days].sort((a, b) => a.dayIndex - b.dayIndex).map(day => serializeProgramDay(day)),
		}))
}

/**
 * Serializes a program for API
 * @param program - The program to serialize
 * @returns The serialized program
 */
export function serializeProgramCreateForApi(program: DraftProgram): ProgramCreatePayload {
	return {
		clientId: program.clientId,
		title: program.title.trim(),
		description: program.description?.trim() ? program.description.trim() : null,
		experienceLevel: program.experienceLevel,
		durationOptions: normalizeDurationOptions(program.durationOptions),
		weeks: serializeProgramWeeks(program),
	}
}

/**
 * Serializes a program for API
 * @param program - The program to serialize
 * @returns The serialized program
 */
export function serializeProgramUpdateForApi(program: DraftProgram): ProgramUpdatePayload {
	return {
		title: program.title.trim(),
		description: program.description?.trim() ? program.description.trim() : null,
		experienceLevel: program.experienceLevel,
		durationOptions: normalizeDurationOptions(program.durationOptions),
		weeks: serializeProgramWeeks(program),
	}
}
