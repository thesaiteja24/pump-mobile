import { queryClient } from '@/lib/queryClient'
import { queryKeys } from '@/lib/queryKeys'
import {
	addMeasurementsService,
	getFitnessProfileService,
	getMeasurementsService,
	getNutritionPlanService,
	getUserAnalyticsService,
	updateFitnessProfileService,
	updateNutritionPlanService,
} from '@/services/analyticsService'
import { useAuth } from '@/stores/authStore'
import type {
	AnalyticsMetrics,
	LatestMeasurements,
	MeasurementType,
	MeasurementsQueryData,
} from '@/types/analytics'
import { useMutation, useQuery } from '@tanstack/react-query'
import { invalidateHabitLogsCache } from './useHabits'

// ─────────────────────────────────────────────────────────────────────────────
// READ — measurements (history + latest values + daily weight change)
//
// Strategy: TQ fetches and caches. On success it syncs into Zustand so that
// `addMeasurement` optimistic writes merge correctly with the persisted list.
// ─────────────────────────────────────────────────────────────────────────────
export function useMeasurementsQuery() {
	const userId = useAuth(s => s.user?.userId)

	return useQuery({
		queryKey: queryKeys.analytics.measurements(userId ?? ''),
		queryFn: async () => {
			if (!userId) throw new Error('Not authenticated')
			const res = await getMeasurementsService(userId)
			if (!res.success) throw new Error(res.message || 'Failed to fetch measurements')

			const { history = [], latestValues = {}, dailyWeightChange = null } = res.data ?? {}
			return { history, latestValues, dailyWeightChange } as MeasurementsQueryData
		},
		enabled: !!userId,
		staleTime: 24 * 60 * 60 * 1000,
	})
}

// ─────────────────────────────────────────────────────────────────────────────
// READ — fitness profile
// ─────────────────────────────────────────────────────────────────────────────
export function useFitnessProfileQuery() {
	const userId = useAuth(s => s.user?.userId)

	return useQuery({
		queryKey: queryKeys.analytics.fitnessProfile(userId ?? ''),
		queryFn: async () => {
			if (!userId) throw new Error('Not authenticated')
			const res = await getFitnessProfileService(userId)
			if (!res.success) throw new Error(res.message || 'Failed to fetch fitness profile')
			return res.data ?? null
		},
		enabled: !!userId,
		staleTime: 24 * 60 * 60 * 1000,
	})
}

// ─────────────────────────────────────────────────────────────────────────────
// READ — nutrition plan
// ─────────────────────────────────────────────────────────────────────────────
export function useNutritionPlanQuery() {
	const userId = useAuth(s => s.user?.userId)

	return useQuery({
		queryKey: queryKeys.analytics.nutritionPlan(userId ?? ''),
		queryFn: async () => {
			if (!userId) throw new Error('Not authenticated')
			const res = await getNutritionPlanService(userId)
			if (!res.success) throw new Error(res.message || 'Failed to fetch nutrition plan')
			return res.data ?? null
		},
		enabled: !!userId,
		staleTime: 24 * 60 * 60 * 1000,
	})
}

// ─────────────────────────────────────────────────────────────────────────────
// READ — user analytics (streak, workoutsThisWeek, weeklyVolume, etc.)
// ─────────────────────────────────────────────────────────────────────────────
export function useUserAnalyticsQuery() {
	const userId = useAuth(s => s.user?.userId)

	return useQuery({
		queryKey: queryKeys.analytics.userAnalytics(userId ?? ''),
		queryFn: async () => {
			if (!userId) throw new Error('Not authenticated')
			const res = await getUserAnalyticsService(userId)
			if (!res.success) throw new Error(res.message || 'Failed to fetch analytics')

			const data = res.data || {}
			// workoutDates comes as an array from the API — convert to Set for consumers
			data.workoutDates = new Set(Array.isArray(data.workoutDates) ? data.workoutDates : [])
			return data as AnalyticsMetrics
		},
		enabled: !!userId,
		staleTime: 24 * 60 * 60 * 1000,
	})
}

// ─────────────────────────────────────────────────────────────────────────────
// Mutations
// ─────────────────────────────────────────────────────────────────────────────

