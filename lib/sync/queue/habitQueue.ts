import { storage } from '@/lib/storage'
import * as Crypto from 'expo-crypto'
import { queueEvents } from '../queueEvents'
import { HabitMutation, HabitMutationType, HabitPayload } from '@/types/sync'

const HABIT_QUEUE_KEY = 'habit_sync_queue'
const HABIT_FAILED_QUEUE_KEY = 'habit_failed_queue'

export function getHabitQueue(): HabitMutation[] {
	const json = storage.getString(HABIT_QUEUE_KEY)
	if (!json) return []
	try {
		return JSON.parse(json)
	} catch {
		return []
	}
}

function saveHabitQueue(queue: HabitMutation[]) {
	storage.set(HABIT_QUEUE_KEY, JSON.stringify(queue))
}

export function getHabitQueueForUser(userId: string): HabitMutation[] {
	return getHabitQueue().filter(m => m.userId === userId)
}

export function enqueueHabitUpdate(type: HabitMutationType, payload: HabitPayload, userId: string) {
	const queue = getHabitQueue()

	const existingIndex = queue.findIndex(item => {
		if (item.type !== type || item.userId !== userId) return false
		if (type === 'LOG_HABIT') {
			return item.payload.id === payload.id && item.payload.date === payload.date
		}
		if (type === 'UPDATE_HABIT' || type === 'DELETE_HABIT') {
			return item.payload.id === payload.id
		}
		return false
	})

	if (existingIndex !== -1) {
		const existing = queue[existingIndex]
		queue[existingIndex] = {
			...existing,
			payload: { ...existing.payload, ...payload },
			createdAt: Date.now(),
		}
	} else {
		const mutation: HabitMutation = {
			queueId: Crypto.randomUUID(),
			type,
			payload,
			userId,
			createdAt: Date.now(),
			retryCount: 0,
		}
		queue.push(mutation)
	}

	saveHabitQueue(queue)
	queueEvents.emit()
}

export function dequeueHabit(queueId: string) {
	const queue = getHabitQueue()
	const newQueue = queue.filter(item => item.queueId !== queueId)
	saveHabitQueue(newQueue)
}

export function incrementHabitRetry(queueId: string) {
	const queue = getHabitQueue()
	const index = queue.findIndex(item => item.queueId === queueId)
	if (index !== -1) {
		queue[index].retryCount = (queue[index].retryCount || 0) + 1
		saveHabitQueue(queue)
	}
}

export function getHabitFailedQueue(): HabitMutation[] {
	const json = storage.getString(HABIT_FAILED_QUEUE_KEY)
	if (!json) return []
	try {
		return JSON.parse(json)
	} catch {
		return []
	}
}

function saveHabitFailedQueue(queue: HabitMutation[]) {
	storage.set(HABIT_FAILED_QUEUE_KEY, JSON.stringify(queue))
}

export function moveHabitToFailedQueue(queueId: string): void {
	const queue = getHabitQueue()
	const mutation = queue.find(m => m.queueId === queueId)

	if (!mutation) return

	const newQueue = queue.filter(m => m.queueId !== queueId)
	saveHabitQueue(newQueue)

	const failedQueue = getHabitFailedQueue()
	failedQueue.push({
		...mutation,
		retryCount: mutation.retryCount + 1,
	})
	saveHabitFailedQueue(failedQueue)
}

export function clearHabitQueue() {
	storage.remove(HABIT_QUEUE_KEY)
	storage.remove(HABIT_FAILED_QUEUE_KEY)
}
