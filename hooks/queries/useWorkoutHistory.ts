import { queryClient } from '@/lib/queryClient'
import { queryKeys } from '@/lib/queryKeys'
import { getAllWorkoutsService, getDiscoverWorkoutsService } from '@/services/workoutServices'
import { SyncStatus, WorkoutHistoryItem } from '@/stores/workout/types'
import { useWorkout } from '@/stores/workoutStore'
import { useInfiniteQuery } from '@tanstack/react-query'

const PAGE_LIMIT = 20

// ─────────────────────────────────────────────────────
// READ — workout history (paginated, infinite scroll)
//
// Strategy: useInfiniteQuery handles pagination and caching.
// After each successful page, the Zustand store is kept in sync via
// upsertWorkoutHistoryItem so offline-first reconcilers still work.
// Pending (offline) workouts are merged at the top.
// ─────────────────────────────────────────────────────
export function useWorkoutHistoryQuery() {
	const workoutHistoryStore = useWorkout(s => s.workoutHistory)
	const pendingWorkouts = workoutHistoryStore.filter(w => w.syncStatus === 'pending')

	const query = useInfiniteQuery({
		queryKey: queryKeys.workouts.all,
		queryFn: async ({ pageParam = 1 }) => {
			const res = await getAllWorkoutsService(pageParam as number, PAGE_LIMIT)
			if (!res.success || !res.data) return { workouts: [] as WorkoutHistoryItem[], meta: null }

			const workouts = (res.data.workouts || []).map((w: WorkoutHistoryItem) => ({
				...w,
				clientId: w.clientId ?? w.id,
				syncStatus: 'synced' as SyncStatus,
			}))

			// Keep Zustand store in sync so reconcilers can still mutate
			const { upsertWorkoutHistoryItem } = useWorkout.getState()
			workouts.forEach((w: WorkoutHistoryItem) => upsertWorkoutHistoryItem(w))

			return { workouts, meta: res.data.meta }
		},
		getNextPageParam: lastPage => {
			if (!lastPage.meta?.hasMore) return undefined
			return (lastPage.meta.currentPage ?? 1) + 1
		},
		initialPageParam: 1,
		staleTime: 3 * 60 * 1000, // 3 min
	})

	// Flatten all fetched pages and prepend any pending (offline-first) workouts
	const fetchedWorkouts: WorkoutHistoryItem[] = (query.data?.pages ?? []).flatMap(p => p.workouts)
	const fetchedClientIds = new Set(fetchedWorkouts.map(w => w.clientId ?? w.id))
	const uniquePending = pendingWorkouts.filter(w => !fetchedClientIds.has(w.clientId))

	const workoutHistory = [
		...uniquePending,
		...fetchedWorkouts,
	].sort((a, b) => new Date(b.startTime ?? 0).getTime() - new Date(a.startTime ?? 0).getTime())

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
	const discoverWorkoutsStore = useWorkout(s => s.discoverWorkouts)
	const pendingWorkouts = discoverWorkoutsStore.filter(w => w.syncStatus === 'pending')

	const query = useInfiniteQuery({
		queryKey: queryKeys.workouts.discover,
		queryFn: async ({ pageParam = 1 }) => {
			const res = await getDiscoverWorkoutsService(pageParam as number, PAGE_LIMIT)
			if (!res.success || !res.data) return { workouts: [] as WorkoutHistoryItem[], meta: null }

			return {
				workouts: (res.data.workouts || []).map((w: WorkoutHistoryItem) => ({
					...w,
					clientId: w.clientId ?? w.id,
					syncStatus: 'synced' as SyncStatus,
				})),
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

	const fetchedWorkouts: WorkoutHistoryItem[] = (query.data?.pages ?? []).flatMap(p => p.workouts)
	const fetchedClientIds = new Set(fetchedWorkouts.map(w => w.clientId ?? w.id))
	const uniquePending = pendingWorkouts.filter(w => !fetchedClientIds.has(w.clientId))

	const discoverWorkouts = [
		...uniquePending,
		...fetchedWorkouts,
	].sort((a, b) => new Date(b.startTime ?? 0).getTime() - new Date(a.startTime ?? 0).getTime())

	const hasMore = query.data?.pages?.at(-1)?.meta?.hasMore ?? false

	return {
		...query,
		discoverWorkouts,
		hasMore,
	}
}

// ─────────────────────────────────────────────────────
// Cache helpers — called from workoutReconciler after sync
// ─────────────────────────────────────────────────────
export function invalidateWorkoutHistoryCache() {
	queryClient.invalidateQueries({ queryKey: queryKeys.workouts.all })
}

export function invalidateDiscoverWorkoutsCache() {
	queryClient.invalidateQueries({ queryKey: queryKeys.workouts.discover })
}
