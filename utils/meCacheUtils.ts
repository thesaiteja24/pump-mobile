import { queryKeys } from '@/lib/queryKeys'
import { LatestMeasurements, Measurements, MeasurementsQueryData, User } from '@/types/user'
import { QueryClient, QueryKey } from '@tanstack/react-query'

/**
 * Standard utility to rollback queries on error
 */
export function rollbackQueries(qc: QueryClient, previousData: [QueryKey, unknown][]) {
	previousData.forEach(([key, oldData]) => {
		qc.setQueryData(key, oldData)
	})
}

/**
 * Update the user's core profile cache optimistically
 */
export function updateMyProfileCache(qc: QueryClient, updater: (old: User | undefined) => Partial<User>) {
	qc.setQueryData(queryKeys.me.profile, (old: User | undefined) => {
		if (!old) return old
		return { ...old, ...updater(old) }
	})
}

/**
 * Update the fitness profile cache optimistically
 */
export function updateMyFitnessProfileCache(qc: QueryClient, updater: (old: any) => any) {
	qc.setQueryData(queryKeys.me.fitnessProfile, (old: any) => {
		if (!old) return old
		return { ...old, ...updater(old) }
	})
}

/**
 * Update the nutrition plan cache optimistically
 */
export function updateMyNutritionPlanCache(qc: QueryClient, updater: (old: any) => any) {
	qc.setQueryData(queryKeys.me.nutritionPlan, (old: any) => {
		if (!old) return old
		return { ...old, ...updater(old) }
	})
}

/**
 * Adds a new measurement to the history and re-calculates daily weight change and latest values
 */
export function addMeasurementToCache(qc: QueryClient, measurementData: Measurements) {
	qc.setQueriesData<MeasurementsQueryData>({ queryKey: queryKeys.me.measurementsRoot }, old => {
		if (!old) return old

		const normalize = (d: string) => {
			if (!d) return ''
			const parsed = new Date(d)
			return isNaN(parsed.getTime()) ? d : parsed.toISOString().split('T')[0]
		}
		const normalizedDataDate = normalize(measurementData.date)

		const updatedHistory = [...(old?.history || [])]
		const existingIndex = updatedHistory.findIndex(m => normalize(m.date) === normalizedDataDate)

		if (existingIndex !== -1) {
			updatedHistory[existingIndex] = { ...updatedHistory[existingIndex], ...measurementData }
		} else {
			updatedHistory.push(measurementData)
		}

		// Sort by date descending
		updatedHistory.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

		// Re-calculate latestValues
		const latestMeasurements: Partial<LatestMeasurements> = {}
		for (const entry of updatedHistory) {
			Object.entries(entry).forEach(([key, value]) => {
				if (
					key !== 'progressPicUrls' &&
					key !== 'id' &&
					key !== 'date' &&
					value !== null &&
					value !== undefined &&
					latestMeasurements[key as keyof LatestMeasurements] === undefined
				) {
					latestMeasurements[key as keyof LatestMeasurements] = value as any
				}
			})
		}

		// Re-calculate dailyWeightChange
		let dailyWeightChange = old?.dailyWeightChange || null
		const weightEntries = updatedHistory.filter(m => m.weight !== null && m.weight !== undefined)
		if (weightEntries.length >= 2) {
			const latestWeight = Number(weightEntries[0].weight)
			const previousWeight = Number(weightEntries[1].weight)
			dailyWeightChange = {
				diff: Math.abs(latestWeight - previousWeight),
				isPositive: latestWeight > previousWeight,
			}
		}

		return {
			history: updatedHistory,
			latestValues: latestMeasurements,
			dailyWeightChange,
		}
	})
}
