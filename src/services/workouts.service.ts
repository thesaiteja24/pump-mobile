import {
  DISCOVER_WORKOUTS_ENDPOINT as discover_workouts_endpoint,
  WORKOUT_ITEM_ENDPOINT as workout_item_endpoint,
  WORKOUT_SHARE_ENDPOINT as workout_share_endpoint,
  WORKOUTS_ENDPOINT as workouts_endpoint,
} from '@/constants/urls'
import { WorkoutPayload } from '@/types/payloads'
import { WorkoutHistoryItem, WorkoutsPaginatedResponse } from '@/types/workouts'
import { handleApiResponse } from '@/utils/handleApiResponse'
import client from './api'

export async function getWorkoutByShareIdService(shareId: string): Promise<WorkoutHistoryItem> {
  try {
    const res = await client.get(workout_share_endpoint(shareId))
    const handled = handleApiResponse<WorkoutHistoryItem>(res)
    if (!handled.success) throw new Error(handled.message || 'Request failed')
    return handled.data!
  } catch (error: any) {
    const errData = error.response?.data
    throw new Error(errData?.message || error.message || 'Network error')
  }
}

export async function getUserWorkoutsService(
  page: number = 1,
  limit: number = 2,
): Promise<WorkoutsPaginatedResponse> {
  try {
    const res = await client.get(workouts_endpoint, { params: { page, limit } })
    const handled = handleApiResponse<WorkoutsPaginatedResponse>(res)
    if (!handled.success) throw new Error(handled.message || 'Request failed')
    return handled.data!
  } catch (error: any) {
    const errData = error.response?.data
    throw new Error(errData?.message || error.message || 'Network error')
  }
}

export async function getWorkoutByIdService(id: string): Promise<WorkoutHistoryItem> {
  try {
    const res = await client.get(workout_item_endpoint(id))
    const handled = handleApiResponse<WorkoutHistoryItem>(res)
    if (!handled.success) throw new Error(handled.message || 'Request failed')
    return handled.data!
  } catch (error: any) {
    const errData = error.response?.data
    throw new Error(errData?.message || error.message || 'Network error')
  }
}

export async function getDiscoverWorkoutsService(
  page: number = 1,
  limit: number = 2,
): Promise<WorkoutsPaginatedResponse> {
  try {
    const res = await client.get(discover_workouts_endpoint, { params: { page, limit } })
    const handled = handleApiResponse<WorkoutsPaginatedResponse>(res)
    if (!handled.success) throw new Error(handled.message || 'Request failed')
    return handled.data!
  } catch (error: any) {
    const errData = error.response?.data
    throw new Error(errData?.message || error.message || 'Network error')
  }
}

/**
 * Create a new workout.
 * Accepts serialized workout payload with clientId for idempotency.
 */
export async function createWorkoutService(data: WorkoutPayload): Promise<WorkoutHistoryItem> {
  try {
    const res = await client.post(workouts_endpoint, data)
    const handled = handleApiResponse<WorkoutHistoryItem>(res)
    if (!handled.success) throw new Error(handled.message || 'Request failed')
    return handled.data!
  } catch (error: any) {
    const errData = error.response?.data
    throw new Error(errData?.message || error.message || 'Network error')
  }
}

/**
 * Update an existing workout by ID.
 */
export async function updateWorkoutService(
  id: string,
  data: WorkoutPayload,
): Promise<WorkoutHistoryItem> {
  try {
    const res = await client.put(workout_item_endpoint(id), data)
    const handled = handleApiResponse<WorkoutHistoryItem>(res)
    if (!handled.success) throw new Error(handled.message || 'Request failed')
    return handled.data!
  } catch (error: any) {
    const errData = error.response?.data
    throw new Error(errData?.message || error.message || 'Network error')
  }
}

export async function deleteWorkoutService(id: string): Promise<void> {
  try {
    const res = await client.delete(workout_item_endpoint(id))
    const handled = handleApiResponse<void>(res)
    if (!handled.success) throw new Error(handled.message || 'Request failed')
  } catch (error: any) {
    const errData = error.response?.data
    throw new Error(errData?.message || error.message || 'Network error')
  }
}
