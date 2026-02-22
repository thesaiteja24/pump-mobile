export type MotivationCategory = 'progress' | 'streak' | 'consistency' | 'recovery' | 'neutral'

export interface MotivationInput {
	weeklyVolume: number
	lastWeekVolume: number
	streakDays: number
	workoutsThisWeek: number
	daysSinceLastWorkout: number
	prCount?: number // Optional: if we track PRs directly
}

export interface MotivationResult {
	text: string
	category: MotivationCategory
}

/**
 * Determines the motivational line based on multiple conditions.
 * Collects all valid candidates and selects one to ensure variety and relevance.
 */
export function getMotivationLine(input: MotivationInput): MotivationResult {
	const candidates: MotivationResult[] = []

	// 1. Progress: Volume Growth
	if (input.lastWeekVolume > 0) {
		const growth = (input.weeklyVolume - input.lastWeekVolume) / input.lastWeekVolume

		if (growth >= 0.05) {
			const percent = Math.round(growth * 100)
			candidates.push({
				text: `📈 Volume up ${percent}% from last week`,
				category: 'progress',
			})
			// Higher chance for big progress
			if (growth >= 0.15) {
				candidates.push({
					text: '💪 Crushing your previous volume!',
					category: 'progress',
				})
			}
		}
	}

	// 1b. Progress: PRs (Future proofing)
	if (input.prCount && input.prCount > 0) {
		candidates.push({
			text: '🚨 New Personal Best detected!',
			category: 'progress',
		})
	}

	// 2. Streak: Urgent / Active
	if (input.daysSinceLastWorkout === 1 && input.streakDays >= 1) {
		candidates.push({
			text: '🔥 Keep the streak alive!',
			category: 'streak',
		})
	}

	if (input.streakDays >= 3) {
		candidates.push({
			text: `🚀 ${input.streakDays} day streak! Unstoppable.`,
			category: 'streak',
		})
		candidates.push({
			text: 'Momentum is building',
			category: 'streak',
		})
	}

	// 3. Consistency (General Activity)
	if (input.workoutsThisWeek >= 1) {
		candidates.push({
			text: `⚡ ${input.workoutsThisWeek} workout${input.workoutsThisWeek > 1 ? 's' : ''} done this week`,
			category: 'consistency',
		})
		candidates.push({
			text: 'Consistency beats intensity',
			category: 'consistency',
		})
		candidates.push({
			text: 'Showing up is 90% of the work',
			category: 'consistency',
		})
	}

	// 4. Recovery (If needed)
	if (input.daysSinceLastWorkout > 3 && input.daysSinceLastWorkout <= 7) {
		candidates.push({
			text: 'Ready to get back at it?',
			category: 'recovery',
		})
	}

	// 5. Fallback Candidates (If pool is empty, e.g., inactive user)
	if (candidates.length === 0) {
		if (input.daysSinceLastWorkout > 7 && input.workoutsThisWeek === 0) {
			return { text: 'Rest is part of training', category: 'recovery' }
		}
		return { text: 'Let’s get started', category: 'neutral' }
	}

	// Select one randomly from candidates
	// Since this function is called inside useMemo in the UI, result is stable until data changes
	const randomIndex = Math.floor(Math.random() * candidates.length)
	return candidates[randomIndex]
}
