/**
 * Template Queue
 *
 * Domain-specific queue operations for template mutations.
 * Handles enqueue, dequeue, and deduplication logic.
 */

import { storage } from '@/lib/storage'
import * as Crypto from 'expo-crypto'
import { queueEvents } from '../queueEvents'
import { TemplateMutation, TemplatePayload } from '../types'

const TEMPLATE_QUEUE_KEY = 'template-mutation-queue'
const TEMPLATE_FAILED_QUEUE_KEY = 'template-failed-queue'

/**
 * Get all template mutations from the queue
 */
export function getTemplateQueue(): TemplateMutation[] {
	const raw = storage.getString(TEMPLATE_QUEUE_KEY)
	if (!raw) return []
	try {
		return JSON.parse(raw)
	} catch {
		return []
	}
}

/**
 * Save template queue to storage
 */
function saveTemplateQueue(queue: TemplateMutation[]): void {
	storage.set(TEMPLATE_QUEUE_KEY, JSON.stringify(queue))
}

/**
 * Get template queue for a specific user
 */
export function getTemplateQueueForUser(userId: string): TemplateMutation[] {
	return getTemplateQueue().filter(m => m.userId === userId)
}

/**
 * Enqueue a CREATE template mutation
 * If a CREATE for this clientId already exists, merge payloads
 */
export function enqueueTemplateCreate(payload: TemplatePayload, userId: string): TemplateMutation {
	const queue = getTemplateQueue()
	const existing = queue.find(m => m.clientId === payload.clientId && m.type === 'CREATE')

	if (existing) {
		// Merge: update existing CREATE with new payload
		existing.payload = { ...existing.payload, ...payload }
		saveTemplateQueue(queue)
		queueEvents.emit()
		return existing
	}

	const mutation: TemplateMutation = {
		queueId: Crypto.randomUUID(),
		clientId: payload.clientId,
		type: 'CREATE',
		payload,
		userId,
		createdAt: Date.now(),
		retryCount: 0,
	}

	queue.push(mutation)
	saveTemplateQueue(queue)
	queueEvents.emit()
	return mutation
}

/**
 * Enqueue an UPDATE template mutation
 * Applies deduplication rules:
 * - If CREATE exists: merge UPDATE into CREATE
 * - If UPDATE exists: replace with new UPDATE
 */
export function enqueueTemplateUpdate(payload: TemplatePayload, userId: string): TemplateMutation {
	const queue = getTemplateQueue()

	// Check for existing CREATE
	const existingCreate = queue.find(m => m.clientId === payload.clientId && m.type === 'CREATE')

	if (existingCreate) {
		// Merge UPDATE into CREATE
		existingCreate.payload = { ...existingCreate.payload, ...payload }
		saveTemplateQueue(queue)
		queueEvents.emit()
		return existingCreate
	}

	// Check for existing UPDATE
	const existingUpdateIdx = queue.findIndex(m => m.clientId === payload.clientId && m.type === 'UPDATE')

	if (existingUpdateIdx !== -1) {
		// Replace existing UPDATE with new one
		queue[existingUpdateIdx].payload = payload
		queue[existingUpdateIdx].createdAt = Date.now()
		saveTemplateQueue(queue)
		queueEvents.emit()
		return queue[existingUpdateIdx]
	}

	// No existing mutation, create new UPDATE
	const mutation: TemplateMutation = {
		queueId: Crypto.randomUUID(),
		clientId: payload.clientId,
		type: 'UPDATE',
		payload,
		userId,
		createdAt: Date.now(),
		retryCount: 0,
	}

	queue.push(mutation)
	saveTemplateQueue(queue)
	queueEvents.emit()
	return mutation
}

/**
 * Enqueue a DELETE template mutation
 * Applies deduplication rules:
 * - If CREATE exists: remove CREATE (never synced, just discard)
 * - If UPDATE exists: replace with DELETE
 */
export function enqueueTemplateDelete(clientId: string, dbId: string | null, userId: string): TemplateMutation | null {
	const queue = getTemplateQueue()

	// Check for existing CREATE
	const existingCreateIdx = queue.findIndex(m => m.clientId === clientId && m.type === 'CREATE')

	if (existingCreateIdx !== -1) {
		// Remove CREATE - item was never synced, no need to delete on backend
		queue.splice(existingCreateIdx, 1)
		saveTemplateQueue(queue)
		return null
	}

	// Remove any existing UPDATE for this clientId
	const filteredQueue = queue.filter(m => !(m.clientId === clientId && m.type === 'UPDATE'))

	// Check if DELETE already exists
	const existingDelete = filteredQueue.find(m => m.clientId === clientId && m.type === 'DELETE')

	if (existingDelete) {
		saveTemplateQueue(filteredQueue)
		queueEvents.emit()
		return existingDelete
	}

	// Create new DELETE mutation (only if we have a dbId)
	if (!dbId) {
		saveTemplateQueue(filteredQueue)
		return null
	}

	const mutation: TemplateMutation = {
		queueId: Crypto.randomUUID(),
		clientId,
		type: 'DELETE',
		payload: { clientId, id: dbId },
		userId,
		createdAt: Date.now(),
		retryCount: 0,
	}

	filteredQueue.push(mutation)
	saveTemplateQueue(filteredQueue)
	queueEvents.emit()
	return mutation
}

/**
 * Remove a mutation from the queue by queueId
 */
export function dequeueTemplate(queueId: string): void {
	const queue = getTemplateQueue().filter(m => m.queueId !== queueId)
	saveTemplateQueue(queue)
}

/**
 * Increment retry count for a mutation
 */
export function incrementTemplateRetry(queueId: string): void {
	const queue = getTemplateQueue().map(m => (m.queueId === queueId ? { ...m, retryCount: m.retryCount + 1 } : m))
	saveTemplateQueue(queue)
}

/**
 * Get the failed template queue
 */
export function getTemplateFailedQueue(): TemplateMutation[] {
	const raw = storage.getString(TEMPLATE_FAILED_QUEUE_KEY)
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
function saveTemplateFailedQueue(queue: TemplateMutation[]): void {
	storage.set(TEMPLATE_FAILED_QUEUE_KEY, JSON.stringify(queue))
}

/**
 * Move a mutation to the failed queue
 */
export function moveTemplateToFailedQueue(queueId: string): void {
	const queue = getTemplateQueue()
	const mutation = queue.find(m => m.queueId === queueId)

	if (!mutation) return

	// Remove from main queue
	const newQueue = queue.filter(m => m.queueId !== queueId)
	saveTemplateQueue(newQueue)

	// Add to failed queue
	const failedQueue = getTemplateFailedQueue()
	failedQueue.push({
		...mutation,
		retryCount: mutation.retryCount + 1,
	})
	saveTemplateFailedQueue(failedQueue)
}

/**
 * Get queue counts for a user
 */
export function getTemplateQueueCounts(userId: string): {
	pending: number
	failed: number
} {
	const pending = getTemplateQueue().filter(m => m.userId === userId).length
	const failed = getTemplateFailedQueue().filter(m => m.userId === userId).length
	return { pending, failed }
}

/**
 * Clear the template queue (use carefully)
 */
export function clearTemplateQueue(): void {
	storage.remove(TEMPLATE_QUEUE_KEY)
}

/**
 * Clear failed queue for a user
 */
export function clearTemplateFailedQueueForUser(userId: string): void {
	const queue = getTemplateFailedQueue().filter(m => m.userId !== userId)
	saveTemplateFailedQueue(queue)
}
