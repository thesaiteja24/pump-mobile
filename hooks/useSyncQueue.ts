import {
	dequeueAnalytics,
	dequeueTemplate,
	dequeueUser,
	dequeueWorkout,
	getAnalyticsFailedQueue,
	getAnalyticsQueue,
	getAnalyticsQueueForUser,
	getTemplateQueueCounts,
	getTemplateQueueForUser,
	getUserQueue,
	getWorkoutQueueCounts,
	getWorkoutQueueForUser,
	incrementAnalyticsRetry,
	incrementTemplateRetry,
	incrementUserRetry,
	incrementWorkoutRetry,
	moveAnalyticsToFailedQueue,
	moveTemplateToFailedQueue,
	moveWorkoutToFailedQueue,
	AnalyticsMutation,
	HabitMutation,
	TemplateMutation,
	UserMutation,
	WorkoutMutation,
} from '@/lib/sync/queue'
import {
	dequeueHabit,
	getHabitFailedQueue,
	getHabitQueue,
	getHabitQueueForUser,
	incrementHabitRetry,
	moveHabitToFailedQueue,
} from '@/lib/sync/queue/habitQueue'
import { queueEvents } from '@/lib/sync/queueEvents'
import {
	markTemplateFailed,
	markTemplateSynced,
	markWorkoutFailed,
	markWorkoutSynced,
	processAnalyticsMutation,
	reconcileTemplate,
	reconcileTemplateId,
	reconcileWorkout,
	reconcileWorkoutId,
	reconcileHabitId,
	markHabitSynced,
	markHabitFailed,
	markHabitLogSynced,
} from '@/lib/sync/reconciler'
import {
	createHabitService,
	deleteHabitService,
	logHabitService,
	updateHabitService,
} from '@/services/habitService'
import { createTemplateService, deleteTemplateService, updateTemplateService } from '@/services/templateService'
import { updateUserDataService } from '@/services/userService'
import { createWorkoutService, deleteWorkoutService, updateWorkoutService } from '@/services/workoutServices'
import { useAnalytics } from '@/stores/analyticsStore'
import { useAuth } from '@/stores/authStore'
import { useHabitStore } from '@/stores/habitStore'
import { useSyncStore } from '@/stores/syncStore'
import { useCallback, useEffect, useRef } from 'react'
import { useNetworkStatus } from './useNetworkStatus'

/* ─────────────────────────────────────────────
   Constants
───────────────────────────────────────────── */
const MAX_RETRIES = 3
const RETRY_DELAY_MS = 2000

/* ─────────────────────────────────────────────
   Dev-only logger
───────────────────────────────────────────── */
const log = {
	info: (...a: any[]) => (process.env.NODE_ENV === 'development') && console.log(...a),
	warn: (...a: any[]) => (process.env.NODE_ENV === 'development') && console.warn(...a),
	error: (...a: any[]) => (process.env.NODE_ENV === 'development') && console.error(...a),
}

