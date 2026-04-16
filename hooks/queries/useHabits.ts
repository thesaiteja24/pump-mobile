import { queryClient } from '@/lib/queryClient'
import { queryKeys } from '@/lib/queryKeys'
import { addMeasurementsService } from '@/services/analyticsService'
import {
	createHabitService,
	deleteHabitService,
	getHabitLogsService,
	getHabitsService,
	logHabitService,
	updateHabitService,
} from '@/services/habitService'
import { useAuth } from '@/stores/authStore'
import type {
	HabitFooterType,
	HabitLogType,
	HabitSourceType,
	HabitTrackingType,
	HabitType,
} from '@/types/habits'
import { useMutation, useQuery } from '@tanstack/react-query'

// ─────────────────────────────────────────────────────
// READ — habits list
//
// Important: Habits are OFFLINE-FIRST. The habitStore holds pending
// (locally created/deleted) items. This query fetches the backend list
// and merges with the pending queue — same logic as the old getHabits()
// action, but managed by TanStack Query for caching + background refetch.
// ─────────────────────────────────────────────────────
export function useHabitsQuery() {
	const userId = useAuth(s => s.user?.userId)

	return useQuery({
		queryKey: queryKeys.habits.list(userId ?? ''),
		queryFn: async () => {
			if (!userId) return [] as HabitType[]
			const res = await getHabitsService(userId)
			if (!res.success) return [] as HabitType[]
			return (res.data as HabitType[]) || []
		},
		enabled: Boolean(userId),
		staleTime: 24 * 60 * 60 * 1000,
	})
}

// ─────────────────────────────────────────────────────
// READ — habit logs (for a date range)
// ─────────────────────────────────────────────────────
export function useHabitLogsQuery(startDate?: string, endDate?: string) {
	const userId = useAuth(s => s.user?.userId)

	return useQuery({
		queryKey: queryKeys.habits.logs(userId ?? '', startDate, endDate),
		queryFn: async () => {
			if (!userId) return {} as Record<string, HabitLogType[]>
			const res = await getHabitLogsService(userId, startDate, endDate)
			if (!res.success) return {} as Record<string, HabitLogType[]>
			return (res.data as Record<string, HabitLogType[]>) || {}
		},
		enabled: Boolean(userId),
		staleTime: 24 * 60 * 60 * 1000,
	})
}

export function useCreateHabit() {
	const userId = useAuth(s => s.user?.userId)
	return useMutation({
		mutationFn: async (data: Omit<HabitType, 'id'>) => {
			const res = await createHabitService(userId!, data)
			if (!res.success) throw new Error(res.message)
			return res.data as HabitType
		},
		onMutate: async (newHabit: any) => {
			await queryClient.cancelQueries({ queryKey: queryKeys.habits.list(userId!) })
			const previousHabits = queryClient.getQueryData<HabitType[]>(queryKeys.habits.list(userId!))
			const tempHabit = { ...newHabit, id: Math.random().toString(36).substring(7) }
			queryClient.setQueryData<HabitType[]>(queryKeys.habits.list(userId!), old => [...(old || []), tempHabit])
			return { previousHabits }
		},
		onError: (err, newHabit, context) => {
			queryClient.setQueryData(queryKeys.habits.list(userId!), context?.previousHabits)
		},
		onSettled: () => {
			queryClient.invalidateQueries({ queryKey: ['habits'] })
		},
	})
}

export function useUpdateHabit() {
	const userId = useAuth(s => s.user?.userId)
	return useMutation({
		mutationFn: async ({ id, data }: { id: string; data: Partial<HabitType> }) => {
			const res = await updateHabitService(userId!, id, data)
			if (!res.success) throw new Error(res.message)
			return res.data as HabitType
		},
		onMutate: async ({ id, data }) => {
			await queryClient.cancelQueries({ queryKey: queryKeys.habits.list(userId!) })
			const previousHabits = queryClient.getQueryData<HabitType[]>(queryKeys.habits.list(userId!))
			queryClient.setQueryData<HabitType[]>(queryKeys.habits.list(userId!), old =>
				old?.map(h => (h.id === id ? { ...h, ...data } : h))
			)
			return { previousHabits }
		},
		onError: (err, variables, context) => {
			queryClient.setQueryData(queryKeys.habits.list(userId!), context?.previousHabits)
		},
		onSettled: () => {
			queryClient.invalidateQueries({ queryKey: ['habits'] })
		},
	})
}

export function useDeleteHabit() {
	const userId = useAuth(s => s.user?.userId)
	return useMutation({
		mutationFn: async (habitId: string) => {
			const res = await deleteHabitService(userId!, habitId)
			if (!res.success) throw new Error(res.message)
			return res.data
		},
		onMutate: async (habitId: string) => {
			await queryClient.cancelQueries({ queryKey: queryKeys.habits.list(userId!) })
			const previousHabits = queryClient.getQueryData<HabitType[]>(queryKeys.habits.list(userId!))
			queryClient.setQueryData<HabitType[]>(queryKeys.habits.list(userId!), old =>
				old?.filter(h => h.id !== habitId)
			)
			return { previousHabits }
		},
		onError: (err, habitId, context) => {
			queryClient.setQueryData(queryKeys.habits.list(userId!), context?.previousHabits)
		},
		onSettled: () => {
			queryClient.invalidateQueries({ queryKey: ['habits'] })
		},
	})
}