export function useUpdateFitnessProfile() {
	const userId = useAuth(s => s.user?.userId)

	return useMutation({
		mutationFn: async (data: any) => {
			const res = await updateFitnessProfileService(userId!, data)
			if (!res.success) throw new Error(res.message || 'Failed to update fitness profile')
			return res.data
		},
		onMutate: async (newData: any) => {
			await queryClient.cancelQueries({ queryKey: queryKeys.analytics.fitnessProfile(userId!) })
			const previousProfile = queryClient.getQueryData(queryKeys.analytics.fitnessProfile(userId!))
			queryClient.setQueryData(queryKeys.analytics.fitnessProfile(userId!), (old: any) => ({
				...old,
				...newData,
			}))
			return { previousProfile }
		},
		onError: (err, newData, context) => {
			queryClient.setQueryData(queryKeys.analytics.fitnessProfile(userId!), context?.previousProfile)
		},
		onSettled: () => {
			queryClient.invalidateQueries({ queryKey: queryKeys.analytics.fitnessProfile(userId!) })
		},
	})
}

export function useUpdateNutritionPlan() {
	const userId = useAuth(s => s.user?.userId)

	return useMutation({
		mutationFn: async (data: any) => {
			const res = await updateNutritionPlanService(userId!, data)
			if (!res.success) throw new Error(res.message || 'Failed to update nutrition plan')
			return res.data
		},
		onMutate: async (newData: any) => {
			await queryClient.cancelQueries({ queryKey: queryKeys.analytics.nutritionPlan(userId!) })
			const previousPlan = queryClient.getQueryData(queryKeys.analytics.nutritionPlan(userId!))
			queryClient.setQueryData(queryKeys.analytics.nutritionPlan(userId!), (old: any) => ({
				...old,
				...newData,
			}))
			return { previousPlan }
		},
		onError: (err, newData, context) => {
			queryClient.setQueryData(queryKeys.analytics.nutritionPlan(userId!), context?.previousPlan)
		},
		onSettled: () => {
			queryClient.invalidateQueries({ queryKey: queryKeys.analytics.nutritionPlan(userId!) })
		},
	})
}

export function useAddMeasurement() {
	const userId = useAuth(s => s.user?.userId)
	const setUser = useAuth(s => s.setUser)

	return useMutation({
		mutationFn: async (data: MeasurementType & { progressPics?: any[] }) => {
			// Handle progressPics if present (create FormData)
			let payload: any = data
			if (data.progressPics && data.progressPics.length > 0) {
				const formData = new FormData()
				Object.entries(data).forEach(([key, value]) => {
					if (key !== 'progressPics' && value !== null && value !== undefined) {
						formData.append(key, value.toString())
					}
				})
				data.progressPics.forEach(pic => {
					formData.append('progressPics', pic as any)
				})
				payload = formData
			}

			const res = await addMeasurementsService(userId!, payload)
			if (!res.success) throw new Error(res.message || 'Failed to add measurement')
			return res.data
		},
		onMutate: async (data: MeasurementType & { progressPics?: any[] }) => {
			await queryClient.cancelQueries({ queryKey: queryKeys.analytics.measurements(userId!) })
			await queryClient.cancelQueries({ queryKey: queryKeys.habits.logs(userId!) })

			const previousMeasurements = queryClient.getQueryData<MeasurementsQueryData>(
				queryKeys.analytics.measurements(userId!)
			)

			// Prepare measurement data for optimistic UI
			const { progressPics, ...measurementData } = data
			if (progressPics && Array.isArray(progressPics)) {
				measurementData.progressPicUrls = progressPics.map(p => p.uri)
			}

			queryClient.setQueryData<MeasurementsQueryData>(queryKeys.analytics.measurements(userId!), old => {
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

			// Optimistically update authStore user weight
			if (measurementData.weight != null) {
				setUser({ weight: measurementData.weight })
			}

			// Invalidate habit logs if internal metrics are updated
			if (measurementData.weight != null || measurementData.bodyFat != null || measurementData.waist != null) {
				invalidateHabitLogsCache(userId!)
			}

			return { previousMeasurements }
		},
		onError: (err, newData, context) => {
			queryClient.setQueryData(queryKeys.analytics.measurements(userId!), context?.previousMeasurements)
		},
		onSettled: () => {
			queryClient.invalidateQueries({ queryKey: queryKeys.analytics.measurements(userId!) })
			queryClient.invalidateQueries({ queryKey: queryKeys.analytics.userAnalytics(userId!) })
		},
	})
}
