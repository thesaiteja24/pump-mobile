import { storage } from '@/lib/storage'
import * as Crypto from 'expo-crypto'
import { queueEvents } from '../queueEvents'
import { UserMutation, UserMutationType, UserPayload } from '../types'

const USER_QUEUE_KEY = 'user_sync_queue'

/**
 * Get the current user queue
 */
export function getUserQueue(): UserMutation[] {
	const json = storage.getString(USER_QUEUE_KEY)
	if (!json) return []
	try {
		return JSON.parse(json)
	} catch {
		return []
	}
}

/**
 * Save the user queue
 */
function saveUserQueue(queue: UserMutation[]) {
	storage.set(USER_QUEUE_KEY, JSON.stringify(queue))
}

/**
 * Enqueue a user update
 */
export function enqueueUserUpdate(type: UserMutationType, payload: UserPayload, userId: string) {
	const queue = getUserQueue()

	const existingIndex = queue.findIndex(item => item.type === type && item.userId === userId)

	if (existingIndex !== -1) {
		// Merge payload
		const existing = queue[existingIndex]
		queue[existingIndex] = {
			...existing,
			payload: { ...existing.payload, ...payload },
			createdAt: Date.now(),
		}
	} else {
		// Add new
		const mutation: UserMutation = {
			queueId: Crypto.randomUUID(),
			type,
			payload,
			userId,
			createdAt: Date.now(),
			retryCount: 0,
		}
		queue.push(mutation)
	}

	saveUserQueue(queue)
	queueEvents.emit()
}

/**
 * Remove a mutation from the queue
 */
export function dequeueUser(queueId: string) {
	const queue = getUserQueue()
	const newQueue = queue.filter(item => item.queueId !== queueId)
	saveUserQueue(newQueue)
}

/**
 * Increment retry count for a user mutation
 */
export function incrementUserRetry(queueId: string) {
	const queue = getUserQueue()
	const index = queue.findIndex(item => item.queueId === queueId)
	if (index !== -1) {
		queue[index].retryCount = (queue[index].retryCount || 0) + 1
		saveUserQueue(queue)
	}
}

/**
 * Clear user queue (on logout)
 */
export function clearUserQueue() {
	storage.remove(USER_QUEUE_KEY)
}
