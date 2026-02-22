/**
 * Workout Reconciler
 *
 * Handles state reconciliation after sync operations.
 * Updates local state with backend responses.
 */

import { useWorkout } from '@/stores/workoutStore'
import { SyncStatus } from '../types'

/**
 * Reconcile a workout's ID after successful CREATE sync.
 * Updates the local history item with the backend-generated ID.
 */
export function reconcileWorkoutId(clientId: string, dbId: string): void {
	const state = useWorkout.getState()
	const history = state.workoutHistory

	const updatedHistory = history.map(item => {
		if (item.clientId === clientId) {
			return {
				...item,
				id: dbId,
				syncStatus: 'synced' as SyncStatus,
			}
		}
		return item
	})

	useWorkout.setState({ workoutHistory: updatedHistory })
}

/**
 * Reconcile a workout with full backend data after successful UPDATE/CREATE.
 * Replaces the local history item with the backend version, preserving clientId.
 */
export function reconcileWorkout(clientId: string, backendWorkout: any): void {
	const state = useWorkout.getState()
	const history = state.workoutHistory

	const updatedHistory = history.map(item => {
		if (item.clientId === clientId) {
			return {
				...item, // Keep existing fields as base
				...backendWorkout, // Overwrite with backend data
				// Explicitly preserve arrays if missing in backend response
				exercises: backendWorkout.exercises ?? item.exercises,
				exerciseGroups: backendWorkout.exerciseGroups ?? item.exerciseGroups,
				clientId: clientId, // Ensure clientId is preserved
				syncStatus: 'synced' as SyncStatus,
			}
		}
		return item
	})

	useWorkout.setState({ workoutHistory: updatedHistory })
}

/**
 * Update sync status for a workout by clientId
 */
export function updateWorkoutSyncStatus(clientId: string, syncStatus: SyncStatus): void {
	const state = useWorkout.getState()
	const history = state.workoutHistory

	const updatedHistory = history.map(item => {
		if (item.clientId === clientId) {
			return { ...item, syncStatus }
		}
		return item
	})

	useWorkout.setState({ workoutHistory: updatedHistory })
}

/**
 * Remove a workout from history by clientId (for failed items or rollback)
 */
export function removeWorkoutByClientId(clientId: string): void {
	const state = useWorkout.getState()
	const updatedHistory = state.workoutHistory.filter(item => item.clientId !== clientId)
	useWorkout.setState({ workoutHistory: updatedHistory })
}

/**
 * Mark workout as synced after successful UPDATE
 */
export function markWorkoutSynced(clientId: string): void {
	updateWorkoutSyncStatus(clientId, 'synced')
}

/**
 * Mark workout as failed after sync failure
 */
export function markWorkoutFailed(clientId: string): void {
	updateWorkoutSyncStatus(clientId, 'failed')
}
