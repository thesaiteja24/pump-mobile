export type HabitFooterType = 'weeklyStreak' | 'weeklyCount'
export type HabitTrackingType = 'streak' | 'quantity'
export type HabitSourceType = 'manual' | 'internal'

export interface HabitType {
	id: string
	title: string
	colorScheme: string
	trackingType: HabitTrackingType
	targetValue?: number | null
	unit?: string | null
	footerType: HabitFooterType
	source: HabitSourceType
	internalMetricId?: string | null
}

export interface HabitLogType {
	date: string
	value: number
}
