import {
  USER_NUDGE_ENDPOINT as user_nudge_endpoint,
  USER_TOP_LIFTS_ENDPOINT as user_top_lifts_endpoint,
  USER_TRAINING_ANALYTICS_ENDPOINT as user_training_analytics_endpoint,
} from '@/constants/urls'
import { TopLift, TrainingAnalytics } from '@/types/me'
import { handleApiResponse } from '@/utils/handleApiResponse'

import client from './api'

export async function nudgeUserService(id: string, note?: string): Promise<void> {
  try {
    const res = await client.post(user_nudge_endpoint(id), { note })
    const handled = handleApiResponse<void>(res)
    if (!handled.success) throw new Error(handled.message || 'Request failed')
    return
  } catch (error: any) {
    const errData = error.response?.data
    throw new Error(errData?.message || error.message || 'Network error')
  }
}

export async function getUserTopLiftsService(
  userId: string,
  limit: number = 5,
): Promise<TopLift[]> {
  try {
    const res = await client.get(user_top_lifts_endpoint(userId, limit))
    const handled = handleApiResponse<TopLift[]>(res)
    if (!handled.success) {
      throw new Error(handled.message || 'Request failed')
    }
    return handled.data!
  } catch (error: any) {
    const errData = error.response?.data
    throw new Error(errData?.message || error.message || 'Network error')
  }
}

export async function getUserTrainingAnalyticsService(
  userId: string,
  duration: string = 'all',
): Promise<TrainingAnalytics> {
  try {
    const res = await client.get(user_training_analytics_endpoint(userId, duration))
    const handled = handleApiResponse<TrainingAnalytics>(res)
    if (!handled.success) {
      throw new Error(handled.message || 'Request failed')
    }
    return handled.data!
  } catch (error: any) {
    const errData = error.response?.data
    throw new Error(errData?.message || error.message || 'Network error')
  }
}
