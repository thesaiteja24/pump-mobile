import {
  HABIT_ITEM_ENDPOINT as habit_item_endpoint,
  HABIT_LOG_ENDPOINT as habit_log_endpoint,
  HABIT_LOGS_ENDPOINT as habit_logs_endpoint,
  HABITS_ENDPOINT as habits_endpoint,
} from '@/constants/urls'
import type {
  CreateHabitPayload,
  HabitLogType,
  HabitType,
  UpdateHabitPayload,
} from '@/types/habits'
import { handleApiResponse } from '@/utils/handleApiResponse'
import client from './api'

export async function getHabitsService(userId: string): Promise<HabitType[]> {
  try {
    const res = await client.get(habits_endpoint(userId))
    const handled = handleApiResponse<HabitType[]>(res)
    if (!handled.success) throw new Error(handled.message || 'Request failed')
    return handled.data ?? []
  } catch (error: any) {
    const errData = error.response?.data
    throw new Error(errData?.message || error.message || 'Network error')
  }
}

export async function createHabitService(
  userId: string,
  data: CreateHabitPayload,
): Promise<HabitType> {
  try {
    const res = await client.post(habits_endpoint(userId), data)
    const handled = handleApiResponse<HabitType>(res)
    if (!handled.success) throw new Error(handled.message || 'Request failed')
    return handled.data!
  } catch (error: any) {
    const errData = error.response?.data
    throw new Error(errData?.message || error.message || 'Network error')
  }
}

export async function updateHabitService(
  userId: string,
  habitId: string,
  data: UpdateHabitPayload,
): Promise<HabitType> {
  try {
    const res = await client.put(habit_item_endpoint(userId, habitId), data)
    const handled = handleApiResponse<HabitType>(res)
    if (!handled.success) throw new Error(handled.message || 'Request failed')
    return handled.data!
  } catch (error: any) {
    const errData = error.response?.data
    throw new Error(errData?.message || error.message || 'Network error')
  }
}

export async function deleteHabitService(userId: string, habitId: string): Promise<void> {
  try {
    const res = await client.delete(habit_item_endpoint(userId, habitId))
    const handled = handleApiResponse<void>(res)
    if (!handled.success) throw new Error(handled.message || 'Request failed')
  } catch (error: any) {
    const errData = error.response?.data
    throw new Error(errData?.message || error.message || 'Network error')
  }
}

export async function logHabitService(
  userId: string,
  habitId: string,
  data: { date: string; value: number },
): Promise<Record<string, HabitLogType[]>> {
  try {
    const res = await client.post(habit_log_endpoint(userId, habitId), data)
    const handled = handleApiResponse<Record<string, HabitLogType[]>>(res)
    if (!handled.success) throw new Error(handled.message || 'Request failed')
    return handled.data!
  } catch (error: any) {
    const errData = error.response?.data
    throw new Error(errData?.message || error.message || 'Network error')
  }
}

export async function getHabitLogsService(
  userId: string,
  startDate?: string,
  endDate?: string,
): Promise<Record<string, HabitLogType[]>> {
  try {
    const params = new URLSearchParams()
    if (startDate) params.append('startDate', startDate)
    if (endDate) params.append('endDate', endDate)

    const res = await client.get(`${habit_logs_endpoint(userId)}?${params.toString()}`)
    const handled = handleApiResponse<Record<string, HabitLogType[]>>(res)
    if (!handled.success) throw new Error(handled.message || 'Request failed')
    return handled.data ?? {}
  } catch (error: any) {
    const errData = error.response?.data
    throw new Error(errData?.message || error.message || 'Network error')
  }
}
