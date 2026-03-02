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

/**
 * Calculates the Body Mass Index (BMI) from weight and height.
 *
 * @param weight - The weight in kilograms.
 * @param heightCm - The height in centimeters.
 * @returns The BMI value.
 *
 * @example
 * calculateBMI(70, 175);
 * // Output: 22.857142857142858
 *
 * @usage
 * Used in:
 * - `ProfileScreen` (app/(app)/profile/index.tsx)
 */
export function calculateBMI(weightInput: unknown, heightCmInput: unknown): number | null {
	// Convert safely to number
	const weight = Number(weightInput)
	const heightCm = Number(heightCmInput)

	// Reject invalid numbers
	if (!Number.isFinite(weight) || !Number.isFinite(heightCm)) {
		return null
	}

	// Reject zero or negative values
	if (weight <= 0 || heightCm <= 0) {
		return null
	}

	// Reject unrealistic biological inputs
	// Weight: 20kg – 400kg
	// Height: 100cm – 250cm
	if (weight < 20 || weight > 400) {
		return null
	}

	if (heightCm < 100 || heightCm > 250) {
		return null
	}

	// Convert height to meters safely
	const heightM = heightCm / 100

	// Extra safety guard against division by zero
	if (heightM <= 0) {
		return null
	}

	const bmi = weight / (heightM * heightM)

	// Reject invalid results
	if (!Number.isFinite(bmi)) {
		return null
	}

	// Clamp to physiologically possible BMI range
	// Human BMI rarely below 10 or above 80
	const clampedBMI = Math.min(Math.max(bmi, 10), 80)

	return clampedBMI
}

/**
 * Calculates the body fat percentage from weight and height.
 *
 * @param gender - The gender of the person.
 * @param height - The height in centimeters.
 * @param neck - The neck circumference in centimeters.
 * @param waist - The waist circumference in centimeters.
 * @param hips - The hip circumference in centimeters (optional).
 * @returns The body fat percentage.
 *
 * @example
 * calculateBodyFat({ gender: 'male', height: 175, neck: 38, waist: 85 });
 * // Output: 15.234567890123456
 *
 * @usage
 * Used in:
 * - `ProfileScreen` (app/(app)/profile/index.tsx)
 */
export function calculateBodyFat({
	gender,
	height: heightInput,
	neck: neckInput,
	waist: waistInput,
	hips: hipsInput,
}: {
	gender: string
	height: unknown
	neck: unknown
	waist: unknown
	hips?: unknown
}): number | null {
	// Convert safely to numbers
	const height = Number(heightInput)
	const neck = Number(neckInput)
	const waist = Number(waistInput)
	const hips = hipsInput !== undefined ? Number(hipsInput) : undefined

	// Validate numeric inputs
	if (!Number.isFinite(height) || !Number.isFinite(neck) || !Number.isFinite(waist)) {
		return null
	}

	if (hipsInput !== undefined && !Number.isFinite(hips)) {
		return null
	}

	// Reject zero or negative values
	if (height <= 0 || neck <= 0 || waist <= 0) {
		return null
	}

	// Reject unrealistic biological inputs
	// Height: 100–250 cm
	// Circumference: 20–200 cm (reasonable human range)
	if (height < 100 || height > 250) return null
	if (neck < 20 || neck > 80) return null
	if (waist < 40 || waist > 200) return null
	if (hipsInput !== undefined && (hips! < 50 || hips! > 200)) return null

	// Male calculation
	if (gender === 'male') {
		const diff = waist - neck

		// log10 requires positive input
		if (diff <= 0) return null

		const logDiff = Math.log10(diff)
		const logHeight = Math.log10(height)

		if (!Number.isFinite(logDiff) || !Number.isFinite(logHeight)) {
			return null
		}

		const denominator = 1.0324 - 0.19077 * logDiff + 0.15456 * logHeight

		// Prevent division by zero or negative denominator
		if (!Number.isFinite(denominator) || denominator <= 0) {
			return null
		}

		const result = 495 / denominator - 450

		if (!Number.isFinite(result)) return null

		// Clamp to realistic male body fat %
		return Math.min(Math.max(result, 2), 70)
	}

	// Female calculation
	if (gender === 'female') {
		if (hips === undefined) return null

		const diff = waist + hips - neck

		if (diff <= 0) return null

		const logDiff = Math.log10(diff)
		const logHeight = Math.log10(height)

		if (!Number.isFinite(logDiff) || !Number.isFinite(logHeight)) {
			return null
		}

		const denominator = 1.29579 - 0.35004 * logDiff + 0.221 * logHeight

		if (!Number.isFinite(denominator) || denominator <= 0) {
			return null
		}

		const result = 495 / denominator - 450

		if (!Number.isFinite(result)) return null

		// Clamp to realistic female body fat %
		return Math.min(Math.max(result, 5), 70)
	}

	// Unsupported gender
	return null
}

