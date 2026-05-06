import { TEMPLATES_ENDPOINT, TEMPLATE_ITEM_ENDPOINT } from '@/constants/urls'
import { TemplatePayload } from '@/types/payloads'
import { WorkoutTemplate } from '@/types/templates'
import { handleApiResponse } from '@/utils/handleApiResponse'
import client from './api'

export async function getAllTemplatesService(): Promise<WorkoutTemplate[]> {
  try {
    const res = await client.get(TEMPLATES_ENDPOINT)
    const handled = handleApiResponse<WorkoutTemplate[]>(res)
    if (!handled.success) throw new Error(handled.message || 'Request failed')
    return handled.data ?? []
  } catch (error: any) {
    const errData = error.response?.data
    throw new Error(errData?.message || error.message || 'Network error')
  }
}

export async function getTemplateByIdService(id: string): Promise<WorkoutTemplate> {
  try {
    const res = await client.get(TEMPLATE_ITEM_ENDPOINT(id))
    const handled = handleApiResponse<WorkoutTemplate>(res)
    if (!handled.success) throw new Error(handled.message || 'Request failed')
    return handled.data!
  } catch (error: any) {
    const errData = error.response?.data
    throw new Error(errData?.message || error.message || 'Network error')
  }
}

/**
 * Create a new template.
 * Accepts TemplatePayload for queue or Partial<WorkoutTemplate> for direct calls.
 */
export async function createTemplateService(
  data: TemplatePayload | Partial<WorkoutTemplate>,
): Promise<WorkoutTemplate> {
  try {
    const res = await client.post(TEMPLATES_ENDPOINT, data)
    const handled = handleApiResponse<WorkoutTemplate>(res)
    if (!handled.success) throw new Error(handled.message || 'Request failed')
    return handled.data!
  } catch (error: any) {
    const errData = error.response?.data
    throw new Error(errData?.message || error.message || 'Network error')
  }
}

export async function deleteTemplateService(id: string): Promise<void> {
  try {
    const res = await client.delete(TEMPLATE_ITEM_ENDPOINT(id))
    const handled = handleApiResponse<void>(res)
    if (!handled.success) throw new Error(handled.message || 'Request failed')
  } catch (error: any) {
    const errData = error.response?.data
    throw new Error(errData?.message || error.message || 'Network error')
  }
}

/**
 * Update an existing template.
 */
export async function updateTemplateService(
  id: string,
  data: TemplatePayload | Partial<WorkoutTemplate>,
): Promise<WorkoutTemplate> {
  try {
    const res = await client.put(TEMPLATE_ITEM_ENDPOINT(id), data)
    const handled = handleApiResponse<WorkoutTemplate>(res)
    if (!handled.success) throw new Error(handled.message || 'Request failed')
    return handled.data!
  } catch (error: any) {
    const errData = error.response?.data
    throw new Error(errData?.message || error.message || 'Network error')
  }
}

export async function getTemplateByShareIdService(shareId: string): Promise<WorkoutTemplate> {
  try {
    const res = await client.get(`${TEMPLATES_ENDPOINT}/share/${shareId}`)
    const handled = handleApiResponse<WorkoutTemplate>(res)
    if (!handled.success) throw new Error(handled.message || 'Request failed')
    return handled.data!
  } catch (error: any) {
    const errData = error.response?.data
    throw new Error(errData?.message || error.message || 'Network error')
  }
}
