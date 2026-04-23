import { queryKeys } from '@/lib/queryKeys'
import {
	createCommentService,
	deleteCommentService,
	editCommentService,
	followUserService,
	getCommentsService,
	getLikesService,
	getSuggestedUsersService,
	getUserFollowersService,
	getUserFollowingService,
	searchUsersService,
	toggleLikeService,
	unFollowUserService,
} from '@/services/engagementService'
import { Comment, CommentsPage, EngagementUser, Like, LikeType, RepliesPage, SearchedUser } from '@/types/engagement'
import {
	incrementReplyCount,
	prependCommentToCaches,
	prependReplyToThread,
	removeCommentAcrossCaches,
	toggleLikeInComments,
	toggleLikeInLikesList,
	toggleLikeInReplies,
	toggleLikeInWorkouts,
	updateCommentAcrossCaches,
} from '@/utils/engagementCacheUtils'
import {
	InfiniteData,
	QueryClient,
	useInfiniteQuery,
	useMutation,
	useQuery,
	useQueryClient,
} from '@tanstack/react-query'

/**
 * Helper function to update user data across all related queries
 * @param qc
 * @param targetUserId
 * @param updater
 */
function updateUserAcrossQueries(qc: QueryClient, targetUserId: string, updater: (user: SearchedUser) => SearchedUser) {
	const updateFn = (old: SearchedUser[] | undefined) => old?.map(u => (u.id === targetUserId ? updater(u) : u))

	qc.setQueriesData({ queryKey: queryKeys.engagement.suggested }, updateFn)
	qc.setQueriesData({ queryKey: queryKeys.engagement.searchRoot }, updateFn)
	qc.setQueriesData({ queryKey: queryKeys.engagement.followersRoot }, updateFn)
	qc.setQueriesData({ queryKey: queryKeys.engagement.followingRoot }, updateFn)
}

/**
 * Helper function to set follow loading state
 * @param qc
 * @param targetUserId
 * @param loading
 */
function setFollowLoading(qc: QueryClient, targetUserId: string, loading: boolean) {
	updateUserAcrossQueries(qc, targetUserId, user => ({
		...user,
		followLoading: loading,
	}))
}

export function useSuggestedUsersQuery() {
	return useQuery({
		queryKey: queryKeys.engagement.suggested,
		queryFn: async () => {
			const res = await getSuggestedUsersService()
			return (res.data ?? []) as SearchedUser[]
		},
		staleTime: 2 * 60 * 1000,
	})
}

export function useSearchUsersQuery(query: string) {
	return useQuery({
		queryKey: queryKeys.engagement.search(query),
		queryFn: async () => {
			const res = await searchUsersService(query)
			return (res.data ?? []) as SearchedUser[]
		},
		enabled: query.trim().length > 0,
		staleTime: 30 * 1000,
	})
}

export function useUserFollowersQuery(userId?: string) {
	return useQuery({
		queryKey: queryKeys.engagement.followers(userId ?? ''),
		queryFn: async () => {
			const res = await getUserFollowersService(userId!)
			return (res.data ?? []) as SearchedUser[]
		},
		enabled: !!userId,
		staleTime: 60 * 1000,
	})
}

export function useUserFollowingQuery(userId?: string) {
	return useQuery({
		queryKey: queryKeys.engagement.following(userId ?? ''),
		queryFn: async () => {
			const res = await getUserFollowingService(userId!)
			return (res.data ?? []) as SearchedUser[]
		},
		enabled: !!userId,
		staleTime: 60 * 1000,
	})
}

export function useFollowUserMutation() {
	const qc = useQueryClient()

	return useMutation({
		mutationFn: (targetUserId: string) => followUserService(targetUserId),

		onMutate: targetUserId => {
			setFollowLoading(qc, targetUserId, true)
		},

		onSuccess: (res, targetUserId) => {
			const updatedUser = res?.data
			if (!updatedUser) return

			updateUserAcrossQueries(qc, targetUserId, user => ({
				...user,
				...updatedUser,
				followLoading: false,
			}))
		},

		onError: (_err, targetUserId) => {
			setFollowLoading(qc, targetUserId, false)
		},

		onSettled: () => {
			qc.invalidateQueries({
				queryKey: queryKeys.engagement.followRoot,
			})
		},
	})
}

export function useUnfollowUserMutation() {
	const qc = useQueryClient()

	return useMutation({
		mutationFn: (targetUserId: string) => unFollowUserService(targetUserId),

		onMutate: targetUserId => {
			setFollowLoading(qc, targetUserId, true)
		},

		onSuccess: (res, targetUserId) => {
			const updatedUser = res?.data
			if (!updatedUser) return

			updateUserAcrossQueries(qc, targetUserId, user => ({
				...user,
				...updatedUser,
				followLoading: false,
			}))
		},

		onError: (_err, targetUserId) => {
			setFollowLoading(qc, targetUserId, false)
		},

		onSettled: () => {
			qc.invalidateQueries({
				queryKey: queryKeys.engagement.followRoot,
			})
		},
	})
}