export function useLogHabit() {
	const userId = useAuth(s => s.user?.userId)
	return useMutation({
		mutationFn: async ({ habitId, data }: { habitId: string; data: HabitLogType }) => {
			const res = await logHabitService(userId!, habitId, data)
			if (!res.success) throw new Error(res.message || 'Failed to log habit')
			return res.data as Record<string, HabitLogType[]>
		},
		onMutate: async ({ habitId, data }) => {
			await queryClient.cancelQueries({ queryKey: queryKeys.habits.logs(userId!) })
			const previousLogs = queryClient.getQueryData<Record<string, HabitLogType[]>>(
				queryKeys.habits.logs(userId!)
			)

			queryClient.setQueryData<Record<string, HabitLogType[]>>(queryKeys.habits.logs(userId!), old => {
				const newLogs = { ...(old || {}) }
				const habitLogs = [...(newLogs[habitId] || [])]
				const dateKey = data.date.split('T')[0]
				const existingIdx = habitLogs.findIndex(l => l.date.split('T')[0] === dateKey)

				if (existingIdx !== -1) {
					habitLogs[existingIdx] = { ...habitLogs[existingIdx], value: data.value }
				} else {
					habitLogs.push(data)
				}
				newLogs[habitId] = habitLogs
				return newLogs
			})

			return { previousLogs }
		},
		onError: (err, variables, context) => {
			queryClient.setQueryData(queryKeys.habits.logs(userId!), context?.previousLogs)
		},
		onSettled: () => {
			queryClient.invalidateQueries({ queryKey: ['habits'] })
		},
	})
}

export function useLogWeight() {
	const userId = useAuth(s => s.user?.userId)
	return useMutation({
		mutationFn: async (data: { weight: number; date: string }) => {
			const res = await addMeasurementsService(userId!, data)
			if (!res.success) throw new Error(res.message || 'Failed to log weight')
			return res.data
		},
		onMutate: async (data: { weight: number; date: string }) => {
			// Cancel concurrent refetches
			await queryClient.cancelQueries({ queryKey: queryKeys.habits.logs(userId!) })
			await queryClient.cancelQueries({ queryKey: queryKeys.analytics.measurements(userId!) })

			const previousHabitLogs = queryClient.getQueryData<Record<string, HabitLogType[]>>(
				queryKeys.habits.logs(userId!)
			)
			const previousMeasurements = queryClient.getQueryData(queryKeys.analytics.measurements(userId!))

			// 1. Update Habit Logs Cache (find weight habit)
			const habits = queryClient.getQueryData<HabitType[]>(queryKeys.habits.list(userId!)) || []
			const weightHabit = habits.find(h => h.internalMetricId === 'weight')

			if (weightHabit) {
				queryClient.setQueryData<Record<string, HabitLogType[]>>(queryKeys.habits.logs(userId!), old => {
					const newLogs = { ...(old || {}) }
					const habitLogs = [...(newLogs[weightHabit.id] || [])]
					const dateKey = data.date.split('T')[0]
					const existingIdx = habitLogs.findIndex(l => l.date.split('T')[0] === dateKey)

					if (existingIdx !== -1) {
						habitLogs[existingIdx] = { ...habitLogs[existingIdx], value: 1 } // streak is 1
					} else {
						habitLogs.push({ date: data.date, value: 1 })
					}
					newLogs[weightHabit.id] = habitLogs
					return newLogs
				})
			}

			// 2. Update Measurements Cache (minimal – just for the weight habit to see something changed if needed)
			// Actually, addMeasurementsService handles its own cache invalidation in onSettled,
			// but for optimistic update on the graph/dashboard we can update useMeasurementsQuery data here if we had full schema
			// For now, focusing on the weight habit as requested.

			return { previousHabitLogs, previousMeasurements }
		},
		onError: (err, variables, context) => {
			queryClient.setQueryData(queryKeys.habits.logs(userId!), context?.previousHabitLogs)
			queryClient.setQueryData(queryKeys.analytics.measurements(userId!), context?.previousMeasurements)
		},
		onSettled: () => {
			queryClient.invalidateQueries({ queryKey: queryKeys.habits.logs(userId!) })
			queryClient.invalidateQueries({ queryKey: queryKeys.analytics.measurements(userId!) })
		},
	})
}

// ─────────────────────────────────────────────────────
// Cache helpers
// ─────────────────────────────────────────────────────
export function invalidateHabitsCache(userId: string) {
	queryClient.invalidateQueries({ queryKey: queryKeys.habits.list(userId) })
}

export function invalidateHabitLogsCache(userId: string) {
	queryClient.invalidateQueries({ queryKey: queryKeys.habits.logs(userId) })
}
