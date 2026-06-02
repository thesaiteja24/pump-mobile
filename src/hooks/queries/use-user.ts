import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { queryKeys } from '@/api/query-keys'
import {
  createMeasurementApi,
  deleteMeasurementApi,
  getFitnessProfileApi,
  getMeasurementsApi,
  getNutritionPlanApi,
  getProfileApi,
  getUserAnalyticsApi,
  updateMeasurementApi,
  updateProfileApi,
  upsertFitnessProfileApi,
  upsertNutritionPlanApi,
} from '@/api/user'

import type {
  FitnessProfile,
  MeasurementEntry,
  MeasurementsHistoryResponse,
  NutritionPlan,
  UserAnalytics,
  UserProfile,
} from '@/types/user'
import type { UseQueryResult } from '@tanstack/react-query'

// ─── Query Hooks ──────────────────────────────────────────────────────────────

/**
 * Hook to retrieve the user's profile.
 * Configured as `offlineFirst` so it reads cached data instantly.
 */
export function useProfileQuery(): UseQueryResult<UserProfile, Error> {
  return useQuery<UserProfile>({
    queryKey: queryKeys.user.profile(),
    queryFn: getProfileApi,
    networkMode: 'offlineFirst',
  })
}

/**
 * Hook to retrieve the user's fitness goals and profile.
 */
export function useFitnessProfileQuery(): UseQueryResult<FitnessProfile | null, Error> {
  return useQuery<FitnessProfile | null>({
    queryKey: queryKeys.user.fitness(),
    queryFn: getFitnessProfileApi,
    networkMode: 'offlineFirst',
  })
}

/**
 * Hook to retrieve the user's current nutrition targets.
 */
export function useNutritionPlanQuery(): UseQueryResult<NutritionPlan | null, Error> {
  return useQuery<NutritionPlan | null>({
    queryKey: queryKeys.user.nutrition(),
    queryFn: getNutritionPlanApi,
    networkMode: 'offlineFirst',
  })
}

/**
 * Hook to retrieve body measurements.
 * Automatically handles duration query parameters.
 */
export function useMeasurementsQuery(duration?: 'all' | 'week' | 'month' | 'year'): UseQueryResult<MeasurementsHistoryResponse, Error> {
  return useQuery<MeasurementsHistoryResponse>({
    queryKey: queryKeys.user.measurementList(duration),
    queryFn: () => getMeasurementsApi(duration),
    networkMode: 'offlineFirst',
  })
}

/**
 * Hook to retrieve user workout analytics.
 */
export function useWorkoutAnalyticsQuery(): UseQueryResult<UserAnalytics, Error> {
  return useQuery<UserAnalytics>({
    queryKey: queryKeys.user.analytics(),
    queryFn: getUserAnalyticsApi,
    networkMode: 'offlineFirst',
  })
}

// ─── Mutation Hooks ───────────────────────────────────────────────────────────

/**
 * Hook to update user profile information.
 * Uses optimistic updates to update the cache instantly.
 */
export function useUpdateProfileMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: updateProfileApi,
    onMutate: async (newProfileData) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.user.profile() })

      const previousProfile = queryClient.getQueryData<UserProfile>(queryKeys.user.profile())

      if (previousProfile) {
        queryClient.setQueryData<UserProfile>(queryKeys.user.profile(), {
          ...previousProfile,
          ...newProfileData,
        })
      }

      return { previousProfile }
    },
    onError: (err, _newProfileData, context) => {
      console.error('[Update Profile Mutation] Error:', err)
      if (context?.previousProfile) {
        queryClient.setQueryData(queryKeys.user.profile(), context.previousProfile)
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.user.profile() })
    },
  })
}

/**
 * Hook to upsert the user's fitness profile.
 */
export function useUpsertFitnessProfileMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: upsertFitnessProfileApi,
    onMutate: async (newFitnessData) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.user.fitness() })

      const previousFitness = queryClient.getQueryData<FitnessProfile>(queryKeys.user.fitness())

      if (previousFitness) {
        queryClient.setQueryData<FitnessProfile>(queryKeys.user.fitness(), {
          ...previousFitness,
          ...newFitnessData,
        })
      }

      return { previousFitness }
    },
    onError: (err, _newFitnessData, context) => {
      console.error('[Upsert Fitness Mutation] Error:', err)
      if (context?.previousFitness) {
        queryClient.setQueryData(queryKeys.user.fitness(), context.previousFitness)
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.user.fitness() })
      // Since fitness profile updates can modify targets, invalidate profile/nutrition plan too
      queryClient.invalidateQueries({ queryKey: queryKeys.user.profile() })
      queryClient.invalidateQueries({ queryKey: queryKeys.user.nutrition() })
    },
  })
}

/**
 * Hook to upsert the user's nutrition plan.
 */
export function useUpsertNutritionPlanMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: upsertNutritionPlanApi,
    onMutate: async (newNutritionData) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.user.nutrition() })

      const previousNutrition = queryClient.getQueryData<NutritionPlan>(queryKeys.user.nutrition())

      if (previousNutrition) {
        queryClient.setQueryData<NutritionPlan>(queryKeys.user.nutrition(), {
          ...previousNutrition,
          ...newNutritionData,
        })
      }

      return { previousNutrition }
    },
    onError: (err, _newNutritionData, context) => {
      console.error('[Upsert Nutrition Mutation] Error:', err)
      if (context?.previousNutrition) {
        queryClient.setQueryData(queryKeys.user.nutrition(), context.previousNutrition)
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.user.nutrition() })
    },
  })
}

/**
 * Hook to log a new daily body measurement entry.
 */
export function useCreateMeasurementMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createMeasurementApi,
    onSettled: () => {
      // Invalidate all measurements queries (regardless of duration filters)
      queryClient.invalidateQueries({ queryKey: queryKeys.user.measurements() })
    },
  })
}

/**
 * Hook to update an existing daily body measurement entry.
 */
export function useUpdateMeasurementMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string, data: Partial<Omit<MeasurementEntry, 'id' | 'createdAt' | 'updatedAt'>> }) =>
      updateMeasurementApi(id, data),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.user.measurements() })
    },
  })
}

/**
 * Hook to delete a body measurement entry.
 */
export function useDeleteMeasurementMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deleteMeasurementApi,
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.user.measurements() })
    },
  })
}