export function useCommentsQuery(workoutId: string, limit = 3) {
	return useInfiniteQuery({
		queryKey: queryKeys.engagement.comments(workoutId),

		queryFn: async ({ pageParam }) => {
			const res = await getCommentsService(workoutId, limit, pageParam)

			return {
				comments: res.data.comments,
				nextCursor: res.data.nextCursor,
			} as CommentsPage
		},

		initialPageParam: undefined as string | undefined,

		getNextPageParam: last => last.nextCursor,

		enabled: !!workoutId,
	})
}

export function useRepliesQuery(parentId?: string, limit = 3) {
	return useInfiniteQuery({
		queryKey: queryKeys.engagement.replies(parentId!),

		queryFn: async ({ pageParam }) => {
			const res = await getCommentsService(parentId!, limit, pageParam, true)

			return {
				replies: res.data.replies,
				nextCursor: res.data.nextCursor,
			} as RepliesPage
		},

		initialPageParam: undefined as string | undefined,

		getNextPageParam: last => last.nextCursor,

		enabled: !!parentId,
	})
}

export function useCommentMutation(workoutId: string) {
	const qc = useQueryClient()

	return useMutation({
		mutationFn: (content: string) => createCommentService(workoutId, { content }),

		onMutate: async () => {
			// Cancel outgoing refetches
			await qc.cancelQueries({ queryKey: queryKeys.engagement.comments(workoutId) })

			// Snapshot the previous value
			const previousData = qc.getQueriesData({ queryKey: queryKeys.engagement.commentsRoot })

			return { previousData }
		},

		onSuccess: (res: any) => {
			const newComment = res.data as Comment
			if (!newComment) return

			prependCommentToCaches(qc, newComment)
		},

		onError: (_err, _newComment, context) => {
			// Rollback to previous state
			context?.previousData?.forEach(([key, old]) => {
				qc.setQueryData(key, old)
			})
		},

		onSettled: () => {
			qc.invalidateQueries({
				queryKey: queryKeys.engagement.comments(workoutId),
				refetchType: 'inactive',
			})
		},
	})
}

export function useReplyMutation(workoutId: string, parentId: string) {
	const qc = useQueryClient()

	return useMutation({
		mutationFn: (content: string) => createCommentService(workoutId, { content, parentId }),

		onMutate: async () => {
			await qc.cancelQueries({ queryKey: queryKeys.engagement.commentsRoot })
			await qc.cancelQueries({ queryKey: queryKeys.engagement.replies(parentId) })

			const previousComments = qc.getQueriesData({ queryKey: queryKeys.engagement.commentsRoot })
			const previousReplies = qc.getQueriesData({ queryKey: queryKeys.engagement.replies(parentId) })

			return { previousComments, previousReplies }
		},

		onSuccess: res => {
			const newReply = res.data as Comment
			if (!newReply) return

			incrementReplyCount(qc, parentId)
			prependReplyToThread(qc, parentId, newReply)
		},

		onError: (_err, _newReply, context) => {
			context?.previousComments?.forEach(([key, old]) => qc.setQueryData(key, old))
			context?.previousReplies?.forEach(([key, old]) => qc.setQueryData(key, old))
		},

		onSettled: () => {
			qc.invalidateQueries({
				queryKey: queryKeys.engagement.comments(workoutId),
				refetchType: 'inactive',
			})
			qc.invalidateQueries({
				queryKey: queryKeys.engagement.replies(parentId),
				refetchType: 'inactive',
			})
		},
	})
}

export function useEditCommentMutation(workoutId: string) {
	const qc = useQueryClient()

	return useMutation({
		mutationFn: ({ commentId, content }: { commentId: string; content: string }) =>
			editCommentService(commentId, content),

		onMutate: async ({ commentId, content }) => {
			await qc.cancelQueries({ queryKey: queryKeys.engagement.commentsRoot })
			await qc.cancelQueries({ queryKey: queryKeys.engagement.repliesRoot })

			const previousComments = qc.getQueriesData({ queryKey: queryKeys.engagement.commentsRoot })
			const previousReplies = qc.getQueriesData({ queryKey: queryKeys.engagement.repliesRoot })

			updateCommentAcrossCaches(qc, commentId, comment => ({ ...comment, content }))

			return { previousComments, previousReplies }
		},

		onError: (_err, _vars, context) => {
			context?.previousComments?.forEach(([key, old]) => qc.setQueryData(key, old))
			context?.previousReplies?.forEach(([key, old]) => qc.setQueryData(key, old))
		},

		onSettled: () => {
			qc.invalidateQueries({
				queryKey: queryKeys.engagement.comments(workoutId),
				refetchType: 'inactive',
			})

			qc.invalidateQueries({
				queryKey: queryKeys.engagement.repliesRoot,
				refetchType: 'inactive',
			})
		},
	})
}

