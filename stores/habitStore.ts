import { zustandStorage } from '@/lib/storage'
import { enqueueHabitUpdate } from '@/lib/sync/queue/habitQueue'
import { getHabitQueue } from '@/lib/sync/queue/habitQueue'
import { HabitPayload, SyncStatus } from '@/lib/sync/types'
import { getHabitLogsService, getHabitsService } from '@/services/habitService'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { useAuth } from './authStore'

export type HabitFooterType = 'weeklyStreak' | 'weeklyCount'
export type HabitTrackingType = 'streak' | 'quantity'
export type HabitSourceType = 'manual' | 'internal'

export type HabitType = {
	id: string
	title: string
	colorScheme: string
	trackingType: HabitTrackingType
	targetValue?: number | null
	unit?: string | null
	footerType: HabitFooterType
	source: HabitSourceType
	internalMetricId?: string | null
	syncStatus?: SyncStatus
}

export type HabitLogType = {
	date: string
	value: number
	syncStatus?: SyncStatus
}

interface HabitState {
	habits: HabitType[]
	habitLogs: Record<string, HabitLogType[]> // Map of habitId -> logs
	isLoading: boolean
	error: string | null

	setHabits: (habits: HabitType[]) => void
	setHabitLogs: (logs: Record<string, HabitLogType[]>) => void
	setIsLoading: (loading: boolean) => void
	setError: (error: string | null) => void

	getHabits: () => Promise<any>
	getHabitLogs: (startDate?: string, endDate?: string) => Promise<any>
	createHabit: (data: Omit<HabitType, 'id'>) => Promise<any>
	updateHabit: (id: string, data: Partial<HabitType>) => Promise<any>
	deleteHabit: (id: string) => Promise<any>
	logHabit: (habitId: string, value: number, date?: string) => Promise<any>

	preSeedDefaultHabits: () => Promise<any>
	resetState: () => void
}

const initialState = {
	habits: [],
	habitLogs: {},
	isLoading: false,
	error: null,
}

