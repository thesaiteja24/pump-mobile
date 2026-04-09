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

export const queryKeys = {
	exercises: {
		all: ['exercises'] as const,
		byId: (id: string) => ['exercises', id] as const,
	},
	equipment: {
		all: ['equipment'] as const,
		byId: (id: string) => ['equipment', id] as const,
	},
	muscleGroups: {
		all: ['muscleGroups'] as const,
		byId: (id: string) => ['muscleGroups', id] as const,
	},
	// Future phases will add more keys here
	programs: {
		all: ['programs'] as const,
		byId: (id: string) => ['programs', id] as const,
		// alias used by usePrograms hook
		detail: (id: string) => ['programs', id] as const,
	},
	templates: {
		all: ['templates'] as const,
		byId: (id: string) => ['templates', id] as const,
		byShareId: (shareId: string) => ['templates', 'shared', shareId] as const,
	},
	workouts: {
		all: ['workouts'] as const,
		discover: ['discoverWorkouts'] as const,
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
	// Engagement keys used by useComments hooks
	engagement: {
		comments: (workoutId: string) => ['engagement', 'comments', workoutId] as const,
		replies: (commentId: string) => ['engagement', 'replies', commentId] as const,
		workoutLikes: (workoutId: string) => ['engagement', 'workoutLikes', workoutId] as const,
		commentLikes: (commentId: string) => ['engagement', 'commentLikes', commentId] as const,
	},
	analytics: {
		measurements: (userId: string) => ['measurements', userId] as const,
		userAnalytics: (userId: string) => ['analytics', userId] as const,
		fitnessProfile: (userId: string) => ['fitnessProfile', userId] as const,
		nutritionPlan: (userId: string) => ['nutritionPlan', userId] as const,
	},
	user: {
		byId: (userId: string) => ['user', userId] as const,
		suggested: ['suggestedUsers'] as const,
		followers: (userId: string) => ['userFollowers', userId] as const,
		following: (userId: string) => ['userFollowing', userId] as const,
	},
} as const
