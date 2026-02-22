import {
	DISCOVER_WORKOUTS_ENDPOINT as discover_workouts_endpoint,
	WORKOUT_ITEM_ENDPOINT as workout_item_endpoint,
	WORKOUTS_ENDPOINT as workouts_endpoint,
} from '@/constants/urls'
import { WorkoutPayload } from '@/lib/sync/types'
import { handleApiResponse } from '@/utils/handleApiResponse'
import client from './api'

export async function getAllWorkoutsService() {
	try {
		const res = await client.get(workouts_endpoint)

		return handleApiResponse(res)
	} catch (error: any) {
		const errData = error.response?.data
		throw new Error(errData?.message || error.message || 'Network error')
	}
}

export async function getDiscoverWorkoutsService() {
	try {
		const res = await client.get(discover_workouts_endpoint)

		return handleApiResponse(res)
	} catch (error: any) {
		const errData = error.response?.data
		throw new Error(errData?.message || error.message || 'Network error')
	}
}

/**
 * Create a new workout.
 * Accepts serialized workout payload with clientId for idempotency.
 */
export async function createWorkoutService(data: WorkoutPayload) {
	try {
		const res = await client.post(workouts_endpoint, data)

		return handleApiResponse(res)
	} catch (error: any) {
		const errData = error.response?.data
		throw new Error(errData?.message || error.message || 'Network error')
	}
}

/**
 * Update an existing workout by ID.
 */
export async function updateWorkoutService(id: string, data: WorkoutPayload) {
	try {
		const res = await client.put(workout_item_endpoint(id), data)

		return handleApiResponse(res)
	} catch (error: any) {
		const errData = error.response?.data
		throw new Error(errData?.message || error.message || 'Network error')
	}
}

export async function deleteWorkoutService(id: string) {
	try {
		const res = await client.delete(workout_item_endpoint(id))

		return handleApiResponse(res)
	} catch (error: any) {
		const errData = error.response?.data
		throw new Error(errData?.message || error.message || 'Network error')
	}
}