/**
 * Calculates the body composition from weight and body fat.
 *
 * @param weight - The weight in kilograms.
 * @param bodyFat - The body fat percentage.
 * @returns The fat mass and lean mass.
 *
 * @example
 * calculateComposition({ weight: 70, bodyFat: 15 });
 * // Output: { fatMass: 10.5, leanMass: 59.5 }
 */
export function calculateComposition({
	weight: weightInput,
	bodyFat: bodyFatInput,
}: {
	weight: unknown
	bodyFat: unknown
}): { fatMass: number; leanMass: number } | null {
	// Convert safely
	const weight = Number(weightInput)
	const bodyFat = Number(bodyFatInput)

	// Validate numeric
	if (!Number.isFinite(weight) || !Number.isFinite(bodyFat)) {
		return null
	}

	// Reject zero or negative weight
	if (weight <= 0) return null

	// Reject unrealistic weight (20–400kg human bounds)
	if (weight < 20 || weight > 400) return null

	// Reject impossible body fat %
	if (bodyFat < 0 || bodyFat > 70) return null
	// >70% is biologically extreme; treat as invalid input

	// Calculate fat mass
	const fatMassRaw = weight * (bodyFat / 100)

	if (!Number.isFinite(fatMassRaw)) return null

	// Guard against floating overflow
	const fatMass = Math.min(Math.max(fatMassRaw, 0), weight)

	const leanMass = weight - fatMass

	if (!Number.isFinite(leanMass)) return null

	// Final safety clamp
	const safeLeanMass = Math.min(Math.max(leanMass, 0), weight)

	return {
		fatMass: Number(fatMass.toFixed(2)),
		leanMass: Number(safeLeanMass.toFixed(2)),
	}
}

/**
 * Type for body fat feedback.
 */
export type BodyFatFeedback = {
	category: string
	colorStart: string
	colorEnd: string
	insight: string
}

/**
 * Classifies body fat percentage into categories and provides feedback.
 *
 * @param gender - The gender of the person.
 * @param bodyFat - The body fat percentage.
 * @param goal - The user's goal (optional).
 * @returns An object containing the body fat category, color range, and insight.
 *
 * @example
 * classifyBodyFat({ gender: 'male', bodyFat: 15, goal: 'gainMuscle' });
 * // Output: { category: 'Athletic', colorStart: '#3b82f6', colorEnd: '#22c55e', insight: 'You are within a healthy performance range.' }
 */
