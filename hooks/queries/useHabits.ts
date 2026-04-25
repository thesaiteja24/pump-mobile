import { queryClient } from '@/lib/queryClient'
import { queryKeys } from '@/lib/queryKeys'
import {
  createHabitService,
  deleteHabitService,
  getHabitLogsService,
  getHabitsService,
  logHabitService,
  updateHabitService,
} from '@/services/habitService'
import { addMeasurementsService } from '@/services/meService'
import { useAuth } from '@/stores/authStore'
import type { HabitLogType, HabitType } from '@/types/habits'
import { useMutation, useQuery } from '@tanstack/react-query'

// ─────────────────────────────────────────────────────
// READ — habits list
// ─────────────────────────────────────────────────────
export function useHabitsQuery() {
  const userId = useAuth((s) => s.userId)

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
    gcTime: 24 * 60 * 60 * 1000,
  })
}

// ─────────────────────────────────────────────────────
// READ — habit logs (for a date range)
// ─────────────────────────────────────────────────────
export function useHabitLogsQuery(startDate?: string, endDate?: string) {
  const userId = useAuth((s) => s.userId)

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
    gcTime: 24 * 60 * 60 * 1000,
  })
}

export function useCreateHabit() {
  const userId = useAuth((s) => s.userId)
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
      queryClient.setQueryData<HabitType[]>(queryKeys.habits.list(userId!), (old) => [
        ...(old || []),
        tempHabit,
      ])
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
  const userId = useAuth((s) => s.userId)
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<HabitType> }) => {
      const res = await updateHabitService(userId!, id, data)
      if (!res.success) throw new Error(res.message)
      return res.data as HabitType
    },
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.habits.list(userId!) })
      const previousHabits = queryClient.getQueryData<HabitType[]>(queryKeys.habits.list(userId!))
      queryClient.setQueryData<HabitType[]>(queryKeys.habits.list(userId!), (old) =>
        old?.map((h) => (h.id === id ? { ...h, ...data } : h)),
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
  const userId = useAuth((s) => s.userId)
  return useMutation({
    mutationFn: async (habitId: string) => {
      const res = await deleteHabitService(userId!, habitId)
      if (!res.success) throw new Error(res.message)
      return res.data
    },
    onMutate: async (habitId: string) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.habits.list(userId!) })
      const previousHabits = queryClient.getQueryData<HabitType[]>(queryKeys.habits.list(userId!))
      queryClient.setQueryData<HabitType[]>(queryKeys.habits.list(userId!), (old) =>
        old?.filter((h) => h.id !== habitId),
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
  const userId = useAuth((s) => s.userId)
  return useMutation({
    mutationFn: async ({ habitId, data }: { habitId: string; data: HabitLogType }) => {
      const res = await logHabitService(userId!, habitId, data)
      if (!res.success) throw new Error(res.message || 'Failed to log habit')
      return res.data as Record<string, HabitLogType[]>
    },
    onMutate: async ({ habitId, data }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.habits.logs(userId!) })
      const previousLogs = queryClient.getQueryData<Record<string, HabitLogType[]>>(
        queryKeys.habits.logs(userId!),
      )

      queryClient.setQueryData<Record<string, HabitLogType[]>>(
        queryKeys.habits.logs(userId!),
        (old) => {
          const newLogs = { ...(old || {}) }
          const habitLogs = [...(newLogs[habitId] || [])]
          const dateKey = data.date.split('T')[0]
          const existingIdx = habitLogs.findIndex((l) => l.date.split('T')[0] === dateKey)

          if (existingIdx !== -1) {
            habitLogs[existingIdx] = { ...habitLogs[existingIdx], value: data.value }
          } else {
            habitLogs.push(data)
          }
          newLogs[habitId] = habitLogs
          return newLogs
        },
      )

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
  const userId = useAuth((s) => s.userId)
  return useMutation({
    mutationFn: async (data: { weight: number; date: string }) => {
      const res = await addMeasurementsService(data)
      return res
    },
    onMutate: async (data: { weight: number; date: string }) => {
      // Cancel concurrent refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.habits.logs(userId!) })
      await queryClient.cancelQueries({ queryKey: queryKeys.me.measurementsRoot })

      const previousHabitLogs = queryClient.getQueryData<Record<string, HabitLogType[]>>(
        queryKeys.habits.logs(userId!),
      )
      const previousMeasurements = queryClient.getQueriesData({
        queryKey: queryKeys.me.measurementsRoot,
      })

      // 1. Update Habit Logs Cache (find weight habit)
      const habits = queryClient.getQueryData<HabitType[]>(queryKeys.habits.list(userId!)) || []
      const weightHabit = habits.find((h) => h.internalMetricId === 'weight')

      if (weightHabit) {
        queryClient.setQueryData<Record<string, HabitLogType[]>>(
          queryKeys.habits.logs(userId!),
          (old) => {
            const newLogs = { ...(old || {}) }
            const habitLogs = [...(newLogs[weightHabit.id] || [])]
            const dateKey = data.date.split('T')[0]
            const existingIdx = habitLogs.findIndex((l) => l.date.split('T')[0] === dateKey)

            if (existingIdx !== -1) {
              habitLogs[existingIdx] = { ...habitLogs[existingIdx], value: 1 } // streak is 1
            } else {
              habitLogs.push({ date: data.date, value: 1 })
            }
            newLogs[weightHabit.id] = habitLogs
            return newLogs
          },
        )
      }

      return { previousHabitLogs, previousMeasurements }
    },
    onError: (err, variables, context) => {
      queryClient.setQueryData(queryKeys.habits.logs(userId!), context?.previousHabitLogs)
      context?.previousMeasurements?.forEach(([queryKey, data]) => {
        queryClient.setQueryData(queryKey, data)
      })
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.habits.logs(userId!) })
      queryClient.invalidateQueries({ queryKey: queryKeys.me.measurementsRoot })
    },
  })
}
