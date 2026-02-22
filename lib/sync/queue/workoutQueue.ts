/**
 * Workout Queue
 *
 * Domain-specific queue operations for workout mutations.
 * Handles enqueue, dequeue, and deduplication logic.
 */

import { storage } from '@/lib/storage'
import * as Crypto from 'expo-crypto'
import { queueEvents } from '../queueEvents'
import { WorkoutMutation, WorkoutPayload } from '../types'

const WORKOUT_QUEUE_KEY = 'workout-mutation-queue'
const WORKOUT_FAILED_QUEUE_KEY = 'workout-failed-queue'

/**
 * Get all workout mutations from the queue
 */
export function getWorkoutQueue(): WorkoutMutation[] {
	const raw = storage.getString(WORKOUT_QUEUE_KEY)
	if (!raw) return []
	try {
		return JSON.parse(raw)
	} catch {
		return []
	}
}

/**
 * Save workout queue to storage
 */
function saveWorkoutQueue(queue: WorkoutMutation[]): void {
	storage.set(WORKOUT_QUEUE_KEY, JSON.stringify(queue))
}

/**
 * Get workout queue for a specific user
 */
export function getWorkoutQueueForUser(userId: string): WorkoutMutation[] {
	return getWorkoutQueue().filter(m => m.userId === userId)
}

/**
 * Enqueue a CREATE workout mutation
 * If a CREATE for this clientId already exists, merge payloads
 */
export function enqueueWorkoutCreate(payload: WorkoutPayload, userId: string): WorkoutMutation {
	const queue = getWorkoutQueue()
	const existing = queue.find(m => m.clientId === payload.clientId && m.type === 'CREATE')

	if (existing) {
		// Merge: update existing CREATE with new payload
		existing.payload = { ...existing.payload, ...payload }
		saveWorkoutQueue(queue)
		queueEvents.emit() // Trigger auto-sync
		return existing
	}

	const mutation: WorkoutMutation = {
		queueId: Crypto.randomUUID(),
		clientId: payload.clientId,
		type: 'CREATE',
		payload,
		userId,
		createdAt: Date.now(),
		retryCount: 0,
	}

	queue.push(mutation)
	saveWorkoutQueue(queue)
	queueEvents.emit() // Trigger auto-sync
	return mutation
}

/**
 * Enqueue an UPDATE workout mutation
 * Applies deduplication rules:
 * - If CREATE exists: merge UPDATE into CREATE
 * - If UPDATE exists: replace with new UPDATE
 */
export function enqueueWorkoutUpdate(payload: WorkoutPayload, userId: string): WorkoutMutation {
	const queue = getWorkoutQueue()

	// Check for existing CREATE
	const existingCreate = queue.find(m => m.clientId === payload.clientId && m.type === 'CREATE')

	if (existingCreate) {
		// Merge UPDATE into CREATE
		existingCreate.payload = { ...existingCreate.payload, ...payload }
		saveWorkoutQueue(queue)
		queueEvents.emit()
		return existingCreate
	}

	// Check for existing UPDATE
	const existingUpdateIdx = queue.findIndex(m => m.clientId === payload.clientId && m.type === 'UPDATE')

	if (existingUpdateIdx !== -1) {
		// Replace existing UPDATE with new one
		queue[existingUpdateIdx].payload = payload
		queue[existingUpdateIdx].createdAt = Date.now()
		saveWorkoutQueue(queue)
		queueEvents.emit()
		return queue[existingUpdateIdx]
	}

	// No existing mutation, create new UPDATE
	const mutation: WorkoutMutation = {
		queueId: Crypto.randomUUID(),
		clientId: payload.clientId,
		type: 'UPDATE',
		payload,
		userId,
		createdAt: Date.now(),
		retryCount: 0,
	}

	queue.push(mutation)
	saveWorkoutQueue(queue)
	queueEvents.emit()
	return mutation
}

/**
 * Enqueue a DELETE workout mutation
 * Applies deduplication rules:
 * - If CREATE exists: remove CREATE (never synced, just discard)
 * - If UPDATE exists: replace with DELETE
 */
