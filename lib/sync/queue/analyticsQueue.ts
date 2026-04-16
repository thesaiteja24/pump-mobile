import { storage } from '@/lib/storage'
import * as Crypto from 'expo-crypto'
import { queueEvents } from '../queueEvents'
import { AnalyticsMutation, AnalyticsMutationType, AnalyticsPayload } from '@/types/sync'

const ANALYTICS_QUEUE_KEY = 'analytics_sync_queue'
const ANALYTICS_FAILED_QUEUE_KEY = 'analytics_failed_queue'

export function getAnalyticsQueue(): AnalyticsMutation[] {
	const json = storage.getString(ANALYTICS_QUEUE_KEY)
	if (!json) return []
	try {
		return JSON.parse(json)
	} catch {
		return []
	}
}

function saveAnalyticsQueue(queue: AnalyticsMutation[]) {
	storage.set(ANALYTICS_QUEUE_KEY, JSON.stringify(queue))
}

export function getAnalyticsQueueForUser(userId: string): AnalyticsMutation[] {
	return getAnalyticsQueue().filter(m => m.userId === userId)
}

export function enqueueAnalyticsUpdate(type: AnalyticsMutationType, payload: AnalyticsPayload, userId: string) {
	const queue = getAnalyticsQueue()

	const existingIndex = queue.findIndex(item => {
		if (item.type !== type || item.userId !== userId) return false
		if (type === 'ADD_MEASUREMENT') {
			return item.payload.date === payload.date
		}
		return true
	})

	if (existingIndex !== -1) {
		const existing = queue[existingIndex]
		queue[existingIndex] = {
			...existing,
			payload: { ...existing.payload, ...payload },
			createdAt: Date.now(),
		}
	} else {
		const mutation: AnalyticsMutation = {
			queueId: Crypto.randomUUID(),
			type,
			payload,
			userId,
			createdAt: Date.now(),
			retryCount: 0,
		}
		queue.push(mutation)
	}

	saveAnalyticsQueue(queue)
	queueEvents.emit()
}

export function dequeueAnalytics(queueId: string) {
	const queue = getAnalyticsQueue()
	const newQueue = queue.filter(item => item.queueId !== queueId)
	saveAnalyticsQueue(newQueue)
}

export function incrementAnalyticsRetry(queueId: string) {
	const queue = getAnalyticsQueue()
	const index = queue.findIndex(item => item.queueId === queueId)
	if (index !== -1) {
		queue[index].retryCount = (queue[index].retryCount || 0) + 1
		saveAnalyticsQueue(queue)
	}
}

export function getAnalyticsFailedQueue(): AnalyticsMutation[] {
	const json = storage.getString(ANALYTICS_FAILED_QUEUE_KEY)
	if (!json) return []
	try {
		return JSON.parse(json)
	} catch {
		return []
	}
}

function saveAnalyticsFailedQueue(queue: AnalyticsMutation[]) {
	storage.set(ANALYTICS_FAILED_QUEUE_KEY, JSON.stringify(queue))
}

export function moveAnalyticsToFailedQueue(queueId: string): void {
	const queue = getAnalyticsQueue()
	const mutation = queue.find(m => m.queueId === queueId)

	if (!mutation) return

	const newQueue = queue.filter(m => m.queueId !== queueId)
	saveAnalyticsQueue(newQueue)

	const failedQueue = getAnalyticsFailedQueue()
	failedQueue.push({
...mutation,
retryCount: mutation.retryCount + 1,
})
	saveAnalyticsFailedQueue(failedQueue)
}

export function clearAnalyticsQueue() {
	storage.remove(ANALYTICS_QUEUE_KEY)
	storage.remove(ANALYTICS_FAILED_QUEUE_KEY)
}
