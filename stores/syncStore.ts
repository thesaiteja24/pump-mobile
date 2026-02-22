import { create } from 'zustand'

interface SyncState {
	isSyncing: boolean
	isOnline: boolean
	pendingCount: number
	failedCount: number
	setSyncStatus: (isSyncing: boolean) => void
	setNetworkStatus: (isOnline: boolean) => void
	setQueueCounts: (pending: number, failed: number) => void
}

export const useSyncStore = create<SyncState>(set => ({
	isSyncing: false,
	isOnline: true,
	pendingCount: 0,
	failedCount: 0,
	setSyncStatus: isSyncing => set({ isSyncing }),
	setNetworkStatus: isOnline => set({ isOnline }),
	setQueueCounts: (pending, failed) => set({ pendingCount: pending, failedCount: failed }),
}))
