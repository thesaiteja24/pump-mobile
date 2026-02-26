import {
	FOLLOW_USER_ENDPOINT as follow_user_endpoint,
	SEARCH_USERS_ENDPOINT as search_users_endpoint,
	SUGGESTED_USERS_ENDPOINT as suggested_users_endpoint,
	UPDATE_PROFILE_PIC_ENDPOINT as update_profile_pic_endpoint,
	UPDATE_USER_DATA_ENDPOINT as update_user_data_endpoint,
	USER_ENDPOINT as user_endpoint,
	USER_FOLLOWERS_ENDPOINT as user_followers_endpoint,
	USER_FOLLOWING_ENDPOINT as user_following_endpoint,
} from '@/constants/urls'
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
		const res = await client.delete(update_profile_pic_endpoint(userId))

		return handleApiResponse(res)
	} catch (error: any) {
		const errData = error.response?.data
		throw new Error(errData?.message || error.message || 'Network error')
	}
}

export async function updateProfilePicService(userId: string, data: FormData) {
	try {
		const res = await client.patch(update_profile_pic_endpoint(userId), data, {
			headers: { 'Content-Type': 'multipart/form-data' },
		})

		return handleApiResponse(res)
	} catch (error: any) {
		const errData = error.response?.data
		throw new Error(errData?.message || error.message || 'Network error')
	}
}

export async function updateUserDataService(userId: string, data: Record<string, any>) {
	try {
		const res = await client.patch(update_user_data_endpoint(userId), data)

		return handleApiResponse(res)
	} catch (error: any) {
		const errData = error.response?.data
		throw new Error(errData?.message || error.message || 'Network error')
	}
}

export async function searchUsersService(query: string) {
	try {
		const res = await client.get(search_users_endpoint(query))

		return handleApiResponse(res)
	} catch (error: any) {
		const errData = error.response?.data
		throw new Error(errData?.message || error.message || 'Network error')
	}
}

export async function getSuggestedUsersService() {
	try {
		const res = await client.get(suggested_users_endpoint)

		return handleApiResponse(res)
	} catch (error: any) {
		const errData = error.response?.data
		throw new Error(errData?.message || error.message || 'Network error')
	}
}

export async function followUserService(targetUserId: string) {
	try {
		const res = await client.post(follow_user_endpoint(targetUserId))

		return handleApiResponse(res)
	} catch (error: any) {
		const errData = error.response?.data
		throw new Error(errData?.message || error.message || 'Network error')
	}
}

export async function unFollowUserService(targetUserId: string) {
	try {
		const res = await client.delete(follow_user_endpoint(targetUserId))

		return handleApiResponse(res)
	} catch (error: any) {
		const errData = error.response?.data
		throw new Error(errData?.message || error.message || 'Network error')
	}
}

export async function getUserFollowersService(userId: string) {
	try {
		const res = await client.get(user_followers_endpoint(userId))

		return handleApiResponse(res)
	} catch (error: any) {
		const errData = error.response?.data
		throw new Error(errData?.message || error.message || 'Network error')
	}
}

export async function getUserFollowingService(userId: string) {
	try {
		const res = await client.get(user_following_endpoint(userId))

		return handleApiResponse(res)
	} catch (error: any) {
		const errData = error.response?.data
		throw new Error(errData?.message || error.message || 'Network error')
	}
}
