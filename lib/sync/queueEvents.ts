/**
 * Queue Events
 *
 * Simple event emitter for queue changes.
 * useSyncQueue subscribes to these events to auto-sync when online.
 */

type QueueChangeListener = () => void
const listeners: Set<QueueChangeListener> = new Set()

export const queueEvents = {
	/**
	 * Subscribe to queue change events
	 * @returns Unsubscribe function
	 */
	subscribe: (fn: QueueChangeListener): (() => void) => {
		listeners.add(fn)
		return () => listeners.delete(fn)
	},

	/**
	 * Emit queue change event (call after enqueue operations)
	 */
	emit: (): void => {
		listeners.forEach(fn => {
			try {
				fn()
			} catch (e) {
				console.error('[queueEvents] Listener error:', e)
			}
		})
	},
}