/* ─────────────────────────────────────────────
   Sync Hook
───────────────────────────────────────────── */
export function useSyncQueue() {
	const { isConnected, isInternetReachable } = useNetworkStatus()
	const isAuthenticated = useAuth(s => s.isAuthenticated)
	const user = useAuth(s => s.user)

	const isOnline = isConnected && isInternetReachable !== false
	const isSyncing = useRef(false)

	/* ─────────────────────────────────────────────
     Network status propagation
  ───────────────────────────────────────────── */
	useEffect(() => {
		useSyncStore.getState().setNetworkStatus(isOnline)
	}, [isOnline])

	/* ─────────────────────────────────────────────
     Queue counts
  ───────────────────────────────────────────── */
	const updateCounts = useCallback(() => {
		if (!user?.userId) return

		const workoutCounts = getWorkoutQueueCounts(user.userId)
		const templateCounts = getTemplateQueueCounts(user.userId)
		const habitCounts = {
			pending: getHabitQueue().filter(m => m.userId === user.userId).length,
			failed: getHabitFailedQueue().filter(m => m.userId === user.userId).length,
		}
		const analyticsCounts = {
			pending: getAnalyticsQueue().filter(m => m.userId === user.userId).length,
			failed: getAnalyticsFailedQueue().filter(m => m.userId === user.userId).length,
		}
		const userQueue = getUserQueue()

		useSyncStore
			.getState()
			.setQueueCounts(
				workoutCounts.pending +
					templateCounts.pending +
					habitCounts.pending +
					analyticsCounts.pending +
					userQueue.length,
				workoutCounts.failed + templateCounts.failed + habitCounts.failed + analyticsCounts.failed
			)
	}, [user?.userId])

	useEffect(() => {
		updateCounts()
	}, [updateCounts])

	/* ─────────────────────────────────────────────
     Workout mutation processor
  ───────────────────────────────────────────── */
	const processWorkoutMutation = useCallback(async (mutation: WorkoutMutation): Promise<boolean> => {
		try {
			switch (mutation.type) {
				case 'CREATE': {
					const res = await createWorkoutService(mutation.payload)

					if (res.success && res.data?.workout) {
						console.info('Reconciling workout resource')
						reconcileWorkout(mutation.clientId, res.data.workout)
					} else if (res.success && res.data?.workout?.id) {
						console.info('Reconciling workout id')
						reconcileWorkoutId(mutation.clientId, res.data.workout.id)
						markWorkoutSynced(mutation.clientId)
					}
					return true
				}

				case 'UPDATE': {
					if (!mutation.payload.id) return false
					const res = await updateWorkoutService(mutation.payload.id, mutation.payload)
					if (res.success && res.data) {
						// res.data is the full workout object now
						reconcileWorkout(mutation.clientId, res.data)
					} else {
						// Fallback
						markWorkoutSynced(mutation.clientId)
					}
					return true
				}

				case 'DELETE': {
					if (mutation.payload.id) {
						await deleteWorkoutService(mutation.payload.id)
					}
					return true
				}

				default:
					log.warn('[SYNC] Unknown workout mutation', mutation)
					return false
			}
		} catch (error: any) {
			const status = error?.response?.status

			log.error('[SYNC ERROR - Workout]', {
				queueId: mutation.queueId,
				type: mutation.type,
				status,
			})

			if (status && status >= 400 && status < 500) {
				markWorkoutFailed(mutation.clientId)
				moveWorkoutToFailedQueue(mutation.queueId)
				return true
			}

			return false
		}
	}, [])

	/* ─────────────────────────────────────────────
     Template mutation processor
  ───────────────────────────────────────────── */
	const processTemplateMutation = useCallback(async (mutation: TemplateMutation): Promise<boolean> => {
		try {
			switch (mutation.type) {
				case 'CREATE': {
					const res = await createTemplateService(mutation.payload)

					if (res.success && res.data?.template) {
						reconcileTemplate(mutation.clientId, res.data.template)
						console.info('reconciled template resource')
					} else if (res.success && res.data?.template?.id) {
						reconcileTemplateId(mutation.clientId, res.data.template.id)
						console.info('reconciled template id')
						markTemplateSynced(mutation.clientId)
					}
					return true
				}

				case 'UPDATE': {
					if (!mutation.payload.id) return false
					const res = await updateTemplateService(mutation.payload.id, mutation.payload)
					if (res.success && res.data) {
						reconcileTemplate(mutation.clientId, res.data)
					} else {
						markTemplateSynced(mutation.clientId)
					}
					return true
				}

				case 'DELETE': {
					if (mutation.payload.id) {
						await deleteTemplateService(mutation.payload.id)
					}
					return true
				}

				default:
					log.warn('[SYNC] Unknown template mutation', mutation)
					return false
			}
		} catch (error: any) {
			const status = error?.response?.status

			log.error('[SYNC ERROR - Template]', {
				queueId: mutation.queueId,
				type: mutation.type,
				status,
			})

			if (status && status >= 400 && status < 500) {
				markTemplateFailed(mutation.clientId)
				moveTemplateToFailedQueue(mutation.queueId)
				return true
			}

			return false
		}
	}, [])

	/* ─────────────────────────────────────────────
     User mutation processor
  ───────────────────────────────────────────── */
	const processUserMutation = useCallback(async (mutation: UserMutation): Promise<boolean> => {
		try {
			const res = await updateUserDataService(mutation.userId, mutation.payload)
			if (res.success) {
				return true
			} else {
			}
			return false
		} catch (error: any) {
			log.error('[SYNC ERROR - User]', {
				queueId: mutation.queueId,
				type: mutation.type,
				error,
			})
			return false
		}
	}, [])

	/* ─────────────────────────────────────────────
     Habit mutation processor
  ───────────────────────────────────────────── */
	const processHabitMutation = useCallback(async (mutation: HabitMutation): Promise<boolean> => {
		try {
			switch (mutation.type) {
				case 'CREATE_HABIT': {
					const res = await createHabitService(mutation.userId, mutation.payload)
					if (res.success && res.data?.id) {
						// Reconcile habit ID if we used a temp ID
						reconcileHabitId(mutation.payload.id!, res.data.id)
					} else {
						markHabitFailed(mutation.payload.id!)
					}
					return res.success
				}
				case 'UPDATE_HABIT': {
					const res = await updateHabitService(mutation.userId, mutation.payload.id!, mutation.payload)
					if (res.success) {
						markHabitSynced(mutation.payload.id!)
					} else {
						markHabitFailed(mutation.payload.id!)
					}
					return res.success
				}
				case 'LOG_HABIT': {
					const res = await logHabitService(mutation.userId, mutation.payload.id!, {
						date: mutation.payload.date!,
						value: mutation.payload.value!,
					})
					if (res.success) {
						markHabitLogSynced(mutation.payload.id!, mutation.payload.date!)
					}
					return res.success
				}
				case 'DELETE_HABIT': {
					const res = await deleteHabitService(mutation.userId, mutation.payload.id!)
					return res.success
				}

				case 'UPDATE_HABIT': {
					if (!mutation.payload.id) return false
					const res = await updateHabitService(mutation.userId, mutation.payload.id, mutation.payload)
					return res.success
				}

				case 'DELETE_HABIT': {
					if (!mutation.payload.id) return false
					const res = await deleteHabitService(mutation.userId, mutation.payload.id)
					return res.success
				}

				case 'LOG_HABIT': {
					if (!mutation.payload.id || !mutation.payload.date) return false
					const res = await logHabitService(mutation.userId, mutation.payload.id, {
						date: mutation.payload.date,
						value: mutation.payload.value || 0,
					})
					return res.success
				}

				default:
					log.warn('[SYNC] Unknown habit mutation', mutation)
					return false
			}
		} catch (error: any) {
			const status = error?.response?.status

			log.error('[SYNC ERROR - Habit]', {
				queueId: mutation.queueId,
				type: mutation.type,
				status,
				error,
			})

			if (status && status >= 400 && status < 500) {
				moveHabitToFailedQueue(mutation.queueId)
				return true
			}

			return false
		}
	}, [])
	const syncQueue = useCallback(async () => {
		if (!isAuthenticated || !user?.userId || isSyncing.current) return

		isSyncing.current = true
		useSyncStore.getState().setSyncStatus(true)
		updateCounts()

		try {
			// Workouts
			for (const m of getWorkoutQueueForUser(user.userId)) {
				if (m.retryCount >= MAX_RETRIES) {
					markWorkoutFailed(m.clientId)
					moveWorkoutToFailedQueue(m.queueId)
					continue
				}

				const ok = await processWorkoutMutation(m)
				if (ok) {
					dequeueWorkout(m.queueId)
				} else {
					incrementWorkoutRetry(m.queueId)
					console.info('Retrying workout mutation', m.queueId)
					await new Promise(r => setTimeout(r, RETRY_DELAY_MS))
				}
			}

			// Templates
			for (const m of getTemplateQueueForUser(user.userId)) {
				if (m.retryCount >= MAX_RETRIES) {
					markTemplateFailed(m.clientId)
					moveTemplateToFailedQueue(m.queueId)
					continue
				}

				const ok = await processTemplateMutation(m)
				if (ok) {
					dequeueTemplate(m.queueId)
				} else {
					incrementTemplateRetry(m.queueId)
					await new Promise(r => setTimeout(r, RETRY_DELAY_MS))
				}
			}

			// User Profile
			// Filter for current user and process
			const userQueue = getUserQueue().filter(m => m.userId === user.userId)
			for (const m of userQueue) {
				if (m.retryCount >= MAX_RETRIES) {
					// For user mutations, we just drop them if they fail too many times?
					// Or maybe we should have a failed queue.
					// For now, simpler approach: drop and log.
					log.error('Dropping failed user mutation', m)
					dequeueUser(m.queueId)
					continue
				}

				const ok = await processUserMutation(m)
				if (ok) {
					dequeueUser(m.queueId)
				} else {
					incrementUserRetry(m.queueId)
					await new Promise(r => setTimeout(r, RETRY_DELAY_MS))
				}
			}

			// Analytics
			for (const m of getAnalyticsQueueForUser(user.userId)) {
				if (m.retryCount >= MAX_RETRIES) {
					moveAnalyticsToFailedQueue(m.queueId)
					continue
				}

				const ok = await processAnalyticsMutation(m)
				if (ok?.success) {
					dequeueAnalytics(m.queueId)

					// Reconcile if it was a measurement containing a newly generated UUID from the backend
					if (m.type === 'ADD_MEASUREMENT' && 'data' in ok && ok.data && m.payload.date) {
						console.info('Reconciling analytics measurement', m.queueId)
						useAnalytics.getState().reconcileMeasurement(m.payload.date, ok.data as any)
					}
				} else {
					incrementAnalyticsRetry(m.queueId)
					await new Promise(r => setTimeout(r, RETRY_DELAY_MS))
				}
			}

			// Habits
			for (const m of getHabitQueueForUser(user.userId)) {
				if (m.retryCount >= MAX_RETRIES) {
					moveHabitToFailedQueue(m.queueId)
					continue
				}

				const ok = await processHabitMutation(m)
				if (ok) {
					dequeueHabit(m.queueId)
				} else {
					incrementHabitRetry(m.queueId)
					await new Promise(r => setTimeout(r, RETRY_DELAY_MS))
				}
			}
		} finally {
			isSyncing.current = false
			useSyncStore.getState().setSyncStatus(false)
			updateCounts()
		}
	}, [
		isAuthenticated,
		user?.userId,
		processWorkoutMutation,
		processTemplateMutation,
		processUserMutation,
		processHabitMutation,
		updateCounts,
	])

	/* ─────────────────────────────────────────────
     Trigger sync on reconnect
  ───────────────────────────────────────────── */
	useEffect(() => {
		if (isOnline && isAuthenticated && user?.userId) {
			syncQueue()
		}
	}, [isOnline, isAuthenticated, user?.userId, syncQueue])

	/* ─────────────────────────────────────────────
     Reactive sync (debounced)
  ───────────────────────────────────────────── */
	const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

	useEffect(() => {
		const unsubscribe = queueEvents.subscribe(() => {
			if (!isOnline || !isAuthenticated || !user?.userId) return

			if (debounceRef.current) {
				clearTimeout(debounceRef.current)
			}

			debounceRef.current = setTimeout(syncQueue, 100)
		})

		return () => {
			unsubscribe()
			if (debounceRef.current) {
				clearTimeout(debounceRef.current)
			}
		}
	}, [isOnline, isAuthenticated, user?.userId, syncQueue])

	return { syncQueue, isOnline }
}
