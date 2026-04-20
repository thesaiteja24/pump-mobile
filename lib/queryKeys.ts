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
	// Engagement keys used by useComments hooks
	engagement: {
		comments: (workoutId: string) => ['engagement', 'comments', workoutId] as const,
		replies: (commentId: string) => ['engagement', 'replies', commentId] as const,
		workoutLikes: (workoutId: string) => ['engagement', 'workoutLikes', workoutId] as const,
		commentLikes: (commentId: string) => ['engagement', 'commentLikes', commentId] as const,
	},
	analytics: {
		measurements: (userId: string, duration?: string) =>
			duration ? (['measurements', userId, duration] as const) : (['measurements', userId] as const),
		userAnalytics: (userId: string) => ['analytics', userId] as const,
		fitnessProfile: (userId: string) => ['fitnessProfile', userId] as const,
		nutritionPlan: (userId: string) => ['nutritionPlan', userId] as const,
		trainingAnalytics: (userId: string, duration: string) => ['trainingAnalytics', userId, duration] as const,
	},
	user: {
		byId: (userId: string) => ['user', userId] as const,
		suggested: ['suggestedUsers'] as const,
		followers: (userId: string) => ['userFollowers', userId] as const,
		following: (userId: string) => ['userFollowing', userId] as const,
	},
} as const
