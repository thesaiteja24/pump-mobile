import { queryKeys } from '@/lib/queryKeys'
import {
	addMeasurementsService,
	deleteMyProfilePicService,
	getFitnessProfileService,
	getMeasurementsService,
	getMeService,
	getNutritionPlanService,
	getTrainingAnalyticsService,
	getUserAnalyticsService,
	updateFitnessProfileService,
	updateMeService,
	updateMyProfilePicService,
	updateNutritionPlanService,
} from '@/services/meService'
import { useAuth } from '@/stores/authStore'
import type { AnalyticsMetrics, MeasurementsQueryData, MeasurementType, TrainingAnalytics } from '@/types/analytics'
import { UpdateUserBody, User } from '@/types/user'
import {
	addMeasurementToCache,
	rollbackQueries,
	updateMyFitnessProfileCache,
	updateMyNutritionPlanCache,
	updateMyProfileCache,
} from '@/utils/meCacheUtils'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

export function useMyProfileQuery() {
	return useQuery({
		queryKey: queryKeys.me.profile,
		queryFn: async () => {
			const res = await getMeService()
			return res.data as User
		},
		staleTime: 5 * 60 * 1000,
	})
}

export function useMyMeasurementsQuery(duration?: string) {
	return useQuery({
		queryKey: queryKeys.me.measurements(duration),
		queryFn: async () => {
			const res = await getMeasurementsService(duration)
			if (!res.success) throw new Error(res.message || 'Failed to fetch measurements')

			const { history = [], latestValues = {}, dailyWeightChange = null } = res.data ?? {}
			return { history, latestValues, dailyWeightChange } as MeasurementsQueryData
		},
		staleTime: 24 * 60 * 60 * 1000,
		gcTime: 24 * 60 * 60 * 1000,
	})
}

export function useMyFitnessProfileQuery() {
	return useQuery({
		queryKey: queryKeys.me.fitnessProfile,
		queryFn: async () => {
			const res = await getFitnessProfileService()
			if (!res.success) throw new Error(res.message || 'Failed to fetch fitness profile')
			return res.data ?? null
		},
		staleTime: 24 * 60 * 60 * 1000,
		gcTime: 24 * 60 * 60 * 1000,
	})
}

export function useMyNutritionPlanQuery() {
	return useQuery({
		queryKey: queryKeys.me.nutritionPlan,
		queryFn: async () => {
			const res = await getNutritionPlanService()
			if (!res.success) throw new Error(res.message || 'Failed to fetch nutrition plan')
			return res.data ?? null
		},
		staleTime: 24 * 60 * 60 * 1000,
		gcTime: 24 * 60 * 60 * 1000,
	})
}

export function useMyUserAnalyticsQuery() {
	return useQuery({
		queryKey: queryKeys.me.userAnalytics,
		queryFn: async () => {
			const res = await getUserAnalyticsService()
			if (!res.success) throw new Error(res.message || 'Failed to fetch analytics')
			return (res.data || {}) as AnalyticsMetrics
		},
		staleTime: 24 * 60 * 60 * 1000,
	})
}

export function useMyTrainingAnalyticsQuery(duration: string = '3m') {
	return useQuery({
		queryKey: queryKeys.me.trainingAnalytics(duration),
		queryFn: async () => {
			const res = await getTrainingAnalyticsService(duration)
			if (!res.success) throw new Error(res.message || 'Failed to fetch training analytics')
			return res.data as TrainingAnalytics
		},
		staleTime: 24 * 60 * 60 * 1000,
		gcTime: 24 * 60 * 60 * 1000,
	})
}

// MUTATIONS

export function useUpdateMyProfileMutation() {
	const qc = useQueryClient()

	return useMutation({
		mutationFn: (data: UpdateUserBody) => updateMeService(data),

		onMutate: async data => {
			await qc.cancelQueries({ queryKey: queryKeys.me.profile })

			const previousData = qc.getQueriesData({ queryKey: queryKeys.me.profile })

			updateMyProfileCache(qc, () => ({
				...data,
				updatedAt: new Date().toISOString(),
			}))

			return { previousData }
		},

		onError: (_err, _data, context) => {
			rollbackQueries(qc, context?.previousData || [])
		},

		onSettled: () => {
			qc.invalidateQueries({ queryKey: queryKeys.me.profile })
		},
	})
}

