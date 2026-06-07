import { apiClient, apiRequest } from '@/api/client'
import { habitEndpoints } from '@/config/urls'

import type {
  Habit,
  HabitCreateInput,
  HabitLog,
  HabitLogUpsertInput,
  HabitReminder,
  HabitReminderCreateInput,
  HabitReminderUpdateInput,
  HabitStats,
  HabitTodayItem,
  HabitUpdateInput,
} from '@/types/habit'

export async function getHabitsApi(): Promise<Habit[]> {
  return apiRequest<Habit[]>(() =>
    apiClient.get(habitEndpoints.list),
  )
}

export async function getTodayHabitsApi(): Promise<HabitTodayItem[]> {
  return apiRequest<HabitTodayItem[]>(() =>
    apiClient.get(habitEndpoints.today),
  )
}

export async function getInternalHabitsApi(): Promise<Habit[]> {
  return apiRequest<Habit[]>(() =>
    apiClient.get(habitEndpoints.internal),
  )
}

export async function toggleInternalHabitApi(metric: string, isActive: boolean): Promise<Habit> {
  return apiRequest<Habit>(() =>
    apiClient.patch(habitEndpoints.toggleInternal(metric), { isActive }),
  )
}

export async function createHabitApi(data: HabitCreateInput): Promise<Habit> {
  return apiRequest<Habit>(() =>
    apiClient.post(habitEndpoints.list, data),
  )
}

export async function getHabitApi(habitId: string): Promise<Habit> {
  return apiRequest<Habit>(() =>
    apiClient.get(habitEndpoints.item(habitId)),
  )
}

export async function updateHabitApi(habitId: string, data: HabitUpdateInput): Promise<Habit> {
  return apiRequest<Habit>(() =>
    apiClient.patch(habitEndpoints.item(habitId), data),
  )
}

export async function archiveHabitApi(habitId: string): Promise<Habit> {
  return apiRequest<Habit>(() =>
    apiClient.delete(habitEndpoints.item(habitId)),
  )
}

export async function getHabitStatsApi(habitId: string): Promise<HabitStats> {
  return apiRequest<HabitStats>(() =>
    apiClient.get(habitEndpoints.stats(habitId)),
  )
}

export async function upsertHabitLogApi(habitId: string, date: string, data: HabitLogUpsertInput): Promise<HabitLog> {
  return apiRequest<HabitLog>(() =>
    apiClient.put(habitEndpoints.log(habitId, date), data),
  )
}

export async function deleteHabitLogApi(habitId: string, date: string): Promise<void> {
  await apiRequest<null>(() =>
    apiClient.delete(habitEndpoints.log(habitId, date)),
  )
}

export async function createHabitReminderApi(habitId: string, data: HabitReminderCreateInput): Promise<HabitReminder> {
  return apiRequest<HabitReminder>(() =>
    apiClient.post(habitEndpoints.reminders(habitId), data),
  )
}

export async function updateHabitReminderApi(
  habitId: string,
  reminderId: string,
  data: HabitReminderUpdateInput,
): Promise<HabitReminder> {
  return apiRequest<HabitReminder>(() =>
    apiClient.patch(habitEndpoints.reminder(habitId, reminderId), data),
  )
}

export async function deleteHabitReminderApi(habitId: string, reminderId: string): Promise<HabitReminder> {
  return apiRequest<HabitReminder>(() =>
    apiClient.delete(habitEndpoints.reminder(habitId, reminderId)),
  )
}
