import { MetaResource } from '@/types/meta'
import { handleApiResponse } from '@/utils/handleApiResponse'
import client from './api'

const getEndpoint = (resource: MetaResource, id?: string) =>
  `/meta/${resource}${id ? `/${id}` : ''}`

export async function getAllMetaService(resource: MetaResource) {
  try {
    const res = await client.get(getEndpoint(resource))
    const handled = handleApiResponse(res)
    if (!handled.success) throw new Error(handled.message || 'Request failed')
    return handled.data
  } catch (error: any) {
    const errData = error.response?.data
    throw new Error(errData?.message || error.message || 'Network error')
  }
}

export async function getMetaByIdService(resource: MetaResource, id: string) {
  try {
    const res = await client.get(getEndpoint(resource, id))
    const handled = handleApiResponse(res)
    if (!handled.success) throw new Error(handled.message || 'Request failed')
    return handled.data
  } catch (error: any) {
    const errData = error.response?.data
    throw new Error(errData?.message || error.message || 'Network error')
  }
}

export async function createMetaService(resource: MetaResource, data: FormData) {
  try {
    const res = await client.post(getEndpoint(resource), data, {
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

export async function updateMetaService(resource: MetaResource, id: string, data: FormData) {
  try {
    const res = await client.put(getEndpoint(resource, id), data, {
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

export async function deleteMetaService(resource: MetaResource, id: string) {
  try {
    const res = await client.delete(getEndpoint(resource, id))
    const handled = handleApiResponse(res)
    if (!handled.success) throw new Error(handled.message || 'Request failed')
    return handled.data
  } catch (error: any) {
    const errData = error.response?.data
    throw new Error(errData?.message || error.message || 'Network error')
  }
}
