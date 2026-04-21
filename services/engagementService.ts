import {
	WORKOUT_COMMENTS_ENDPOINT,
	FOLLOW_USER_ENDPOINT as follow_user_endpoint,
	SEARCH_USERS_ENDPOINT as search_users_endpoint,
	SUGGESTED_USERS_ENDPOINT as suggested_users_endpoint,
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

export async function createCommentService(workoutId: string, data: WorkoutCommentPayload) {
	try {
		const res = await client.post(WORKOUT_COMMENTS_ENDPOINT(workoutId), data)

		return handleApiResponse(res)
	} catch (error: any) {
		const errData = error.response?.data
		throw new Error(errData?.message || error.message || 'Network error')
	}
}

export async function getCommentsService(workoutId: string, limit: number = 10, cursor?: string, isReply?: boolean) {
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

export async function getWorkoutLikesService(workoutId: string) {
	try {
		const res = await client.get(`/engagement/${workoutId}/like/workout`)
		return handleApiResponse(res)
	} catch (error: any) {
		const errData = error.response?.data
		throw new Error(errData?.message || error.message || 'Network error')
	}
}

export async function createWorkoutLikeService(workoutId: string) {
	try {
		const res = await client.post(`/engagement/${workoutId}/like/workout`)
		return handleApiResponse(res)
	} catch (error: any) {
		const errData = error.response?.data
		throw new Error(errData?.message || error.message || 'Network error')
	}
}

export async function deleteWorkoutLikeService(workoutId: string) {
	try {
		const res = await client.delete(`/engagement/${workoutId}/like/workout`)
		return handleApiResponse(res)
	} catch (error: any) {
		const errData = error.response?.data
		throw new Error(errData?.message || error.message || 'Network error')
	}
}

export async function getCommentLikesService(commentId: string) {
	try {
		const res = await client.get(`/engagement/${commentId}/like/comment`)
		return handleApiResponse(res)
	} catch (error: any) {
		const errData = error.response?.data
		throw new Error(errData?.message || error.message || 'Network error')
	}
}

export async function createCommentLikeService(commentId: string) {
	try {
		const res = await client.post(`/engagement/${commentId}/like/comment`)
		return handleApiResponse(res)
	} catch (error: any) {
		const errData = error.response?.data
		throw new Error(errData?.message || error.message || 'Network error')
	}
}

export async function deleteCommentLikeService(commentId: string) {
	try {
		const res = await client.delete(`/engagement/${commentId}/like/comment`)
		return handleApiResponse(res)
	} catch (error: any) {
		const errData = error.response?.data
		throw new Error(errData?.message || error.message || 'Network error')
	}
}