export function useDeleteCommentMutation() {
	const qc = useQueryClient()

	return useMutation({
		mutationFn: (comment: Comment) => deleteCommentService(comment.id),

		onMutate: async comment => {
			// Cancel any outgoing refetches to avoid overwriting optimistic update
			await qc.cancelQueries({ queryKey: queryKeys.engagement.commentsRoot })
			await qc.cancelQueries({ queryKey: queryKeys.engagement.repliesRoot })

			const previousComments = qc.getQueriesData({ queryKey: queryKeys.engagement.commentsRoot })
			const previousReplies = qc.getQueriesData({ queryKey: queryKeys.engagement.repliesRoot })

			removeCommentAcrossCaches(qc, comment.id, comment.parentId)

			return { previousComments, previousReplies }
		},

		onError: (_err, _comment, context) => {
			context?.previousComments?.forEach(([key, old]) => qc.setQueryData(key, old))
			context?.previousReplies?.forEach(([key, old]) => qc.setQueryData(key, old))
		},

		onSettled: (_res, _err, comment) => {
			// Invalidate roots to ensure cache integrity across the app
			qc.invalidateQueries({
				queryKey: queryKeys.engagement.comments(comment.workoutId),
				refetchType: 'inactive',
			})

			qc.invalidateQueries({
				queryKey: queryKeys.engagement.repliesRoot,
				refetchType: 'inactive',
			})
		},
	})
}

export function useLikesQuery(id: string, type: LikeType) {
	return useQuery({
		queryKey: queryKeys.engagement.likes(id, type),

		queryFn: async () => {
			const res = await getLikesService(id, type)
			return res.data as Like[]
		},

		enabled: !!id && !!type,
		staleTime: 30 * 1000,
	})
}

export function useToggleLikeMutation() {
	const qc = useQueryClient()

	return useMutation({
		mutationFn: ({
			id,
			type,
			liked,
		}: {
			id: string
			type: LikeType
			liked: boolean
			user?: EngagementUser
			workoutId?: string
		}) => toggleLikeService(id, type, liked),

		onMutate: async ({ id, type, liked, user, workoutId }) => {
			// Cancel outgoing queries to avoid overwriting optimistic update
			if (workoutId) {
				await qc.cancelQueries({ queryKey: queryKeys.engagement.comments(workoutId) })
			} else {
				await qc.cancelQueries({ queryKey: queryKeys.engagement.commentsRoot })
			}
			await qc.cancelQueries({ queryKey: queryKeys.engagement.repliesRoot })
			await qc.cancelQueries({ queryKey: queryKeys.engagement.likes(id, type) })

			// Snapshot current state
			const prevComments = qc.getQueriesData({ queryKey: queryKeys.engagement.commentsRoot })
			const prevReplies = qc.getQueriesData({ queryKey: queryKeys.engagement.repliesRoot })
			const prevDiscover = qc.getQueriesData({ queryKey: queryKeys.workouts.discover })
			const prevHistory = qc.getQueriesData({ queryKey: queryKeys.workouts.all })
			const prevWorkoutDetail = qc.getQueryData(queryKeys.workouts.byId(id))
			const prevLikes = qc.getQueryData(queryKeys.engagement.likes(id, type))

			// Optimistic updates
			toggleLikeInComments(qc, id, liked)
			toggleLikeInReplies(qc, id, liked)
			toggleLikeInWorkouts(qc, id, liked)
			toggleLikeInLikesList(qc, id, type, liked, user)

			return { prevComments, prevReplies, prevDiscover, prevHistory, prevWorkoutDetail, prevLikes }
		},

		onError: (_err, { id, type }, ctx) => {
			// Rollback on error
			ctx?.prevComments?.forEach(([key, data]) => qc.setQueryData(key, data))
			ctx?.prevReplies?.forEach(([key, data]) => qc.setQueryData(key, data))
			ctx?.prevDiscover?.forEach(([key, data]) => qc.setQueryData(key, data))
			ctx?.prevHistory?.forEach(([key, data]) => qc.setQueryData(key, data))
			if (ctx?.prevWorkoutDetail) {
				qc.setQueryData(queryKeys.workouts.byId(id), ctx.prevWorkoutDetail)
			}
			if (ctx?.prevLikes) {
				qc.setQueryData(queryKeys.engagement.likes(id, type), ctx.prevLikes)
			}
		},

		onSettled: (_res, _err, { id, type, workoutId }) => {
			// Invalidate all related caches to stay in sync with server
			qc.invalidateQueries({
				queryKey: queryKeys.engagement.likes(id, type),
				refetchType: 'inactive',
			})
			if (workoutId) {
				qc.invalidateQueries({
					queryKey: queryKeys.engagement.comments(workoutId),
					refetchType: 'inactive',
				})
			} else {
				qc.invalidateQueries({
					queryKey: queryKeys.engagement.commentsRoot,
					refetchType: 'inactive',
				})
			}
			qc.invalidateQueries({
				queryKey: queryKeys.engagement.repliesRoot,
				refetchType: 'inactive',
			})
			qc.invalidateQueries({
				queryKey: queryKeys.workouts.discover,
				refetchType: 'inactive',
			})
			qc.invalidateQueries({
				queryKey: queryKeys.workouts.all,
				refetchType: 'inactive',
			})
			qc.invalidateQueries({
				queryKey: queryKeys.workouts.byId(id),
				refetchType: 'inactive',
			})
		},
	})
}
