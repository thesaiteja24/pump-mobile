import { EXERCISE_ITEM_ENDPOINT as exercise_item_endpoint, EXERCISES_ENDPOINT as exercises_url } from '@/constants/urls'
import { Exercise } from '@/types/exercises'
import { handleApiResponse } from '@/utils/handleApiResponse'
import client from './api'

export async function getAllExercisesService(): Promise<Exercise[]> {
	try {
		const res = await client.get(exercises_url)
		const handled = handleApiResponse(res)
		if (!handled.success) throw new Error(handled.message || 'Request failed')
		return handled.data ?? []
	} catch (error: any) {
		const errData = error.response?.data
		throw new Error(errData?.message || error.message || 'Network error')
	}
}

export async function getExerciseByIdService(id: string): Promise<Exercise | null> {
	try {
		const res = await client.get(exercise_item_endpoint(id))
		const handled = handleApiResponse(res)
		if (!handled.success) throw new Error(handled.message || 'Request failed')
		return handled.data ?? null
	} catch (error: any) {
		const errData = error.response?.data
		throw new Error(errData?.message || error.message || 'Network error')
	}
}

export async function createExerciseService(data: FormData): Promise<Exercise> {
	try {
		const res = await client.post(exercises_url, data, {
			headers: { 'Content-Type': 'multipart/form-data' },
		})
		const handled = handleApiResponse(res)
		if (!handled.success) throw new Error(handled.message || 'Request failed')
		return handled.data
	} catch (error: any) {
		const errData = error.response?.data
		throw new Error(errData?.message || error.message || 'Network error')
	}
}

export async function updateExerciseService(id: string, data: FormData): Promise<Exercise> {
	try {
		const res = await client.put(exercise_item_endpoint(id), data, {
			headers: { 'Content-Type': 'multipart/form-data' },
		})
		const handled = handleApiResponse(res)
		if (!handled.success) throw new Error(handled.message || 'Request failed')
		return handled.data
	} catch (error: any) {
		const errData = error.response?.data
		throw new Error(errData?.message || error.message || 'Network error')
	}
}

export async function deleteExerciseService(id: string): Promise<void> {
	try {
		const res = await client.delete(exercise_item_endpoint(id))
		const handled = handleApiResponse(res)
		if (!handled.success) throw new Error(handled.message || 'Request failed')
	} catch (error: any) {
		const errData = error.response?.data
		throw new Error(errData?.message || error.message || 'Network error')
	}
}
