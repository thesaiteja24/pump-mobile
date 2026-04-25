import { handleApiResponse } from '@/utils/handleApiResponse'
import api from './api'

export const getHabitsService = async (userId: string) => {
  try {
    const res = await api.get(`/habits/${userId}`)
    return handleApiResponse(res)
  } catch (error: any) {
    const errData = error.response?.data
    throw new Error(errData?.message || error.message || 'Network error')
  }
}

export const createHabitService = async (userId: string, data: any) => {
  try {
    const res = await api.post(`/habits/${userId}`, data)
    return handleApiResponse(res)
  } catch (error: any) {
    console.log('Error in createHabitService:', JSON.stringify(error.response.data))
    const errData = error.response?.data
    throw new Error(errData?.message || error.message || 'Network error')
  }
}

export const updateHabitService = async (userId: string, habitId: string, data: any) => {
  try {
    const res = await api.put(`/habits/${userId}/${habitId}`, data)
    return handleApiResponse(res)
  } catch (error: any) {
    const errData = error.response?.data
    throw new Error(errData?.message || error.message || 'Network error')
  }
}

export const deleteHabitService = async (userId: string, habitId: string) => {
  try {
    const res = await api.delete(`/habits/${userId}/${habitId}`)
    return handleApiResponse(res)
  } catch (error: any) {
    const errData = error.response?.data
    throw new Error(errData?.message || error.message || 'Network error')
  }
}

export const logHabitService = async (
  userId: string,
  habitId: string,
  data: { date: string; value: number },
) => {
  try {
    const res = await api.post(`/habits/${userId}/${habitId}/log`, data)
    return handleApiResponse(res)
  } catch (error: any) {
    const errData = error.response?.data
    throw new Error(errData?.message || error.message || 'Network error')
  }
}

export const getHabitLogsService = async (userId: string, startDate?: string, endDate?: string) => {
  try {
    const params = new URLSearchParams()
    if (startDate) params.append('startDate', startDate)
    if (endDate) params.append('endDate', endDate)

    const res = await api.get(`/habits/${userId}/logs?${params.toString()}`)
    return handleApiResponse(res)
  } catch (error: any) {
    const errData = error.response?.data
    throw new Error(errData?.message || error.message || 'Network error')
  }
}