export function useUpdateMyProfilePicMutation() {
	const qc = useQueryClient()

	return useMutation({
		mutationFn: (data: FormData) => updateMyProfilePicService(data),

		onSuccess: res => {
			if (res.success) {
				qc.setQueryData(queryKeys.me.profile, res.data)
				qc.invalidateQueries({ queryKey: queryKeys.me.profile })
			}
		},
	})
}

export function useDeleteMyProfilePicMutation() {
	const qc = useQueryClient()

	return useMutation({
		mutationFn: () => deleteMyProfilePicService(),

		onSuccess: res => {
			if (res.success) {
				qc.setQueryData(queryKeys.me.profile, res.data)
				qc.invalidateQueries({ queryKey: queryKeys.me.profile })
			}
		},
	})
}

export function useUpdateMyFitnessProfileMutation() {
	const qc = useQueryClient()

	return useMutation({
		mutationFn: async (data: any) => {
			const res = await updateFitnessProfileService(data)
			if (!res.success) throw new Error(res.message || 'Failed to update fitness profile')
			return res.data
		},
		onMutate: async (newData: any) => {
			await qc.cancelQueries({ queryKey: queryKeys.me.fitnessProfile })
			const previousData = qc.getQueriesData({ queryKey: queryKeys.me.fitnessProfile })

			updateMyFitnessProfileCache(qc, () => newData)

			return { previousData }
		},
		onError: (err, newData, context) => {
			rollbackQueries(qc, context?.previousData || [])
		},
		onSettled: () => {
			qc.invalidateQueries({ queryKey: queryKeys.me.fitnessProfile })
		},
	})
}

export function useUpdateMyNutritionPlanMutation() {
	const qc = useQueryClient()

	return useMutation({
		mutationFn: async (data: any) => {
			const res = await updateNutritionPlanService(data)
			if (!res.success) throw new Error(res.message || 'Failed to update nutrition plan')
			return res.data
		},
		onMutate: async (newData: any) => {
			await qc.cancelQueries({ queryKey: queryKeys.me.nutritionPlan })
			const previousData = qc.getQueriesData({ queryKey: queryKeys.me.nutritionPlan })

			updateMyNutritionPlanCache(qc, () => newData)

			return { previousData }
		},
		onError: (err, newData, context) => {
			rollbackQueries(qc, context?.previousData || [])
		},
		onSettled: () => {
			qc.invalidateQueries({ queryKey: queryKeys.me.nutritionPlan })
		},
	})
}

export function useAddMyMeasurementMutation() {
	const qc = useQueryClient()
	const userId = useAuth(s => s.userId)

	return useMutation({
		mutationFn: async (data: MeasurementType & { progressPics?: any[] }) => {
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

			const res = await addMeasurementsService(payload)
			if (!res.success) throw new Error(res.message || 'Failed to add measurement')
			return res.data
		},
		onMutate: async (data: MeasurementType & { progressPics?: any[] }) => {
			await qc.cancelQueries({ queryKey: queryKeys.me.measurementsRoot })
			await qc.cancelQueries({ queryKey: queryKeys.habits.logs(userId!) })

			const previousMeasurements = qc.getQueriesData({ queryKey: queryKeys.me.measurementsRoot })

			// Prepare measurement data for optimistic UI
			const { progressPics, ...measurementData } = data
			if (progressPics && Array.isArray(progressPics)) {
				measurementData.progressPicUrls = progressPics.map(p => p.uri)
			}

			addMeasurementToCache(qc, measurementData)

			// Optimistically update Profile cache weight
			if (measurementData.weight != null) {
				updateMyProfileCache(qc, () => ({ weight: measurementData.weight }))
			}

			// Invalidate habit logs if internal metrics are updated
			if (measurementData.weight != null || measurementData.bodyFat != null || measurementData.waist != null) {
				qc.invalidateQueries({ queryKey: ['habits', 'logs', userId] })
			}

			return { previousMeasurements }
		},
		onError: (err, newData, context) => {
			rollbackQueries(qc, context?.previousMeasurements || [])
		},
		onSettled: () => {
			qc.invalidateQueries({ queryKey: queryKeys.me.measurementsRoot })
			qc.invalidateQueries({ queryKey: queryKeys.me.userAnalytics })
		},
	})
}
