import { ExerciseType } from '@/stores/exerciseStore'
import { WorkoutHistoryItem } from '@/stores/workoutStore'
import { parseUTCToLocalDate, toDateKey } from './time'
import { calculateWorkoutMetrics } from './workout'

export interface AnalyticsMetrics {
	streakDays: number
	workoutsThisWeek: number
	daysSinceLastWorkout: number
	weeklyVolume: number
	lastWeekVolume: number
	workoutDates: Set<string>
}

/**
 * Calculates core analytics metrics from workout history.
 * Designed to be fast and memoize-friendly.
 */
export function calculateAnalytics(
	history: WorkoutHistoryItem[],
	exerciseTypeMap: Map<string, ExerciseType>
): AnalyticsMetrics {
	const today = new Date()
	const todayKey = toDateKey(today)

	// 1. Pre-process dates and Sort (Descending: Newest first)
	// Ensure history is sorted by startTime desc
	const sortedHistory = [...history].sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime())

	const workoutDates = new Set<string>()
	sortedHistory.forEach(w => {
		workoutDates.add(toDateKey(parseUTCToLocalDate(w.startTime)))
	})

	// 2. Calculate Streak
	let currentStreak = 0
	const checkDate = new Date(today)

	// If today has a workout, streak includes today.
	// If not, we check yesterday to see if streak is alive.
	// Actually, standard streak logic usually allows "today" to be part of streak if done,
	// or checks yesterday to continue.

	// Logic: Check backwards from today.
	// If we worked out today, streak starts today.
	// If not, but we worked out yesterday, streak starts yesterday.
	// If neither, streak is 0.

	let streakCursor = new Date(today)

	if (!workoutDates.has(toDateKey(today))) {
		// If no workout today, check yesterday
		streakCursor.setDate(streakCursor.getDate() - 1)
		if (!workoutDates.has(toDateKey(streakCursor))) {
			// No workout yesterday either -> Streak broken/zero
			currentStreak = 0
		} else {
			// Streak is alive from yesterday
			while (workoutDates.has(toDateKey(streakCursor))) {
				currentStreak++
				streakCursor.setDate(streakCursor.getDate() - 1)
			}
		}
	} else {
		// Streak is alive from today
		while (workoutDates.has(toDateKey(streakCursor))) {
			currentStreak++
			streakCursor.setDate(streakCursor.getDate() - 1)
		}
	}

	// 3. Days Since Last Workout
	const lastWorkoutDate = sortedHistory.length > 0 ? parseUTCToLocalDate(sortedHistory[0].startTime) : null

	const daysSinceLastWorkout = lastWorkoutDate
		? Math.floor((today.getTime() - lastWorkoutDate.getTime()) / (1000 * 60 * 60 * 24))
		: 0 // Default to 0 for new users so we can show "Let's get started"

	// 4. Volume & Weekly Frequency
	const currentWeekStart = new Date(today)
	currentWeekStart.setDate(today.getDate() - today.getDay()) // Sunday
	currentWeekStart.setHours(0, 0, 0, 0)

	const lastWeekStart = new Date(currentWeekStart)
	lastWeekStart.setDate(lastWeekStart.getDate() - 7)

	const lastWeekEnd = new Date(currentWeekStart) // Ends when current week starts

	let workoutsThisWeek = 0
	let weeklyVolume = 0
	let lastWeekVolume = 0

	// We iterate history to calc volume.
	// Optimization: Stop once we go past last week if history is long?
	// For now, allow full scan as typical user history isn't massive yet.

	for (const workout of sortedHistory) {
		const wDate = parseUTCToLocalDate(workout.startTime)

		// Filter for relevant ranges
		const isThisWeek = wDate >= currentWeekStart
		const isLastWeek = wDate >= lastWeekStart && wDate < lastWeekEnd

		if (!isThisWeek && !isLastWeek) continue // Skip older workouts

		if (isThisWeek) workoutsThisWeek++

		// Calculate Volume if needed
		if (isThisWeek || isLastWeek) {
			const metrics = calculateWorkoutMetrics(workout, exerciseTypeMap)
			if (isThisWeek) weeklyVolume += metrics.tonnage
			if (isLastWeek) lastWeekVolume += metrics.tonnage
		}
	}

	return {
		streakDays: currentStreak,
		workoutsThisWeek,
		daysSinceLastWorkout,
		weeklyVolume,
		lastWeekVolume,
		workoutDates,
	}
}