export function enqueueWorkoutDelete(clientId: string, dbId: string | null, userId: string): WorkoutMutation | null {
	const queue = getWorkoutQueue()

	// Check for existing CREATE
	const existingCreateIdx = queue.findIndex(m => m.clientId === clientId && m.type === 'CREATE')

	if (existingCreateIdx !== -1) {
		// Remove CREATE - item was never synced, no need to delete on backend
		queue.splice(existingCreateIdx, 1)
		saveWorkoutQueue(queue)
		// No emit needed - nothing to sync
		return null
	}

	// Remove any existing UPDATE for this clientId
	const filteredQueue = queue.filter(m => !(m.clientId === clientId && m.type === 'UPDATE'))

	// Check if DELETE already exists
	const existingDelete = filteredQueue.find(m => m.clientId === clientId && m.type === 'DELETE')

	if (existingDelete) {
		saveWorkoutQueue(filteredQueue)
		queueEvents.emit()
		return existingDelete
	}

	// Create new DELETE mutation (only if we have a dbId)
	if (!dbId) {
		// No DB ID means it was never synced, just clean up queue
		saveWorkoutQueue(filteredQueue)
		return null
	}

	const mutation: WorkoutMutation = {
		queueId: Crypto.randomUUID(),
		clientId,
		type: 'DELETE',
		payload: { clientId, id: dbId },
		userId,
		createdAt: Date.now(),
		retryCount: 0,
	}

	filteredQueue.push(mutation)
	saveWorkoutQueue(filteredQueue)
	queueEvents.emit()
	return mutation
}

/**
 * Remove a mutation from the queue by queueId
 */
export function dequeueWorkout(queueId: string): void {
	const queue = getWorkoutQueue().filter(m => m.queueId !== queueId)
	saveWorkoutQueue(queue)
}

/**
 * Increment retry count for a mutation
 */
export function incrementWorkoutRetry(queueId: string): void {
	const queue = getWorkoutQueue().map(m => (m.queueId === queueId ? { ...m, retryCount: m.retryCount + 1 } : m))
	saveWorkoutQueue(queue)
}

/**
 * Get the failed workout queue
 */
export function getWorkoutFailedQueue(): WorkoutMutation[] {
	const raw = storage.getString(WORKOUT_FAILED_QUEUE_KEY)
	if (!raw) return []
	try {
		return JSON.parse(raw)
	} catch {
		return []
	}
}

/**
 * Save failed queue to storage
 */
function saveWorkoutFailedQueue(queue: WorkoutMutation[]): void {
	storage.set(WORKOUT_FAILED_QUEUE_KEY, JSON.stringify(queue))
}

/**
 * Move a mutation to the failed queue
 */
export function moveWorkoutToFailedQueue(queueId: string): void {
	const queue = getWorkoutQueue()
	const mutation = queue.find(m => m.queueId === queueId)

	if (!mutation) return

	// Remove from main queue
	const newQueue = queue.filter(m => m.queueId !== queueId)
	saveWorkoutQueue(newQueue)

	// Add to failed queue
	const failedQueue = getWorkoutFailedQueue()
	failedQueue.push({
		...mutation,
		retryCount: mutation.retryCount + 1,
	})
	saveWorkoutFailedQueue(failedQueue)
}

/**
 * Get queue counts for a user
 */
export function getWorkoutQueueCounts(userId: string): {
	pending: number
	failed: number
} {
	const pending = getWorkoutQueue().filter(m => m.userId === userId).length
	const failed = getWorkoutFailedQueue().filter(m => m.userId === userId).length
	return { pending, failed }
}

/**
 * Clear the workout queue (use carefully)
 */
export function clearWorkoutQueue(): void {
	storage.remove(WORKOUT_QUEUE_KEY)
}

/**
 * Clear failed queue for a user
 */
export function clearWorkoutFailedQueueForUser(userId: string): void {
	const queue = getWorkoutFailedQueue().filter(m => m.userId !== userId)
	saveWorkoutFailedQueue(queue)
}
