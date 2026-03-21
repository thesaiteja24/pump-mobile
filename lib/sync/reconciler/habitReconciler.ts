/**
 * Habit Reconciler
 *
 * Handles state reconciliation after sync operations for habits.
 */

import { useHabitStore } from '@/stores/habitStore'
import { SyncStatus } from '../types'

/**
 * Reconcile a habit's ID after successful CREATE_HABIT sync.
 */
export function reconcileHabitId(tempId: string, dbId: string): void {
	const state = useHabitStore.getState()
	const { habits, habitLogs } = state

	// Update habit ID
	const updatedHabits = habits.map(h => (h.id === tempId ? { ...h, id: dbId, syncStatus: 'synced' as SyncStatus } : h))

	// Update logs ID if they were stored under tempId
	const updatedLogs = { ...habitLogs }
	if (updatedLogs[tempId]) {
		updatedLogs[dbId] = updatedLogs[tempId].map(l => ({ ...l, syncStatus: 'synced' as SyncStatus }))
		delete updatedLogs[tempId]
	}

	useHabitStore.setState({ habits: updatedHabits, habitLogs: updatedLogs })
}

/**
 * Mark habit as synced after successful UPDATE_HABIT
 */
export function markHabitSynced(id: string): void {
	const state = useHabitStore.getState()
	const updatedHabits = state.habits.map(h => (h.id === id ? { ...h, syncStatus: 'synced' as SyncStatus } : h))
	useHabitStore.setState({ habits: updatedHabits })
}

/**
 * Mark habit as failed after sync failure
 */
export function markHabitFailed(id: string): void {
	const state = useHabitStore.getState()
	const updatedHabits = state.habits.map(h => (h.id === id ? { ...h, syncStatus: 'failed' as SyncStatus } : h))
	useHabitStore.setState({ habits: updatedHabits })
}

/**
 * Mark habit log as synced
 */
export function markHabitLogSynced(habitId: string, date: string): void {
	const state = useHabitStore.getState()
	const logs = state.habitLogs[habitId] || []
	const updatedLogs = logs.map(l => (l.date === date ? { ...l, syncStatus: 'synced' as SyncStatus } : l))

	useHabitStore.setState({
		habitLogs: {
			...state.habitLogs,
			[habitId]: updatedLogs,
		},
	})
}
