import { queryClient } from '@/lib/queryClient'
import { queryKeys } from '@/lib/queryKeys'
import {
	createWorkoutService,
	deleteWorkoutService,
	getDiscoverWorkoutsService,
	getUserWorkoutsService,
	getWorkoutByIdService,
	updateWorkoutService,
} from '@/services/workoutServices'
import { useAuth } from '@/stores/authStore'
import { WorkoutHistoryItem, WorkoutLog } from '@/types/workout'
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
			const res = await getUserWorkoutsService(pageParam as number, PAGE_LIMIT)
			if (!res.success || !res.data) return { workouts: [] as WorkoutHistoryItem[], meta: null }

			const workouts = (res.data.workouts || []) as WorkoutHistoryItem[]
			return { workouts, meta: res.data.meta }
		},
		getNextPageParam: lastPage => {
			if (!lastPage.meta?.hasMore) return undefined
			return (lastPage.meta.currentPage ?? 1) + 1
		},
		initialPageParam: 1,
		staleTime: Infinity,
	})

	const workoutHistory: WorkoutHistoryItem[] = (query.data?.pages ?? []).flatMap(p => p.workouts)
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
			const res = await getDiscoverWorkoutsService(pageParam as number, PAGE_LIMIT)
			if (!res.success || !res.data) return { workouts: [] as WorkoutHistoryItem[], meta: null }

			return {
				workouts: (res.data.workouts || []) as WorkoutHistoryItem[],
				meta: res.data.meta,
			}
		},
		getNextPageParam: lastPage => {
			if (!lastPage.meta?.hasMore) return undefined
			return (lastPage.meta.currentPage ?? 1) + 1
		},
		initialPageParam: 1,
		staleTime: 2 * 60 * 1000,
	})

	const discoverWorkouts: WorkoutHistoryItem[] = (query.data?.pages ?? []).flatMap(p => p.workouts)
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
			const res = await getWorkoutByIdService(id)
			if (!res.success || !res.data) return null
			return res.data as WorkoutHistoryItem
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
	const userId = useAuth.getState().user?.userId
	const qc = useQueryClient()

	return useMutation({
		mutationFn: (prepared: WorkoutLog) => {
			const payload = {
				...serializeWorkoutForApi(prepared),
			}
			return createWorkoutService(payload as any)
		},
		onSuccess: () => {
			// Invalidate user history so it refetches
			qc.invalidateQueries({ queryKey: queryKeys.workouts.all })
			// Invalidate habit logs (frequency habits depend on workouts)
			qc.invalidateQueries({ queryKey: ['habits', 'logs', userId] })
			// Invalidate program progress
			if (userId) {
				qc.invalidateQueries({ queryKey: queryKeys.programs.user.active(userId) })
				qc.invalidateQueries({ queryKey: queryKeys.programs.user.all(userId) })
				qc.invalidateQueries({ queryKey: ['userPrograms', 'detail', userId] })
				// Invalidate analytics
				qc.invalidateQueries({ queryKey: queryKeys.analytics.userAnalytics(userId) })
				qc.invalidateQueries({ queryKey: ['trainingAnalytics', userId] })
			}
		},
	})
}

// ─────────────────────────────────────────────────────
// MUTATION — update (edit) existing workout
// ─────────────────────────────────────────────────────
export function useUpdateWorkoutMutation() {
	const userId = useAuth.getState().user?.userId
	const qc = useQueryClient()

	return useMutation({
		mutationFn: ({ id, prepared }: { id: string; prepared: WorkoutLog }) => {
			const payload = serializeWorkoutForApi(prepared)
			return updateWorkoutService(id, payload as any)
		},
		onSuccess: (_res, { id }) => {
			qc.invalidateQueries({ queryKey: queryKeys.workouts.byId(id) })
			qc.invalidateQueries({ queryKey: queryKeys.workouts.all })
			qc.invalidateQueries({ queryKey: ['habits', 'logs', userId] })
			if (userId) {
				qc.invalidateQueries({ queryKey: queryKeys.analytics.userAnalytics(userId) })
				qc.invalidateQueries({ queryKey: ['trainingAnalytics', userId] })
			}
		},
	})
}

// ─────────────────────────────────────────────────────
// MUTATION — delete workout (with optimistic removal)
// ─────────────────────────────────────────────────────
export function useDeleteWorkoutMutation() {
	const userId = useAuth.getState().user?.userId
	const qc = useQueryClient()

	return useMutation({
		mutationFn: (id: string) => deleteWorkoutService(id),
		onMutate: async (id: string) => {
			// Optimistically remove from all pages in the infinite query
			await qc.cancelQueries({ queryKey: queryKeys.workouts.all })
			const previousData = qc.getQueryData(queryKeys.workouts.all)

			qc.setQueryData<any>(queryKeys.workouts.all, (old: any) => {
				if (!old) return old
				return {
					...old,
					pages: old.pages.map((page: any) => ({
						...page,
						workouts: page.workouts.filter((w: WorkoutHistoryItem) => w.id !== id),
					})),
				}
			})

			return { previousData }
		},
		onError: (_err, _id, ctx: any) => {
			if (ctx?.previousData) {
				qc.setQueryData(queryKeys.workouts.all, ctx.previousData)
			}
		},
		onSettled: (_res, _err, id) => {
			qc.invalidateQueries({ queryKey: queryKeys.workouts.all })
			if (userId) {
				qc.invalidateQueries({ queryKey: queryKeys.analytics.userAnalytics(userId) })
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
