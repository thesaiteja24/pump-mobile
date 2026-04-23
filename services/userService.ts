import {
	USER_DATA_ENDPOINT as update_user_data_endpoint,
	USER_ENDPOINT as user_endpoint,
	USER_PROFILE_PIC_ENDPOINT as user_profile_pic_endpoint,
} from '@/constants/urls'
import { UpdateUserBody } from '@/types/user'
import { handleApiResponse } from '@/utils/handleApiResponse'
import client from './api'

export async function getUserDataService(userId: string) {
	try {
		const res = await client.get(user_endpoint(userId))

		return handleApiResponse(res)
	} catch (error: any) {
		const errData = error.response?.data
		throw new Error(errData?.message || error.message || 'Network error')
	}
}

export async function deleteProfilePicService(userId: string) {
	try {
		const res = await client.delete(user_profile_pic_endpoint(userId))

		return handleApiResponse(res)
	} catch (error: any) {
		const errData = error.response?.data
		throw new Error(errData?.message || error.message || 'Network error')
	}
}

export async function updateProfilePicService(userId: string, data: FormData) {
	try {
		const res = await client.patch(user_profile_pic_endpoint(userId), data, {
			headers: { 'Content-Type': 'multipart/form-data' },
		})

		return handleApiResponse(res)
	} catch (error: any) {
		const errData = error.response?.data
		throw new Error(errData?.message || error.message || 'Network error')
	}
}

export async function updateUserDataService(userId: string, data: UpdateUserBody) {
	try {
		const res = await client.patch(update_user_data_endpoint(userId), data)

		return handleApiResponse(res)
	} catch (error: any) {
		const errData = error.response?.data
		throw new Error(errData?.message || error.message || 'Network error')
	}
}
