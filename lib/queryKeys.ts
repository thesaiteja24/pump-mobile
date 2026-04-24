/**
 * Query Keys
 *
 * Centralised, typed query key factory for the whole app.
 * Keeping keys in one place makes it trivial to invalidate related queries
 * (e.g. after a mutation) and avoids typo-driven cache misses.
 *
 * Usage:
 *   queryClient.invalidateQueries({ queryKey: queryKeys.exercises.all })
 *   useQuery({ queryKey: queryKeys.exercises.all, ... })
 */

import { LikeType } from '@/types/engagement'

export const queryKeys = {
	engagement: {
		root: ['engagement'] as const,

		suggested: ['engagement', 'follow', 'suggestedUsers'] as const,
		searchRoot: ['engagement', 'follow', 'searchUsers'] as const,
		search: (query: string) => ['engagement', 'follow', 'searchUsers', query] as const,

		followRoot: ['engagement', 'follow'] as const,
		followersRoot: ['engagement', 'follow', 'userFollowers'] as const,
		followers: (userId: string) => ['engagement', 'follow', 'userFollowers', userId] as const,
		followingRoot: ['engagement', 'follow', 'userFollowing'] as const,
		following: (userId: string) => ['engagement', 'follow', 'userFollowing', userId] as const,

		commentsRoot: ['engagement', 'comments'] as const,
		comments: (workoutId: string) => ['engagement', 'comments', workoutId] as const,
		repliesRoot: ['engagement', 'replies'] as const,
		replies: (parentId: string) => ['engagement', 'replies', parentId] as const,

		likes: (id: string, type: LikeType) => ['engagement', 'likes', type, id] as const,
	},

	me: {
		root: ['me'] as const,

		profile: ['me', 'profile'] as const,

		analyticsRoot: ['me', 'analytics'] as const,
		userAnalytics: ['me', 'analytics', 'user'] as const,
		trainingAnalytics: (duration: string) => ['me', 'analytics', 'training', duration] as const,

		fitnessProfile: ['me', 'fitnessProfile'] as const,
		nutritionPlan: ['me', 'nutritionPlan'] as const,

		measurementsRoot: ['me', 'measurements'] as const,
		measurements: (duration?: string) =>
			duration ? (['me', 'measurements', duration] as const) : (['me', 'measurements'] as const),
	},

	user: {
		byId: (userId: string) => ['user', userId] as const,
	},

	exercises: {
		all: ['exercises'] as const,
		byId: (id: string) => ['exercises', id] as const,
	},
	meta: {
		root: ['meta'] as const,
		resource: (resource: 'equipment' | 'muscle-groups') => ['meta', resource] as const,
		all: (resource: 'equipment' | 'muscle-groups') => ['meta', resource, 'list'] as const,
		byId: (resource: 'equipment' | 'muscle-groups', id: string) => ['meta', resource, 'detail', id] as const,
	},
	// Future phases will add more keys here
	// Programs (Library / Global)
	programs: {
		all: (userId: string) => ['programs', userId] as const,
		detail: (programId: string) => ['programs', 'detail', programId] as const,
		// User specific program instances
		user: {
			all: (userId: string) => ['userPrograms', userId] as const,
			active: (userId: string) => ['userPrograms', 'active', userId] as const,
			detail: (userId: string, userProgramId: string) =>
				['userPrograms', 'detail', userId, userProgramId] as const,
		},
	},
	templates: {
		all: (userId: string) => ['templates', userId] as const,
		byId: (id: string) => ['templates', id] as const,
		byShareId: (shareId: string) => ['templates', 'shared', shareId] as const,
	},
	workouts: {
		all: ['workouts'] as const,
		discover: ['discoverWorkouts'] as const,
		byId: (id: string) => ['workouts', 'detail', id] as const,
	},
	habits: {
		list: (userId: string) => ['habits', userId] as const,
		logs: (userId: string, startDate?: string, endDate?: string) =>
			['habits', 'logs', userId, startDate, endDate] as const,
	},
	comments: {
		byWorkout: (workoutId: string) => ['comments', workoutId] as const,
		replies: (commentId: string) => ['replies', commentId] as const,
		workoutLikes: (workoutId: string) => ['workoutLikes', workoutId] as const,
		commentLikes: (commentId: string) => ['commentLikes', commentId] as const,
	},
} as const
