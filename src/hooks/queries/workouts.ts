import { queryClient } from '@/lib/queryClient'
import { queryKeys } from '@/lib/queryKeys'
import {
  createWorkoutService,
  deleteWorkoutService,
  getDiscoverWorkoutsService,
  getUserWorkoutsService,
  getWorkoutByIdService,
  updateWorkoutService,
} from '@/services/workouts.service'
import { useAuth } from '@/stores/auth.store'
import { WorkoutPayload } from '@/types/payloads'
import {
  WorkoutHistoryInfiniteData,
  WorkoutHistoryItem,
  WorkoutLog,
} from '@/types/workouts'
import { serializeWorkoutForApi } from '@/utils/serializeForApi'
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

const PAGE_LIMIT = 2

// ─────────────────────────────────────────────────────
// READ — workout history (paginated, infinite scroll)
// ─────────────────────────────────────────────────────
export function useUserWorkoutHistoryQuery() {
  const query = useInfiniteQuery({
    queryKey: queryKeys.workouts.all,
    queryFn: async ({ pageParam = 1 }) => {
      const data = await getUserWorkoutsService(pageParam as number, PAGE_LIMIT)
      const workouts = data.workouts || []
      return { workouts, meta: data.meta }
    },
    getNextPageParam: (lastPage) => {
      if (!lastPage.meta?.hasMore) return undefined
      return (lastPage.meta.currentPage ?? 1) + 1
    },
    initialPageParam: 1,
    staleTime: Infinity,
  })

  const workoutHistory: WorkoutHistoryItem[] = (query.data?.pages ?? []).flatMap((p) => p.workouts)
  const hasMore = query.data?.pages?.at(-1)?.meta?.hasMore ?? false

  return {
    ...query,
    workoutHistory,
    hasMore,
  }
}

// ─────────────────────────────────────────────────────
// READ — discover workouts (paginated)
// ─────────────────────────────────────────────────────
export function useDiscoverWorkoutsQuery() {
  const query = useInfiniteQuery({
    queryKey: queryKeys.workouts.discover,
    queryFn: async ({ pageParam = 1 }) => {
      const data = await getDiscoverWorkoutsService(pageParam as number, PAGE_LIMIT)
      return {
        workouts: data.workouts || [],
        meta: data.meta,
      }
    },
    getNextPageParam: (lastPage) => {
      if (!lastPage.meta?.hasMore) return undefined
      return (lastPage.meta.currentPage ?? 1) + 1
    },
    initialPageParam: 1,
    staleTime: 2 * 60 * 1000,
  })

  const discoverWorkouts: WorkoutHistoryItem[] = (query.data?.pages ?? []).flatMap(
    (p) => p.workouts,
  )
  const hasMore = query.data?.pages?.at(-1)?.meta?.hasMore ?? false

  return {
    ...query,
    discoverWorkouts,
    hasMore,
  }
}

export function useWorkoutByIdQuery(id: string, options?: { enabled?: boolean }) {
  const query = useQuery({
    queryKey: queryKeys.workouts.byId(id),
    queryFn: async () => {
      return getWorkoutByIdService(id)
    },
    staleTime: Infinity,
    ...options,
  })

  return query
}

// ─────────────────────────────────────────────────────
// MUTATION — save (create) workout
// ─────────────────────────────────────────────────────
export function useSaveWorkoutMutation() {
  const userId = useAuth((s) => s.userId)
  const qc = useQueryClient()

  return useMutation({
    mutationFn: (prepared: WorkoutLog) => {
      return createWorkoutService(serializeWorkoutForApi(prepared))
    },
    onSuccess: () => {
      // Invalidate user history so it refetches
      qc.invalidateQueries({ queryKey: queryKeys.workouts.all })

      if (userId) {
        // Invalidate habit logs (frequency habits depend on workouts)
        qc.invalidateQueries({ queryKey: queryKeys.habits.logs(userId) })
        // Invalidate program progress
        qc.invalidateQueries({ queryKey: queryKeys.programs.user.active(userId) })
        qc.invalidateQueries({ queryKey: queryKeys.programs.user.all(userId) })
        qc.invalidateQueries({ queryKey: ['userPrograms', 'detail', userId] })
        // Invalidate analytics
        qc.invalidateQueries({ queryKey: queryKeys.me.userAnalytics })
        qc.invalidateQueries({ queryKey: ['trainingAnalytics', userId] })
      }
    },
  })
}

