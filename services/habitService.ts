import type {
  CreateHabitPayload,
  HabitLogType,
  HabitType,
  UpdateHabitPayload,
} from '@/types/habits'
import { handleApiResponse } from '@/utils/handleApiResponse'
import api from './api'

export const getHabitsService = async (userId: string): Promise<HabitType[]> => {
  try {
    const res = await api.get(`/habits/${userId}`)
    const handled = handleApiResponse(res)
    if (!handled.success) throw new Error(handled.message || 'Request failed')
    return handled.data ?? []
  } catch (error: any) {
    const errData = error.response?.data
    throw new Error(errData?.message || error.message || 'Network error')
  }
}

export const createHabitService = async (
  userId: string,
  data: CreateHabitPayload,
): Promise<HabitType> => {
  try {
    const res = await api.post(`/habits/${userId}`, data)
    const handled = handleApiResponse(res)
    if (!handled.success) throw new Error(handled.message || 'Request failed')
    return handled.data
  } catch (error: any) {
    console.log('Error in createHabitService:', JSON.stringify(error.response?.data))
    const errData = error.response?.data
    throw new Error(errData?.message || error.message || 'Network error')
  }
}

export const updateHabitService = async (
  userId: string,
  habitId: string,
  data: UpdateHabitPayload,
): Promise<HabitType> => {
  try {
    const res = await api.put(`/habits/${userId}/${habitId}`, data)
    const handled = handleApiResponse(res)
    if (!handled.success) throw new Error(handled.message || 'Request failed')
    return handled.data
  } catch (error: any) {
    const errData = error.response?.data
    throw new Error(errData?.message || error.message || 'Network error')
  }
}

export const deleteHabitService = async (userId: string, habitId: string): Promise<void> => {
  try {
    const res = await api.delete(`/habits/${userId}/${habitId}`)
    const handled = handleApiResponse(res)
    if (!handled.success) throw new Error(handled.message || 'Request failed')
  } catch (error: any) {
    const errData = error.response?.data
    throw new Error(errData?.message || error.message || 'Network error')
  }
}

export const logHabitService = async (
  userId: string,
  habitId: string,
  data: { date: string; value: number },
): Promise<Record<string, HabitLogType[]>> => {
  try {
    const res = await api.post(`/habits/${userId}/${habitId}/log`, data)
    const handled = handleApiResponse(res)
    if (!handled.success) throw new Error(handled.message || 'Request failed')
    return handled.data
  } catch (error: any) {
    const errData = error.response?.data
    throw new Error(errData?.message || error.message || 'Network error')
  }
}

export const getHabitLogsService = async (
  userId: string,
  startDate?: string,
  endDate?: string,
): Promise<Record<string, HabitLogType[]>> => {
  try {
    const params = new URLSearchParams()
    if (startDate) params.append('startDate', startDate)
    if (endDate) params.append('endDate', endDate)

    const res = await api.get(`/habits/${userId}/logs?${params.toString()}`)
    const handled = handleApiResponse(res)
    if (!handled.success) throw new Error(handled.message || 'Request failed')
    return handled.data ?? {}
  } catch (error: any) {
    const errData = error.response?.data
    throw new Error(errData?.message || error.message || 'Network error')
  }
}
