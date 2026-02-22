import {
	EQUIPMENT_ENDPOINT as equipment_endpoint,
	EQUIPMENT_ITEM_ENDPOINT as equipment_item_endpoint,
} from '@/constants/urls'
import { handleApiResponse } from '@/utils/handleApiResponse'
import client from './api'

export async function getAllEquipmentService() {
	try {
		const res = await client.get(equipment_endpoint)

		return handleApiResponse(res)
	} catch (error: any) {
		const errData = error.response?.data
		throw new Error(errData?.message || error.message || 'Network error')
	}
}

export async function getEquipmentByIdService(id: string) {
	try {
		const res = await client.get(equipment_item_endpoint(id))

		return handleApiResponse(res)
	} catch (error: any) {
		const errData = error.response?.data
		throw new Error(errData?.message || error.message || 'Network error')
	}
}

export async function createEquipmentService(data: FormData) {
	try {
		const res = await client.post(equipment_endpoint, data, {
			headers: { 'Content-Type': 'multipart/form-data' },
		})

		return handleApiResponse(res)
	} catch (error: any) {
		const errData = error.response?.data
		throw new Error(errData?.message || error.message || 'Network error')
	}
}

export async function updateEquipmentService(id: string, data: FormData) {
	try {
		const res = await client.put(equipment_item_endpoint(id), data, {
			headers: { 'Content-Type': 'multipart/form-data' },
		})

		return handleApiResponse(res)
	} catch (error: any) {
		const errData = error.response?.data
		throw new Error(errData?.message || error.message || 'Network error')
	}
}

export async function deleteEquipmentService(id: string) {
	try {
		const res = await client.delete(equipment_item_endpoint(id))

		return handleApiResponse(res)
	} catch (error: any) {
		const errData = error.response?.data
		throw new Error(errData?.message || error.message || 'Network error')
	}
}