// ─────────────────────────────────────────────────────
// MUTATION — update (edit) existing workout
// ─────────────────────────────────────────────────────
export function useUpdateWorkoutMutation() {
  const userId = useAuth((s) => s.userId)
  const qc = useQueryClient()

  return useMutation({
    mutationFn: ({ id, prepared }: { id: string; prepared: WorkoutLog }) => {
      const payload = serializeWorkoutForApi(prepared)
      return updateWorkoutService(id, payload)
    },
    onSuccess: (_res, { id }) => {
      qc.invalidateQueries({ queryKey: queryKeys.workouts.byId(id) })
      qc.invalidateQueries({ queryKey: queryKeys.workouts.all })
      if (userId) {
        qc.invalidateQueries({ queryKey: queryKeys.habits.logs(userId) })
        qc.invalidateQueries({ queryKey: queryKeys.me.userAnalytics })
        qc.invalidateQueries({ queryKey: ['trainingAnalytics', userId] })
      }
    },
  })
}

export function useUpdateWorkoutPayloadMutation() {
  const userId = useAuth((s) => s.userId)
  const qc = useQueryClient()

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: WorkoutPayload }) => {
      return updateWorkoutService(id, payload)
    },
    onSuccess: (_res, { id }) => {
      qc.invalidateQueries({ queryKey: queryKeys.workouts.byId(id) })
      qc.invalidateQueries({ queryKey: queryKeys.workouts.all })
      if (userId) {
        qc.invalidateQueries({ queryKey: queryKeys.habits.logs(userId) })
        qc.invalidateQueries({ queryKey: queryKeys.me.userAnalytics })
        qc.invalidateQueries({ queryKey: ['trainingAnalytics', userId] })
      }
    },
  })
}

export function useCreateWorkoutPayloadMutation() {
  const userId = useAuth((s) => s.userId)
  const qc = useQueryClient()

  return useMutation({
    mutationFn: (payload: WorkoutPayload) => {
      return createWorkoutService(payload)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.workouts.all })
      if (userId) {
        qc.invalidateQueries({ queryKey: queryKeys.habits.logs(userId) })
        qc.invalidateQueries({ queryKey: queryKeys.programs.user.active(userId) })
        qc.invalidateQueries({ queryKey: queryKeys.programs.user.all(userId) })
        qc.invalidateQueries({ queryKey: ['userPrograms', 'detail', userId] })
        qc.invalidateQueries({ queryKey: queryKeys.me.userAnalytics })
        qc.invalidateQueries({ queryKey: ['trainingAnalytics', userId] })
      }
    },
  })
}

// ─────────────────────────────────────────────────────
// MUTATION — delete workout (with optimistic removal)
// ─────────────────────────────────────────────────────
export function useDeleteWorkoutMutation() {
  const userId = useAuth((s) => s.userId)
  const qc = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => deleteWorkoutService(id),
    onMutate: async (id: string) => {
      // Optimistically remove from all pages in the infinite query
      await qc.cancelQueries({ queryKey: queryKeys.workouts.all })
      const previousData = qc.getQueryData<WorkoutHistoryInfiniteData>(queryKeys.workouts.all)

      qc.setQueryData<WorkoutHistoryInfiniteData>(queryKeys.workouts.all, (old) => {
        if (!old) return old
        return {
          ...old,
          pages: old.pages.map((page) => ({
            ...page,
            workouts: page.workouts.filter((w: WorkoutHistoryItem) => w.id !== id),
          })),
        }
      })

      return { previousData }
    },
    onError: (_err, _id, ctx) => {
      if (ctx?.previousData) {
        qc.setQueryData(queryKeys.workouts.all, ctx.previousData)
      }
    },
    onSettled: (_res, _err, id) => {
      qc.invalidateQueries({ queryKey: queryKeys.workouts.all })
      if (userId) {
        qc.invalidateQueries({ queryKey: queryKeys.me.userAnalytics })
        qc.invalidateQueries({ queryKey: ['trainingAnalytics', userId] })
      }
    },
  })
}

// ─────────────────────────────────────────────────────
// Cache helpers
// ─────────────────────────────────────────────────────
export function invalidateWorkoutHistoryCache() {
  queryClient.invalidateQueries({ queryKey: queryKeys.workouts.all })
}

export function invalidateDiscoverWorkoutsCache() {
  queryClient.invalidateQueries({ queryKey: queryKeys.workouts.discover })
}
