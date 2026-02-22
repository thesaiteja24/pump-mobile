import { EXERCISE_ITEM_ENDPOINT as exercise_item_endpoint, EXERCISES_ENDPOINT as exercises_url } from '@/constants/urls'
import { handleApiResponse } from '@/utils/handleApiResponse'
import client from './api'

export async function getAllExercisesService() {
	try {
		const res = await client.get(exercises_url)

		return handleApiResponse(res)
	} catch (error: any) {
		const errData = error.response?.data
		throw new Error(errData?.message || error.message || 'Network error')
	}
}

export async function getExerciseByIdService(id: string) {
	try {
		const res = await client.get(exercise_item_endpoint(id))

		return handleApiResponse(res)
	} catch (error: any) {
		const errData = error.response?.data
		throw new Error(errData?.message || error.message || 'Network error')
	}
}

export async function createExerciseService(data: FormData) {
	try {
		const res = await client.post(exercises_url, data, {
			headers: { 'Content-Type': 'multipart/form-data' },
		})

		return handleApiResponse(res)
	} catch (error: any) {
		const errData = error.response?.data
		throw new Error(errData?.message || error.message || 'Network error')
	}
}

export async function updateExerciseService(id: string, data: FormData) {
	try {
		const res = await client.put(exercise_item_endpoint(id), data, {
			headers: { 'Content-Type': 'multipart/form-data' },
		})

		return handleApiResponse(res)
	} catch (error: any) {
		const errData = error.response?.data
		throw new Error(errData?.message || error.message || 'Network error')
	}
}

export async function deleteExerciseService(id: string) {
	try {
		const res = await client.delete(exercise_item_endpoint(id))

		return handleApiResponse(res)
	} catch (error: any) {
		const errData = error.response?.data
		throw new Error(errData?.message || error.message || 'Network error')
	}
}
