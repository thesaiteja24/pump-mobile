export const API_BASE_URL = (() => {
	const url = process.env.EXPO_PUBLIC_BASE_URL
	if (!url) {
		throw new Error('EXPO_PUBLIC_BASE_URL is not defined. Check your env configuration.')
	}
	return url
})()

// Authentication Endpoints
export const REFRESH_TOKEN_ENDPOINT = `/auth/refresh-token`
export const GOOGLE_LOGIN_ENDPOINT = `/auth/google`

// User Endpoints
export const ME_ENDPOINT = `/me`
export const MY_PROFILE_PIC_ENDPOINT = `/me/profile-picture`

export const MY_ANALYTICS_ENDPOINT = `/me/analytics`
export const MY_FITNESS_PROFILE_ENDPOINT = `/me/fitness-profile`
export const MY_NUTRITION_PLAN_ENDPOINT = `/me/nutrition-plan`
export const MY_MEASUREMENTS_ENDPOINT = (duration?: string) =>
	`/me/measurements${duration ? `?duration=${duration}` : ''}`
export const MY_TRAINING_ANALYTICS_ENDPOINT = (duration: string) => `/me/analytics/training/?duration=${duration}`

export const USER_ENDPOINT = (id: string) => `/users/${id}`

// Engagement Endpoints
export const SEARCH_USERS_ENDPOINT = (query: string) => `/engagement/search?query=${query}`
export const SUGGESTED_USERS_ENDPOINT = `/engagement/suggestions`
export const FOLLOW_USER_ENDPOINT = (id: string) => `/engagement/${id}/follow`
export const USER_FOLLOWERS_ENDPOINT = (id: string) => `/engagement/${id}/followers`
export const USER_FOLLOWING_ENDPOINT = (id: string) => `/engagement/${id}/following`
export const LIKES_ENDPOINT = (id: string, type: string) => `/engagement/${id}/likes?type=${type}`
export const TOGGLE_LIKE_ENDPOINT = (id: string, type: string, liked: boolean) =>
	`/engagement/${id}/like?type=${type}&liked=${liked}`

export const WORKOUT_COMMENTS_ENDPOINT = (id: string) => `/engagement/${id}/comments`

// Equipment Endpoints
export const EQUIPMENT_ENDPOINT = `/meta/equipment`
export const EQUIPMENT_ITEM_ENDPOINT = (id: string) => `/meta/equipment/${id}`

// Muscle Group Endpoints
export const MUSCLE_GROUPS_ENDPOINT = `/meta/muscle-groups`
export const MUSCLE_GROUP_ITEM_ENDPOINT = (id: string) => `/meta/muscle-groups/${id}`

// Exercise Endpoints
export const EXERCISES_ENDPOINT = `/exercises`
export const EXERCISE_ITEM_ENDPOINT = (id: string) => `/exercises/${id}`

export const WORKOUTS_ENDPOINT = `/workouts`
export const DISCOVER_WORKOUTS_ENDPOINT = `/workouts/discover`
export const WORKOUT_ITEM_ENDPOINT = (id: string) => `/workouts/${id}`
export const WORKOUT_SHARE_ENDPOINT = (id: string) => `/workouts/share/${id}`

export const TEMPLATES_ENDPOINT = `/templates`
export const TEMPLATE_ITEM_ENDPOINT = (id: string) => `/templates/${id}`

// Coach Conversation Endpoints
export const COACH_CONVERSATIONS_ENDPOINT = `/coach/conversations`

export const COACH_ACTIVE_CONVERSATION_ENDPOINT = `/coach/conversations/active`
export const COACH_CONVERSATION_ENDPOINT = (id: string) => `/coach/conversations/${id}`
export const COACH_CONVERSATION_MESSAGES_ENDPOINT = (id: string) => `/coach/conversations/${id}/messages`
export const COACH_TRANSCRIPTION_ENDPOINT = `/coach/transcriptions`
export const COACH_SPEECH_ENDPOINT = (id: string) => `${API_BASE_URL}/coach/speech/${id}`
