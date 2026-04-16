export interface AnalyticsMetrics {
	streakDays: number
	workoutsThisWeek: number
	daysSinceLastWorkout: number
	weeklyVolume: number
	lastWeekVolume: number
	workoutDates: Set<string>
}

export type MeasurementType = {
	id?: string
	date: string
	weight?: number | null
	bodyFat?: number | null
	waist?: number | null
	neck?: number | null
	shoulders?: number | null
	chest?: number | null
	leftBicep?: number | null
	rightBicep?: number | null
	leftForearm?: number | null
	rightForearm?: number | null
	abdomen?: number | null
	hips?: number | null
	leftThigh?: number | null
	rightThigh?: number | null
	leftCalf?: number | null
	rightCalf?: number | null
	notes?: string | null
	progressPicUrls?: string[]
}

export type LatestMeasurements = Omit<MeasurementType, 'id' | 'date'>

export interface MeasurementsQueryData {
	history: MeasurementType[]
	latestValues: Partial<LatestMeasurements>
	dailyWeightChange: { diff: number; isPositive: boolean } | null
}
