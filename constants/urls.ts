export const API_BASE_URL = (() => {
	const url = process.env.EXPO_PUBLIC_BASE_URL
	if (!url) {
		throw new Error('EXPO_PUBLIC_BASE_URL is not defined. Check your env configuration.')
	}
	return url
})()

// Authentication Endpoints
export const SEND_OTP_ENDPOINT = `/auth/send-otp`
export const VERIFY_OTP_ENDPOINT = `/auth/verify-otp`
export const REFRESH_TOKEN_ENDPOINT = `/auth/refresh-token`
export const GOOGLE_LOGIN_ENDPOINT = `/auth/google`

// User Endpoints
export const USER_ENDPOINT = (id: string) => `/users/${id}`
export const UPDATE_PROFILE_PIC_ENDPOINT = (id: string) => `/users/${id}/profile-picture`
export const UPDATE_USER_DATA_ENDPOINT = (id: string) => `/users/${id}`

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
export const EQUIPMENT_ENDPOINT = `/equipment`
export const EQUIPMENT_ITEM_ENDPOINT = (id: string) => `/equipment/${id}`

// Muscle Group Endpoints
export const MUSCLE_GROUPS_ENDPOINT = `/muscle-groups`
export const MUSCLE_GROUP_ITEM_ENDPOINT = (id: string) => `/muscle-groups/${id}`

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

// Analytics Endpoints
export const FITNESS_PROFILE_ENDPOINT = (id: string) => `/analytics/fitness-profile/${id}`
export const MEASUREMENTS_ENDPOINT = (id: string, duration?: string) =>
	`/analytics/measurements/${id}${duration ? `?duration=${duration}` : ''}`
export const NUTRITION_PLAN_ENDPOINT = (id: string) => `/analytics/nutrition-plan/${id}`
export const USER_ANALYTICS_ENDPOINT = (id: string) => `/analytics/user-analytics/${id}`
export const TRAINING_ANALYTICS_ENDPOINT = (id: string, duration: string) =>
	`/analytics/training/${id}?duration=${duration}`
