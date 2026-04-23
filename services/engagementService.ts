import {
	WORKOUT_COMMENTS_ENDPOINT,
	FOLLOW_USER_ENDPOINT as follow_user_endpoint,
	LIKES_ENDPOINT as likes_endpoint,
	SEARCH_USERS_ENDPOINT as search_users_endpoint,
	SUGGESTED_USERS_ENDPOINT as suggested_users_endpoint,
	TOGGLE_LIKE_ENDPOINT as toggle_like_endpoint,
	USER_FOLLOWERS_ENDPOINT as user_followers_endpoint,
	USER_FOLLOWING_ENDPOINT as user_following_endpoint,
} from '@/constants/urls'
import { handleApiResponse } from '@/utils/handleApiResponse'
import client from './api'

interface WorkoutCommentPayload {
	content: string
	parentId?: string
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

export async function searchUsersService(query: string) {
	try {
		const res = await client.get(search_users_endpoint(query))

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

// Refactor this
export async function createCommentService(workoutId: string, data: WorkoutCommentPayload) {
	try {
		const res = await client.post(WORKOUT_COMMENTS_ENDPOINT(workoutId), data)

		return handleApiResponse(res)
	} catch (error: any) {
		const errData = error.response?.data
		throw new Error(errData?.message || error.message || 'Network error')
	}
}

export async function getCommentsService(workoutId: string, limit: number, cursor?: string, isReply?: boolean) {
	try {
		const params = new URLSearchParams()
		params.append('limit', limit.toString())
		if (cursor) params.append('cursor', cursor)
		if (isReply) params.append('isReply', 'true')

		const url = `${WORKOUT_COMMENTS_ENDPOINT(workoutId)}?${params.toString()}`
		const res = await client.get(url)

		return handleApiResponse(res)
	} catch (error: any) {
		const errData = error.response?.data
		throw new Error(errData?.message || error.message || 'Network error')
	}
}

export async function deleteCommentService(commentId: string) {
	try {
		const res = await client.delete(WORKOUT_COMMENTS_ENDPOINT(commentId))

		return handleApiResponse(res)
	} catch (error: any) {
		const errData = error.response?.data
		throw new Error(errData?.message || error.message || 'Network error')
	}
}

export async function editCommentService(commentId: string, content: string) {
	try {
		const res = await client.put(WORKOUT_COMMENTS_ENDPOINT(commentId), { content })

		return handleApiResponse(res)
	} catch (error: any) {
		const errData = error.response?.data
		throw new Error(errData?.message || error.message || 'Network error')
	}
}

export async function getLikesService(id: string, type: string) {
	try {
		const res = await client.get(likes_endpoint(id, type))
		return handleApiResponse(res)
	} catch (error: any) {
		const errData = error.response?.data
		throw new Error(errData?.message || error.message || 'Network error')
	}
}

export async function toggleLikeService(id: string, type: string, liked: boolean) {
	try {
		const res = await client.put(toggle_like_endpoint(id, type, liked))
		return handleApiResponse(res)
	} catch (error: any) {
		const errData = error.response?.data
		throw new Error(errData?.message || error.message || 'Network error')
	}
}
