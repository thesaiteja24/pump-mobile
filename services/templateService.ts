import { TEMPLATES_ENDPOINT, TEMPLATE_ITEM_ENDPOINT } from '@/constants/urls'
import { TemplatePayload } from '@/lib/sync/types'
import { WorkoutTemplate } from '@/stores/template/types'
import { handleApiResponse } from '@/utils/handleApiResponse'
import client from './api'

export async function getAllTemplatesService() {
	try {
		const res = await client.get(TEMPLATES_ENDPOINT)
		return handleApiResponse(res)
	} catch (error: any) {
		const errData = error.response?.data
		throw new Error(errData?.message || error.message || 'Network error')
	}
}

/**
 * Create a new template.
 * Accepts TemplatePayload for queue or Partial<WorkoutTemplate> for direct calls.
 */
export async function createTemplateService(data: TemplatePayload | Partial<WorkoutTemplate>) {
	try {
		const res = await client.post(TEMPLATES_ENDPOINT, data)
		return handleApiResponse(res)
	} catch (error: any) {
		const errData = error.response?.data
		throw new Error(errData?.message || error.message || 'Network error')
	}
}

export async function deleteTemplateService(id: string) {
	try {
		const res = await client.delete(TEMPLATE_ITEM_ENDPOINT(id))
		return handleApiResponse(res)
	} catch (error: any) {
		const errData = error.response?.data
		throw new Error(errData?.message || error.message || 'Network error')
	}
}

/**
 * Update an existing template.
 */
export async function updateTemplateService(id: string, data: TemplatePayload | Partial<WorkoutTemplate>) {
	try {
		const res = await client.put(TEMPLATE_ITEM_ENDPOINT(id), data)
		return handleApiResponse(res)
	} catch (error: any) {
		const errData = error.response?.data
		throw new Error(errData?.message || error.message || 'Network error')
	}
}

export async function getTemplateByShareIdService(shareId: string) {
	try {
		const res = await client.get(`${TEMPLATES_ENDPOINT}/share/${shareId}`)
		return handleApiResponse(res)
	} catch (error: any) {
		const errData = error.response?.data
		throw new Error(errData?.message || error.message || 'Network error')
	}
}
