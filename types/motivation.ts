export type MotivationCategory = 'progress' | 'streak' | 'consistency' | 'recovery' | 'neutral'

export interface MotivationInput {
	weeklyVolume: number
	lastWeekVolume: number
	streakDays: number
	workoutsThisWeek: number
	daysSinceLastWorkout: number
	prCount?: number
}

export interface MotivationResult {
	text: string
	category: MotivationCategory
}
