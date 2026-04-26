import { queryKeys } from '@/lib/queryKeys'
import {
  createExerciseService,
  deleteExerciseService,
  getAllExercisesService,
  getExerciseByIdService,
  updateExerciseService,
} from '@/services/exercises.service'
import type { Exercise, ExerciseType } from '@/types/exercises'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

/**
 * useExercises / useExerciseById
 * Standardized hooks with optimistic updates for administrative actions.
 */

// ─────────────────────────────────────────────────────────────────
// READ
// ─────────────────────────────────────────────────────────────────

export function useExercises() {
  return useQuery<Exercise[]>({
    queryKey: queryKeys.exercises.all,
    queryFn: getAllExercisesService,
    staleTime: Infinity,
  })
}

export function useExerciseById(id: string | undefined) {
  return useQuery<Exercise | null>({
    queryKey: queryKeys.exercises.byId(id!),
    queryFn: () => getExerciseByIdService(id!),
    enabled: !!id,
    staleTime: Infinity,
  })
}

// MUTATIONS

export function useCreateExercise() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: FormData) => createExerciseService(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.exercises.all })
    },
  })
}

export function useUpdateExercise() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: FormData }) => updateExerciseService(id, data),

    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.exercises.root })

      const previousAll = queryClient.getQueryData<Exercise[]>(queryKeys.exercises.all)
      const previousDetail = queryClient.getQueryData<Exercise>(queryKeys.exercises.byId(id))

      // Optimistic update
      if (previousAll) {
        const title = data.get('title') as string | null
        const instructions = data.get('instructions') as string | null
        const exerciseType = data.get('exerciseType') as ExerciseType | null

        queryClient.setQueryData<Exercise[]>(queryKeys.exercises.all, (old) =>
          old?.map((ex) =>
            ex.id === id
              ? {
                  ...ex,
                  ...(title && { title }),
                  ...(instructions && { instructions }),
                  ...(exerciseType && { exerciseType }),
                }
              : ex,
          ),
        )
      }

      // Also update detail cache if it exists
      if (previousDetail) {
        const title = data.get('title') as string | null
        const instructions = data.get('instructions') as string | null
        const exerciseType = data.get('exerciseType') as ExerciseType | null

        queryClient.setQueryData<Exercise>(queryKeys.exercises.byId(id), (old) =>
          old
            ? {
                ...old,
                ...(title && { title }),
                ...(instructions && { instructions }),
                ...(exerciseType && { exerciseType }),
              }
            : old,
        )
      }

      return { previousAll, previousDetail }
    },

    onError: (_err, variables, context) => {
      if (context?.previousAll) {
        queryClient.setQueryData(queryKeys.exercises.all, context.previousAll)
      }
      if (context?.previousDetail) {
        queryClient.setQueryData(queryKeys.exercises.byId(variables.id), context.previousDetail)
      }
    },

    onSettled: (_data, _err, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.exercises.all })
      queryClient.invalidateQueries({ queryKey: queryKeys.exercises.byId(variables.id) })
    },
  })
}

export function useDeleteExercise() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteExerciseService(id),

    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.exercises.root })
      const previousAll = queryClient.getQueryData<Exercise[]>(queryKeys.exercises.all)

      if (previousAll) {
        queryClient.setQueryData<Exercise[]>(queryKeys.exercises.all, (old) =>
          old?.filter((ex) => ex.id !== id),
        )
      }

      return { previousAll }
    },

    onError: (_err, _id, context) => {
      if (context?.previousAll) {
        queryClient.setQueryData(queryKeys.exercises.all, context.previousAll)
      }
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.exercises.all })
    },
  })
}
