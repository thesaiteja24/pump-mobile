import {
	MUSCLE_GROUP_ITEM_ENDPOINT as muscle_group_item_endpoint,
	MUSCLE_GROUPS_ENDPOINT as muscle_groups_endpoint,
} from '@/constants/urls'
import { handleApiResponse } from '@/utils/handleApiResponse'
import client from './api'

export async function getAllMuscleGroupsService() {
	try {
		const res = await client.get(muscle_groups_endpoint)

		return handleApiResponse(res)
	} catch (error: any) {
		const errData = error.response?.data
		throw new Error(errData?.message || error.message || 'Network error')
	}
}

export async function getMuscleGroupByIdService(id: string) {
	try {
		const res = await client.get(muscle_group_item_endpoint(id))

		return handleApiResponse(res)
	} catch (error: any) {
		const errData = error.response?.data
		throw new Error(errData?.message || error.message || 'Network error')
	}
}

export async function createMuscleGroupService(data: FormData) {
	try {
		const res = await client.post(muscle_groups_endpoint, data, {
			headers: { 'Content-Type': 'multipart/form-data' },
		})

		return handleApiResponse(res)
	} catch (error: any) {
		const errData = error.response?.data
		throw new Error(errData?.message || error.message || 'Network error')
	}
}

export async function updateMuscleGroupService(id: string, data: FormData) {
	try {
		const res = await client.put(muscle_group_item_endpoint(id), data, {
			headers: { 'Content-Type': 'multipart/form-data' },
		})

		return handleApiResponse(res)
	} catch (error: any) {
		const errData = error.response?.data
		throw new Error(errData?.message || error.message || 'Network error')
	}
}

export async function deleteMuscleGroupService(id: string) {
	try {
		const res = await client.delete(muscle_group_item_endpoint(id))

		return handleApiResponse(res)
	} catch (error: any) {
		const errData = error.response?.data
		throw new Error(errData?.message || error.message || 'Network error')
	}
}