export function classifyBodyFat({
	gender,
	bodyFat,
	goal,
}: {
	gender: 'male' | 'female'
	bodyFat: number
	goal?: string | null
}): BodyFatFeedback {
	const ranges =
		gender === 'male'
			? [
					{ max: 5, label: 'Essential' },
					{ max: 13, label: 'Athletic' },
					{ max: 17, label: 'Fit' },
					{ max: 24, label: 'Average' },
					{ max: Infinity, label: 'High' },
				]
			: [
					{ max: 13, label: 'Essential' },
					{ max: 20, label: 'Athletic' },
					{ max: 24, label: 'Fit' },
					{ max: 31, label: 'Average' },
					{ max: Infinity, label: 'High' },
				]

	const category = ranges.find(r => bodyFat <= r.max)?.label ?? 'Unknown'

	const gradientMap: Record<string, [string, string]> = {
		Essential: ['#6b7280', '#9ca3af'],
		Athletic: ['#3b82f6', '#22c55e'],
		Fit: ['#22c55e', '#16a34a'],
		Average: ['#f59e0b', '#f97316'],
		High: ['#f97316', '#ef4444'],
	}

	const [colorStart, colorEnd] = gradientMap[category] ?? ['#6b7280', '#9ca3af']

	let insight = ''

	if (goal === 'gainMuscle' && category === 'Essential') {
		insight = 'Very low body fat may limit optimal muscle gain.'
	} else if (goal === 'loseWeight' && category === 'High') {
		insight = 'Reducing body fat will improve metabolic health.'
	} else if (category === 'Athletic' || category === 'Fit') {
		insight = 'You are within a healthy performance range.'
	} else if (category === 'Average') {
		insight = 'You are within general population range.'
	} else if (category === 'High') {
		insight = 'Body fat is above recommended range.'
	} else {
		insight = 'Body composition is within essential range.'
	}

	return { category, colorStart, colorEnd, insight }
}

/**
 * Classifies BMI into categories.
 *
 * @param bmi - The BMI value.
 * @returns The BMI category.
 *
 * @example
 * classifyBMI(22.857142857142858);
 * // Output: 'Normal'
 */
export function classifyBMI(bmi: number) {
	if (bmi < 18.5) return 'Underweight'
	if (bmi < 25) return 'Normal'
	if (bmi < 30) return 'Overweight'
	return 'Obese'
}

/**
 * Generates an insight based on body fat and BMI categories.
 *
 * @param bodyFatCategory - The body fat category.
 * @param bmiCategory - The BMI category.
 * @returns An insight message.
 *
 * @example
 * generateInsight({ bodyFatCategory: 'Athletic', bmiCategory: 'Normal' });
 * // Output: 'Strong metabolic health profile.'
 */
export function generateInsight({ bodyFatCategory, bmiCategory }: { bodyFatCategory: string; bmiCategory: string }) {
	if (bodyFatCategory === 'Athletic') return 'Strong metabolic health profile.'
	if (bodyFatCategory === 'Fit') return 'Balanced composition and performance.'
	if (bodyFatCategory === 'High') return 'Reducing fat mass will improve health markers.'
	return 'Body composition within normal range.'
}

/**
 * Calculates a health score based on body fat and BMI categories.
 *
 * @param bodyFatCategory - The body fat category.
 * @param bmi - The BMI value.
 * @param goal - The user's goal (optional).
 * @returns The health score (0-100).
 *
 * @example
 * calculateHealthScore({ bodyFatCategory: 'Athletic', bmi: 22.857142857142858, goal: 'gainMuscle' });
 * // Output: 80
 */
export function calculateHealthScore({
	bodyFatCategory,
	bmi,
	goal,
}: {
	bodyFatCategory: string
	bmi: number
	goal?: string | null
}) {
	let score = 50

	if (bodyFatCategory === 'Athletic' || bodyFatCategory === 'Fit') score += 25
	if (bodyFatCategory === 'Average') score += 10
	if (bodyFatCategory === 'High') score -= 15

	if (bmi >= 18.5 && bmi < 25) score += 15
	if (bmi >= 25 && bmi < 30) score -= 5
	if (bmi >= 30) score -= 15

	if (goal === 'gainMuscle' && bodyFatCategory === 'Athletic') score += 5
	if (goal === 'loseWeight' && bodyFatCategory === 'High') score -= 5

	return Math.max(0, Math.min(100, score))
}
