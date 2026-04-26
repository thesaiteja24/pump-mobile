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
import type {
  CreateHabitPayload,
  HabitLogType,
  HabitType,
  UpdateHabitPayload,
} from '@/types/habits'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

export function useHabitsQuery() {
  const userId = useAuth((s) => s.userId)

  return useQuery<HabitType[]>({
    queryKey: queryKeys.habits.all(userId ?? ''),
    queryFn: () => getHabitsService(userId!),
    enabled: Boolean(userId),
    staleTime: 24 * 60 * 60 * 1000,
    gcTime: 24 * 60 * 60 * 1000,
  })
}

export function useHabitLogsQuery(startDate?: string, endDate?: string) {
  const userId = useAuth((s) => s.userId)

  return useQuery<Record<string, HabitLogType[]>>({
    queryKey: queryKeys.habits.logs(userId ?? '', startDate, endDate),
    queryFn: () => getHabitLogsService(userId!, startDate, endDate),
    enabled: Boolean(userId),
    staleTime: 24 * 60 * 60 * 1000,
    gcTime: 24 * 60 * 60 * 1000,
  })
}

export function useCreateHabit() {
  const queryClient = useQueryClient()
  const userId = useAuth((s) => s.userId)

  return useMutation({
    mutationFn: (data: CreateHabitPayload) => createHabitService(userId!, data),
    onMutate: async (newHabit) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.habits.all(userId!) })
      const previousHabits = queryClient.getQueryData<HabitType[]>(queryKeys.habits.all(userId!))

      if (previousHabits) {
        const tempHabit = {
          ...newHabit,
          id: `temp-${Math.random().toString(36).substring(7)}`,
        } as HabitType
        queryClient.setQueryData<HabitType[]>(queryKeys.habits.all(userId!), (old) => [
          ...(old || []),
          tempHabit,
        ])
      }

      return { previousHabits }
    },
    onError: (_err, _variables, context) => {
      if (context?.previousHabits) {
        queryClient.setQueryData(queryKeys.habits.all(userId!), context.previousHabits)
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.habits.all(userId!) })
    },
  })
}

export function useUpdateHabit() {
  const queryClient = useQueryClient()
  const userId = useAuth((s) => s.userId)

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateHabitPayload }) =>
      updateHabitService(userId!, id, data),
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.habits.all(userId!) })
      const previousHabits = queryClient.getQueryData<HabitType[]>(queryKeys.habits.all(userId!))

      if (previousHabits) {
        queryClient.setQueryData<HabitType[]>(queryKeys.habits.all(userId!), (old) =>
          old?.map((h) => (h.id === id ? { ...h, ...data } : h)),
        )
      }

      return { previousHabits }
    },
    onError: (_err, _variables, context) => {
      if (context?.previousHabits) {
        queryClient.setQueryData(queryKeys.habits.all(userId!), context.previousHabits)
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.habits.all(userId!) })
    },
  })
}

export function useDeleteHabit() {
  const queryClient = useQueryClient()
  const userId = useAuth((s) => s.userId)

  return useMutation({
    mutationFn: (habitId: string) => deleteHabitService(userId!, habitId),
    onMutate: async (habitId) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.habits.all(userId!) })
      const previousHabits = queryClient.getQueryData<HabitType[]>(queryKeys.habits.all(userId!))

      if (previousHabits) {
        queryClient.setQueryData<HabitType[]>(queryKeys.habits.all(userId!), (old) =>
          old?.filter((h) => h.id !== habitId),
        )
      }

      return { previousHabits }
    },
    onError: (_err, _variables, context) => {
      if (context?.previousHabits) {
        queryClient.setQueryData(queryKeys.habits.all(userId!), context.previousHabits)
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.habits.all(userId!) })
    },
  })
}

export function useLogHabit() {
  const queryClient = useQueryClient()
  const userId = useAuth((s) => s.userId)

  return useMutation({
    mutationFn: ({ habitId, data }: { habitId: string; data: HabitLogType }) =>
      logHabitService(userId!, habitId, data),
    onMutate: async ({ habitId, data }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.habits.logsRoot })
      const previousLogs = queryClient.getQueriesData<Record<string, HabitLogType[]>>({
        queryKey: queryKeys.habits.logsRoot,
      })

      previousLogs.forEach(([queryKey]) => {
        queryClient.setQueryData<Record<string, HabitLogType[]>>(queryKey, (old) => {
          if (!old) return old
          const newLogs = { ...old }
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
        })
      })

      return { previousLogs }
    },
    onError: (_err, _variables, context) => {
      context?.previousLogs?.forEach(([queryKey, data]) => {
        queryClient.setQueryData(queryKey, data)
      })
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.habits.logsRoot })
    },
  })
}

export function useLogWeight() {
  const queryClient = useQueryClient()
  const userId = useAuth((s) => s.userId)

  return useMutation({
    mutationFn: (data: { weight: number; date: string }) => addMeasurementsService(data),
    onMutate: async (data) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.habits.logsRoot })
      await queryClient.cancelQueries({ queryKey: queryKeys.me.measurementsRoot })

      const previousHabitLogs = queryClient.getQueriesData<Record<string, HabitLogType[]>>({
        queryKey: queryKeys.habits.logsRoot,
      })
      const previousMeasurements = queryClient.getQueriesData({
        queryKey: queryKeys.me.measurementsRoot,
      })

      // Update Habit Logs Cache (find weight habit)
      const habits = queryClient.getQueryData<HabitType[]>(queryKeys.habits.all(userId!)) || []
      const weightHabit = habits.find((h) => h.internalMetricId === 'weight')

      if (weightHabit) {
        previousHabitLogs.forEach(([queryKey]) => {
          queryClient.setQueryData<Record<string, HabitLogType[]>>(queryKey, (old) => {
            if (!old) return old
            const newLogs = { ...old }
            const habitLogs = [...(newLogs[weightHabit.id] || [])]
            const dateKey = data.date.split('T')[0]
            const existingIdx = habitLogs.findIndex((l) => l.date.split('T')[0] === dateKey)

            if (existingIdx !== -1) {
              habitLogs[existingIdx] = { ...habitLogs[existingIdx], value: 1 }
            } else {
              habitLogs.push({ date: data.date, value: 1 })
            }
            newLogs[weightHabit.id] = habitLogs
            return newLogs
          })
        })
      }

      return { previousHabitLogs, previousMeasurements }
    },
    onError: (_err, _variables, context) => {
      context?.previousHabitLogs?.forEach(([queryKey, data]) => {
        queryClient.setQueryData(queryKey, data)
      })
      context?.previousMeasurements?.forEach(([queryKey, data]) => {
        queryClient.setQueryData(queryKey, data)
      })
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.habits.logsRoot })
      queryClient.invalidateQueries({ queryKey: queryKeys.me.measurementsRoot })
    },
  })
}
