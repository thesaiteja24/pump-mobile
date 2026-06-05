import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import {
  archiveHabitApi,
  createHabitApi,
  createHabitReminderApi,
  deleteHabitLogApi,
  deleteHabitReminderApi,
  getHabitApi,
  getHabitsApi,
  getHabitStatsApi,
  getTodayHabitsApi,
  updateHabitApi,
  updateHabitReminderApi,
  upsertHabitLogApi,
} from '@/api/habits'
import { queryKeys } from '@/api/query-keys'

import type {
  Habit,
  HabitLogUpsertInput,
  HabitReminderCreateInput,
  HabitReminderUpdateInput,
  HabitStats,
  HabitTodayItem,
  HabitUpdateInput,
} from '@/types/habit'
import type { UseQueryResult } from '@tanstack/react-query'

export function useHabitsQuery(): UseQueryResult<Habit[], Error> {
  return useQuery<Habit[]>({
    queryKey: queryKeys.habits.list(),
    queryFn: getHabitsApi,
    networkMode: 'offlineFirst',
  })
}

export function useTodayHabitsQuery(): UseQueryResult<HabitTodayItem[], Error> {
  return useQuery<HabitTodayItem[]>({
    queryKey: queryKeys.habits.today(),
    queryFn: getTodayHabitsApi,
    networkMode: 'offlineFirst',
  })
}

export function useHabitQuery(habitId: string): UseQueryResult<Habit, Error> {
  return useQuery<Habit>({
    queryKey: queryKeys.habits.detail(habitId),
    queryFn: () => getHabitApi(habitId),
    enabled: !!habitId,
    networkMode: 'offlineFirst',
  })
}

export function useHabitStatsQuery(habitId: string): UseQueryResult<HabitStats, Error> {
  return useQuery<HabitStats>({
    queryKey: queryKeys.habits.stats(habitId),
    queryFn: () => getHabitStatsApi(habitId),
    enabled: !!habitId,
    networkMode: 'offlineFirst',
  })
}

function invalidateHabitCollections(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries({ queryKey: queryKeys.habits.lists() })
  queryClient.invalidateQueries({ queryKey: queryKeys.habits.today() })
}

export function useCreateHabitMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createHabitApi,
    onSuccess: (habit) => {
      queryClient.setQueryData(queryKeys.habits.detail(habit.id), habit)
    },
    onSettled: () => {
      invalidateHabitCollections(queryClient)
    },
  })
}

export function useUpdateHabitMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ habitId, data }: { habitId: string, data: HabitUpdateInput }) =>
      updateHabitApi(habitId, data),
    onSuccess: (habit) => {
      queryClient.setQueryData(queryKeys.habits.detail(habit.id), habit)
    },
    onSettled: (_data, _error, variables) => {
      invalidateHabitCollections(queryClient)
      queryClient.invalidateQueries({ queryKey: queryKeys.habits.detail(variables.habitId) })
      queryClient.invalidateQueries({ queryKey: queryKeys.habits.stats(variables.habitId) })
    },
  })
}

export function useArchiveHabitMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: archiveHabitApi,
    onSuccess: (habit) => {
      queryClient.setQueryData(queryKeys.habits.detail(habit.id), habit)
      queryClient.setQueryData<HabitTodayItem[]>(
        queryKeys.habits.today(),
        items => items?.filter(item => item.id !== habit.id),
      )
    },
    onSettled: (_data, _error, habitId) => {
      invalidateHabitCollections(queryClient)
      queryClient.invalidateQueries({ queryKey: queryKeys.habits.detail(habitId) })
    },
  })
}

function getOptimisticTodayItem(item: HabitTodayItem, data: HabitLogUpsertInput): HabitTodayItem {
  if (item.trackingType === 'binary' && data.completed !== undefined) {
    return { ...item, completed: data.completed, todayValue: null }
  }

  if (data.value !== undefined) {
    const completed = item.targetPeriod === 'daily' && item.targetValue !== null
      ? data.value >= item.targetValue
      : item.completed

    return { ...item, todayValue: data.value, completed }
  }

  return item
}

export function useUpsertHabitLogMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ habitId, date, data }: { habitId: string, date: string, data: HabitLogUpsertInput }) =>
      upsertHabitLogApi(habitId, date, data),
    onMutate: async ({ habitId, data }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.habits.today() })
      const previousToday = queryClient.getQueryData<HabitTodayItem[]>(queryKeys.habits.today())

      queryClient.setQueryData<HabitTodayItem[]>(
        queryKeys.habits.today(),
        items => items?.map(item => item.id === habitId ? getOptimisticTodayItem(item, data) : item),
      )

      return { previousToday }
    },
    onError: (_error, _variables, context) => {
      if (context?.previousToday) {
        queryClient.setQueryData(queryKeys.habits.today(), context.previousToday)
      }
    },
    onSettled: (_data, _error, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.habits.today() })
      queryClient.invalidateQueries({ queryKey: queryKeys.habits.stats(variables.habitId) })
    },
  })
}

export function useDeleteHabitLogMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ habitId, date }: { habitId: string, date: string }) =>
      deleteHabitLogApi(habitId, date),
    onSettled: (_data, _error, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.habits.today() })
      queryClient.invalidateQueries({ queryKey: queryKeys.habits.stats(variables.habitId) })
    },
  })
}

export function useCreateHabitReminderMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ habitId, data }: { habitId: string, data: HabitReminderCreateInput }) =>
      createHabitReminderApi(habitId, data),
    onSettled: (_data, _error, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.habits.detail(variables.habitId) })
    },
  })
}

export function useUpdateHabitReminderMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ habitId, reminderId, data }: { habitId: string, reminderId: string, data: HabitReminderUpdateInput }) =>
      updateHabitReminderApi(habitId, reminderId, data),
    onSettled: (_data, _error, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.habits.detail(variables.habitId) })
    },
  })
}

export function useDeleteHabitReminderMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ habitId, reminderId }: { habitId: string, reminderId: string }) =>
      deleteHabitReminderApi(habitId, reminderId),
    onSettled: (_data, _error, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.habits.detail(variables.habitId) })
    },
  })
}