export const useHabitStore = create<HabitState>()(
	persist(
		(set, get) => ({
			...initialState,

			setHabits: habits => set({ habits }),
			setHabitLogs: logs => set({ habitLogs: logs }),
			setIsLoading: loading => set({ isLoading: loading }),
			setError: error => set({ error }),

			getHabits: async () => {
				set({ isLoading: true, error: null })
				try {
					const user = useAuth.getState().user
					const userId = user?.userId || (user as any)?.id
					if (!userId) {
						set({ error: 'User not logged in', isLoading: false })
						return { success: false, error: 'User not logged in' }
					}

					const res = await getHabitsService(userId)
					if (!res.success) {
						set({ error: res.message, isLoading: false })
						return res
					}

					const backendHabits = (res.data as HabitType[]) || []
					const queue = getHabitQueue().filter(m => m.userId === userId)

					// Merge pending creations
					const pendingHabits = queue
						.filter(m => m.type === 'CREATE_HABIT')
						.map(m => ({ ...m.payload, id: m.payload.id!, syncStatus: 'pending' as SyncStatus }) as HabitType)

					// Handle pending deletions
					const deletedIds = new Set(queue.filter(m => m.type === 'DELETE_HABIT').map(m => m.payload.id))
					const filteredBackend = backendHabits.filter(h => !deletedIds.has(h.id))

					set({ habits: [...filteredBackend, ...pendingHabits], isLoading: false })
					return { success: true }
				} catch (err) {
					set({ error: 'Failed to fetch habits', isLoading: false })
					return { success: false, error: err }
				}
			},

			getHabitLogs: async (startDate, endDate) => {
				set({ isLoading: true, error: null })
				try {
					const user = useAuth.getState().user
					const userId = user?.userId || (user as any)?.id
					if (!userId) {
						set({ error: 'User not logged in', isLoading: false })
						return { success: false, error: 'User not logged in' }
					}

					const res = await getHabitLogsService(userId, startDate, endDate)
					if (!res.success) {
						set({ error: res.message, isLoading: false })
						return res
					}

					const backendLogs = (res.data as Record<string, HabitLogType[]>) || {}
					const queue = getHabitQueue().filter(m => m.userId === userId)

					const mergedLogs = { ...backendLogs }
					queue
						.filter(m => m.type === 'LOG_HABIT')
						.forEach(m => {
							const habitId = m.payload.id!
							if (!mergedLogs[habitId]) mergedLogs[habitId] = []
							const existingIdx = mergedLogs[habitId].findIndex(l => l.date === m.payload.date)
							const newLog = {
								date: m.payload.date!,
								value: m.payload.value!,
								syncStatus: 'pending' as SyncStatus,
							}
							if (existingIdx !== -1) mergedLogs[habitId][existingIdx] = newLog
							else mergedLogs[habitId].push(newLog)
						})

					set({ habitLogs: mergedLogs, isLoading: false })
					return { success: true }
				} catch (err) {
					set({ error: 'Failed to fetch habit logs', isLoading: false })
					return { success: false, error: err }
				}
			},

			createHabit: async data => {
				const user = useAuth.getState().user
				const userId = user?.userId || (user as any)?.id
				if (!userId) return { success: false, error: 'User not logged in' }

				const tempId = Math.random().toString(36).substring(7)
				const newHabit = { ...data, id: tempId }

				// validate if it is internal habit and if it is already present
				const { habits } = get()
				if (
					data.source === 'internal' &&
					habits.some(h => h.source === 'internal' && h.internalMetricId === data.internalMetricId)
				) {
					return { success: false, error: 'You already track this habit' }
				}

				set(state => ({
					habits: [...state.habits, newHabit as HabitType],
					habitLogs: { ...state.habitLogs, [tempId]: [] },
				}))

				const payload: HabitPayload = {
					userId,
					...data,
				}

				try {
					enqueueHabitUpdate('CREATE_HABIT', payload, userId)
					return { success: true }
				} catch (error) {
					return { success: false, error }
				}
			},

			updateHabit: async (id, data) => {
				const user = useAuth.getState().user
				const userId = user?.userId || (user as any)?.id
				if (!userId) return { success: false, error: 'User not logged in' }

				set(state => ({
					habits: state.habits.map(h => (h.id === id ? { ...h, ...data } : h)),
				}))

				const payload: HabitPayload = {
					userId,
					id,
					...data,
				}

				try {
					enqueueHabitUpdate('UPDATE_HABIT', payload, userId)
					return { success: true }
				} catch (error) {
					return { success: false, error }
				}
			},

			deleteHabit: async id => {
				const user = useAuth.getState().user
				const userId = user?.userId || (user as any)?.id
				if (!userId) return { success: false, error: 'User not logged in' }

				set(state => ({
					habits: state.habits.filter(h => h.id !== id),
					habitLogs: { ...state.habitLogs, [id]: undefined as any },
				}))

				const payload: HabitPayload = {
					userId,
					id,
				}

				try {
					enqueueHabitUpdate('DELETE_HABIT', payload, userId)
					return { success: true }
				} catch (error) {
					return { success: false, error }
				}
			},

			logHabit: async (habitId, value, date) => {
				const user = useAuth.getState().user
				const userId = user?.userId || (user as any)?.id
				if (!userId) return { success: false, error: 'User not logged in' }

				const logDate = date || new Date().toISOString()
				const dateOnly = logDate.split('T')[0]

				set(state => {
					const currentLogs = state.habitLogs[habitId] || []
					const existingIndex = currentLogs.findIndex(l => l.date.split('T')[0] === dateOnly)

					const newLogs = [...currentLogs]
					if (existingIndex !== -1) {
						newLogs[existingIndex] = { ...newLogs[existingIndex], value }
					} else {
						newLogs.push({ date: logDate, value })
					}

					return {
						habitLogs: { ...state.habitLogs, [habitId]: newLogs },
					}
				})

				const payload: HabitPayload = {
					userId,
					id: habitId,
					date: logDate,
					value,
				}

				try {
					enqueueHabitUpdate('LOG_HABIT', payload, userId)
					return { success: true }
				} catch (error) {
					return { success: false, error }
				}
			},

			preSeedDefaultHabits: async () => {
				const { habits } = get()
				if (habits.length > 0) return { success: true }

				const defaults: Omit<HabitType, 'id'>[] = [
					{
						title: 'Weigh-In',
						colorScheme: 'emerald',
						trackingType: 'streak',
						footerType: 'weeklyStreak',
						source: 'internal',
						internalMetricId: 'weight',
					},
					{
						title: 'Workout',
						colorScheme: 'blue',
						trackingType: 'streak',
						footerType: 'weeklyCount',
						source: 'internal',
						internalMetricId: 'workout',
					},
				]

				for (const h of defaults) {
					await get().createHabit(h)
				}

				return { success: true }
			},

			resetState: () => set(initialState),
		}),
		{
			name: 'habit-store',
			storage: zustandStorage,
			partialize: state => ({
				habits: state.habits,
				habitLogs: state.habitLogs,
			}),
		}
	)
)
