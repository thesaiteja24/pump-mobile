import { queryClient } from '@/lib/queryClient'
import { queryKeys } from '@/lib/queryKeys'
import { getHabitQueue } from '@/lib/sync/queue/habitQueue'
import { SyncStatus } from '@/lib/sync/types'
import { getHabitLogsService, getHabitsService } from '@/services/habitService'
import { useAuth } from '@/stores/authStore'
import { HabitLogType, HabitType } from '@/stores/habitStore'
import { useQuery } from '@tanstack/react-query'

// ─────────────────────────────────────────────────────
// READ — habits list
//
// Important: Habits are OFFLINE-FIRST. The habitStore holds pending
// (locally created/deleted) items. This query fetches the backend list
// and merges with the pending queue — same logic as the old getHabits()
// action, but managed by TanStack Query for caching + background refetch.
// ─────────────────────────────────────────────────────
export function useHabitsQuery() {
	const userId = useAuth(s => s.user?.userId)

	return useQuery({
		queryKey: queryKeys.habits.list(userId ?? ''),
		queryFn: async () => {
			if (!userId) return [] as HabitType[]

			const res = await getHabitsService(userId)
			if (!res.success) return [] as HabitType[]

			const backendHabits = (res.data as HabitType[]) || []
			const queue = getHabitQueue().filter(m => m.userId === userId)

			// Merge: pending creations on top, pending deletions removed
			const pendingHabits = queue
				.filter(m => m.type === 'CREATE_HABIT')
				.map(m => ({ ...m.payload, id: m.payload.id!, syncStatus: 'pending' as SyncStatus }) as HabitType)

			const deletedIds = new Set(queue.filter(m => m.type === 'DELETE_HABIT').map(m => m.payload.id))
			const filteredBackend = backendHabits.filter(h => !deletedIds.has(h.id))

			return [...filteredBackend, ...pendingHabits]
		},
		enabled: Boolean(userId),
		staleTime: 24 * 60 * 60 * 1000,
	})
}

// ─────────────────────────────────────────────────────
// READ — habit logs (for a date range)
// ─────────────────────────────────────────────────────
export function useHabitLogsQuery(startDate?: string, endDate?: string) {
	const userId = useAuth(s => s.user?.userId)

	return useQuery({
		queryKey: queryKeys.habits.logs(userId ?? '', startDate, endDate),
		queryFn: async () => {
			if (!userId) return {} as Record<string, HabitLogType[]>

			const res = await getHabitLogsService(userId, startDate, endDate)
			if (!res.success) return {} as Record<string, HabitLogType[]>

			const backendLogs = (res.data as Record<string, HabitLogType[]>) || {}
			const queue = getHabitQueue().filter(m => m.userId === userId)

			// Merge pending LOG_HABIT entries over backend data
			const mergedLogs = { ...backendLogs }
			queue
				.filter(m => m.type === 'LOG_HABIT')
				.forEach(m => {
					const habitId = m.payload.id!
					if (!mergedLogs[habitId]) mergedLogs[habitId] = []
					const existingIdx = mergedLogs[habitId].findIndex(l => l.date === m.payload.date)
					const newLog: HabitLogType = {
						date: m.payload.date!,
						value: m.payload.value!,
						syncStatus: 'pending' as SyncStatus,
					}
					if (existingIdx !== -1) mergedLogs[habitId][existingIdx] = newLog
					else mergedLogs[habitId].push(newLog)
				})

			return mergedLogs
		},
		enabled: Boolean(userId),
		staleTime: 24 * 60 * 60 * 1000,
	})
}

// ─────────────────────────────────────────────────────
// Cache helpers — called from habitStore after offline mutations
// ─────────────────────────────────────────────────────
export function invalidateHabitsCache(userId: string) {
	queryClient.invalidateQueries({ queryKey: queryKeys.habits.list(userId) })
}

export function invalidateHabitLogsCache(userId: string) {
	queryClient.invalidateQueries({ queryKey: ['habits', 'logs', userId] })
}
