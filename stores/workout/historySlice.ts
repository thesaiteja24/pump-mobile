import { enqueueWorkoutDelete } from '@/lib/sync/queue'
import { getAllWorkoutsService, getDiscoverWorkoutsService } from '@/services/workoutServices'
import { StateCreator } from 'zustand'
import { useAuth } from '../authStore'
import { SyncStatus } from '@/types/sync'
import { WorkoutHistoryItem, WorkoutState } from '@/types/workout'

export interface HistorySlice {
	workoutLoading: boolean
	discoverLoading: boolean
	workoutPage: number
	workoutHasMore: boolean
	discoverPage: number
	discoverHasMore: boolean
	workoutHistory: WorkoutHistoryItem[]
	discoverWorkouts: WorkoutHistoryItem[]
	getAllWorkouts: (page?: number) => Promise<void>
	getDiscoverWorkouts: (page?: number) => Promise<void>
	getWorkoutById: (id: string) => WorkoutHistoryItem | undefined
	upsertWorkoutHistoryItem: (item: WorkoutHistoryItem) => void
	updateWorkoutSyncStatus: (clientId: string, syncStatus: SyncStatus) => void
	deleteWorkout: (clientId: string, dbId: string | null) => Promise<boolean>
}

const sortWorkouts = (workouts: WorkoutHistoryItem[]) => {
	return [...workouts].sort((a, b) => new Date(b.startTime ?? 0).getTime() - new Date(a.startTime ?? 0).getTime())
}

export const createHistorySlice: StateCreator<WorkoutState, [], [], HistorySlice> = (set, get) => ({
	workoutLoading: false,
	discoverLoading: false,
	workoutPage: 1,
	workoutHasMore: true,
	discoverPage: 1,
	discoverHasMore: true,
	workoutHistory: [],
	discoverWorkouts: [],

	getAllWorkouts: async (page = 1) => {
		const state = get()
		if (state.workoutLoading && page > 1) return // Prevent duplicate requests

		set({ workoutLoading: true })

		try {
			const res = await getAllWorkoutsService(page)
			if (!res.success || !res.data) return

			const fetchedWorkouts = res.data.workouts || []
			const meta = res.data.meta

			set(state => {
				const pending = new Map(
					state.workoutHistory.filter(w => w.syncStatus === 'pending').map(w => [w.clientId, w])
				)

				const merged = []
				const seen = new Set<string>()

				const existingWorkouts = page === 1 ? [] : state.workoutHistory.filter(w => w.syncStatus !== 'pending')

				for (const item of [...existingWorkouts, ...fetchedWorkouts]) {
					const clientId = item.clientId ?? item.id
					if (seen.has(clientId)) continue
					seen.add(clientId)

					merged.push(
						pending.get(clientId) ?? {
							...item,
							clientId,
							syncStatus: 'synced' as SyncStatus,
						}
					)

					pending.delete(clientId)
				}

				return {
					workoutHistory: sortWorkouts([...pending.values(), ...merged]),
					workoutPage: meta?.currentPage ?? page,
					workoutHasMore: meta?.hasMore ?? false,
				}
			})
		} catch (e) {
			console.error('getAllWorkouts failed', e)
		} finally {
			set({ workoutLoading: false })
		}
	},

	getDiscoverWorkouts: async (page = 1) => {
		const state = get()
		if (state.discoverLoading && page > 1) return

		set({ discoverLoading: true })

		try {
			const res = await getDiscoverWorkoutsService(page)
			if (!res.success || !res.data) return

			const fetchedWorkouts = res.data.workouts || []
			const meta = res.data.meta

			set(state => {
				const pending = new Map(
					state.discoverWorkouts.filter(w => w.syncStatus === 'pending').map(w => [w.clientId, w])
				)

				const merged = []
				const seen = new Set<string>()

				const existingWorkouts =
					page === 1 ? [] : state.discoverWorkouts.filter(w => w.syncStatus !== 'pending')

				for (const item of [...existingWorkouts, ...fetchedWorkouts]) {
					const clientId = item.clientId ?? item.id
					if (seen.has(clientId)) continue
					seen.add(clientId)

					merged.push(
						pending.get(clientId) ?? {
							...item,
							clientId,
							syncStatus: 'synced' as SyncStatus,
						}
					)

					pending.delete(clientId)
				}

				return {
					discoverWorkouts: sortWorkouts([...pending.values(), ...merged]),
					discoverPage: meta?.currentPage ?? page,
					discoverHasMore: meta?.hasMore ?? false,
				}
			})
		} catch (e) {
			console.error('getDiscoverWorkouts failed', e)
		} finally {
			set({ discoverLoading: false })
		}
	},

	getWorkoutById: (id: string) => {
		const state = get()

		return (
			state.workoutHistory.find(w => w.id === id || w.clientId === id) ||
			state.discoverWorkouts.find(w => w.id === id)
		)
	},

	/**
	 * Upsert a workout history item.
	 * Matches by clientId first (for offline items), then by id.
	 */
	upsertWorkoutHistoryItem: (item: WorkoutHistoryItem) => {
		set(state => {
			// Try to find by clientId first (most reliable for offline-first)
			const existingByClientId = state.workoutHistory.findIndex(w => w.clientId === item.clientId)

			if (existingByClientId !== -1) {
				// Update existing item
				const updatedHistory = [...state.workoutHistory]
				updatedHistory[existingByClientId] = item
				return { workoutHistory: updatedHistory }
			}

			// Fallback: check by id (for items from backend refresh)
			const existingById = state.workoutHistory.findIndex(w => w.id === item.id)

			if (existingById !== -1) {
				const updatedHistory = [...state.workoutHistory]
				updatedHistory[existingById] = item
				return { workoutHistory: updatedHistory }
			}

			// New item - add to beginning
			return {
				workoutHistory: sortWorkouts([item, ...state.workoutHistory]),
			}
		})
	},

	/**
	 * Update sync status for a workout by clientId
	 */
	updateWorkoutSyncStatus: (clientId: string, syncStatus: SyncStatus) => {
		set(state => ({
			workoutHistory: state.workoutHistory.map(w => (w.clientId === clientId ? { ...w, syncStatus } : w)),
		}))
	},

	/**
	 * Delete a workout with offline-first support.
	 * - Always updates local state immediately
	 * - Enqueues for background sync if needed
	 */
	deleteWorkout: async (clientId: string, dbId: string | null) => {
		const previousHistory = get().workoutHistory
		const userId = useAuth.getState().user?.userId

		// Optimistic update: remove from list immediately
		set({
			workoutHistory: previousHistory.filter(w => w.clientId !== clientId),
		})

		if (!userId) {
			return false
		}

		// Check if we have a db-generated id (not same as clientId)
		const actualDbId = dbId && dbId !== clientId ? dbId : null

		// If no actual dbId, it was never synced - just remove locally
		if (!actualDbId) {
			// Also clean up any pending queue items for this clientId
			enqueueWorkoutDelete(clientId, null, userId)
			return true
		}

		// Enqueue for background sync
		enqueueWorkoutDelete(clientId, actualDbId, userId)

		return true
	},
})
