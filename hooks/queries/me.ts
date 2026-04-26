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
} from '@/services/me.service'
import { useAuth } from '@/stores/auth.store'
import {
  Measurements,
  UpdateFitnessProfileBody,
  UpdateNutritionPlanBody,
  UpdateUserBody,
} from '@/types/me'
import {
  addMeasurementToCache,
  rollbackQueries,
  updateMyFitnessProfileCache,
  updateMyNutritionPlanCache,
  updateMyProfileCache,
} from '@/utils/queries/meCacheUtils'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

export function useProfileQuery() {
  return useQuery({
    queryKey: queryKeys.me.profile,
    queryFn: () => getMeService(),
    staleTime: 5 * 60 * 1000,
  })
}

export function useMeasurementsQuery(duration?: string) {
  return useQuery({
    queryKey: queryKeys.me.measurements(duration),
    queryFn: () => getMeasurementsService(duration),
    staleTime: 24 * 60 * 60 * 1000,
    gcTime: 24 * 60 * 60 * 1000,
  })
}

export function useFitnessProfileQuery() {
  return useQuery({
    queryKey: queryKeys.me.fitnessProfile,
    queryFn: () => getFitnessProfileService(),
    staleTime: 24 * 60 * 60 * 1000,
    gcTime: 24 * 60 * 60 * 1000,
  })
}

export function useNutritionPlanQuery() {
  return useQuery({
    queryKey: queryKeys.me.nutritionPlan,
    queryFn: () => getNutritionPlanService(),
    staleTime: 24 * 60 * 60 * 1000,
    gcTime: 24 * 60 * 60 * 1000,
  })
}

export function useUserAnalyticsQuery() {
  return useQuery({
    queryKey: queryKeys.me.userAnalytics,
    queryFn: () => getUserAnalyticsService(),
    staleTime: 24 * 60 * 60 * 1000,
  })
}

export function useTrainingAnalyticsQuery(duration: string = '3m') {
  return useQuery({
    queryKey: queryKeys.me.trainingAnalytics(duration),
    queryFn: () => getTrainingAnalyticsService(duration),
    staleTime: 24 * 60 * 60 * 1000,
    gcTime: 24 * 60 * 60 * 1000,
  })
}

// MUTATIONS

export function useUpdateProfileMutation() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: (data: UpdateUserBody) => updateMeService(data),

    onMutate: async (data) => {
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

export function useUpdateProfilePicMutation() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: (data: FormData) => updateMyProfilePicService(data),

    onSuccess: (data) => {
      qc.setQueryData(queryKeys.me.profile, data)
      qc.invalidateQueries({ queryKey: queryKeys.me.profile })
    },
  })
}

export function useDeleteProfilePicMutation() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: () => deleteMyProfilePicService(),

    onSuccess: (data) => {
      qc.setQueryData(queryKeys.me.profile, data)
      qc.invalidateQueries({ queryKey: queryKeys.me.profile })
    },
  })
}

export function useUpdateFitnessProfileMutation() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async (data: UpdateFitnessProfileBody) => {
      return updateFitnessProfileService(data)
    },
    onMutate: async (newData: UpdateFitnessProfileBody) => {
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

export function useUpdateNutritionPlanMutation() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async (data: UpdateNutritionPlanBody) => {
      return updateNutritionPlanService(data)
    },
    onMutate: async (newData: UpdateNutritionPlanBody) => {
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

export function useAddMeasurementMutation() {
  const qc = useQueryClient()
  const userId = useAuth((s) => s.userId)

  return useMutation({
    mutationFn: async (
      data: Partial<Measurements> & {
        progressPics?: { uri: string; name?: string; type?: string }[]
      },
    ) => {
      let payload: FormData | Partial<Measurements> = data
      if (data.progressPics && data.progressPics.length > 0) {
        const formData = new FormData()
        Object.entries(data).forEach(([key, value]) => {
          if (key !== 'progressPics' && value !== null && value !== undefined) {
            formData.append(key, value.toString())
          }
        })
        data.progressPics.forEach((pic) => {
          formData.append('progressPics', pic as unknown as Blob)
        })
        payload = formData
      }

      return addMeasurementsService(payload)
    },
    onMutate: async (data: Partial<Measurements> & { progressPics?: { uri: string }[] }) => {
      await qc.cancelQueries({ queryKey: queryKeys.me.measurementsRoot })
      // Avoid cross-domain coupling by extracting invalidation to a cleaner approach or keeping it localized
      await qc.cancelQueries({ queryKey: queryKeys.habits.logs(userId!) })

      const previousMeasurements = qc.getQueriesData({ queryKey: queryKeys.me.measurementsRoot })

      // Prepare measurement data for optimistic UI
      const { progressPics, ...measurementData } = data
      if (progressPics && Array.isArray(progressPics)) {
        measurementData.progressPicUrls = progressPics.map((p) => p.uri)
      }

      addMeasurementToCache(qc, measurementData as Measurements)

      // Optimistically update Profile cache weight
      if (measurementData.weight != null) {
        updateMyProfileCache(qc, () => ({ weight: measurementData.weight }))
      }

      // Invalidate habit logs if internal metrics are updated
      if (
        measurementData.weight != null ||
        measurementData.bodyFat != null ||
        measurementData.waist != null
      ) {
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
