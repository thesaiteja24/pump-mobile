import { queryClient } from '@/lib/queryClient'
import { queryKeys } from '@/lib/queryKeys'
import {
	createCommentLikeService,
	createCommentService,
	createWorkoutLikeService,
	deleteCommentLikeService,
	deleteCommentService,
	deleteWorkoutLikeService,
	editCommentService,
	getCommentLikesService,
	getCommentsService,
	getWorkoutLikesService,
} from '@/services/engagementService'
import type { Comment, EngagementLike, UserSnippet } from '@/types/comments'
import { useInfiniteQuery, useMutation, useQuery } from '@tanstack/react-query'

const PAGE_SIZE_COMMENTS = 20
const PAGE_SIZE_REPLIES = 10

// ─────────────────────────────────────────────────────
// READ — paginated comments for a workout (infinite query)
// ─────────────────────────────────────────────────────
export function useWorkoutComments(workoutId: string | null | undefined) {
	return useInfiniteQuery({
		queryKey: queryKeys.engagement.comments(workoutId ?? ''),
		queryFn: async ({ pageParam }: { pageParam: string | undefined }) => {
			const res = await getCommentsService(workoutId!, PAGE_SIZE_COMMENTS, pageParam)
			return {
				comments: res.data.comments as Comment[],
				nextCursor: res.data.nextCursor as string | null,
			}
		},
		initialPageParam: undefined as string | undefined,
		getNextPageParam: last => last.nextCursor ?? undefined,
		enabled: Boolean(workoutId),
		staleTime: 30 * 1000, // 30 s — social data refreshes quickly
	})
}

// ─────────────────────────────────────────────────────
// READ — paginated replies for a single comment (infinite query)
// ─────────────────────────────────────────────────────
export function useCommentReplies(commentId: string | null | undefined) {
	return useInfiniteQuery({
		queryKey: queryKeys.engagement.replies(commentId ?? ''),
		queryFn: async ({ pageParam }: { pageParam: string | undefined }) => {
			const res = await getCommentsService(commentId!, PAGE_SIZE_REPLIES, pageParam, true)
			return {
				replies: res.data.replies as Comment[],
				nextCursor: res.data.nextCursor as string | null,
			}
		},
		initialPageParam: undefined as string | undefined,
		getNextPageParam: last => last.nextCursor ?? undefined,
		enabled: Boolean(commentId),
		staleTime: 30 * 1000,
	})
}

// ─────────────────────────────────────────────────────
// READ — workout likes
// ─────────────────────────────────────────────────────
export function useWorkoutLikes(workoutId: string | null | undefined) {
	return useQuery({
		queryKey: queryKeys.engagement.workoutLikes(workoutId ?? ''),
		queryFn: async () => {
			const res = await getWorkoutLikesService(workoutId!)
			return res.data as EngagementLike[]
		},
		enabled: Boolean(workoutId),
		staleTime: 60 * 1000, // 1 min
	})
}

// ─────────────────────────────────────────────────────
// READ — comment likes
// ─────────────────────────────────────────────────────
export function useCommentLikes(commentId: string | null | undefined) {
	return useQuery({
		queryKey: queryKeys.engagement.commentLikes(commentId ?? ''),
		queryFn: async () => {
			const res = await getCommentLikesService(commentId!)
			return res.data as EngagementLike[]
		},
		enabled: Boolean(commentId),
		staleTime: 60 * 1000,
	})
}

// ─────────────────────────────────────────────────────
// MUTATION — add comment (optimistic prepend)
// ─────────────────────────────────────────────────────
export function useAddComment(workoutId: string) {
	return useMutation({
		mutationFn: async (content: string) => {
			const res = await createCommentService(workoutId, { content })
			if (!res.success) throw new Error('Failed to add comment')
			return { ...res.data, _count: res.data._count || { replies: 0 } } as Comment
		},
		onSuccess: newComment => {
			queryClient.setQueryData<any>(queryKeys.engagement.comments(workoutId), (old: any) => {
				if (!old) return old
				// Prepend to first page
				const firstPage = old.pages[0]
				const deduped = firstPage.comments.some((c: Comment) => c.id === newComment.id)
					? firstPage.comments
					: [newComment, ...firstPage.comments]
				return {
					...old,
					pages: [{ ...firstPage, comments: deduped }, ...old.pages.slice(1)],
				}
			})
		},
	})
}

// ─────────────────────────────────────────────────────
// MUTATION — add reply (optimistic reply count increment)
// ─────────────────────────────────────────────────────
export function useAddReply(workoutId: string, parentId: string) {
	return useMutation({
		mutationFn: async (content: string) => {
			const res = await createCommentService(workoutId, { content, parentId })
			if (!res.success) throw new Error('Failed to add reply')
			return { ...res.data, _count: res.data._count || { replies: 0 } } as Comment
		},
		onSuccess: newReply => {
			// Append to replies query cache
			queryClient.setQueryData<any>(queryKeys.engagement.replies(parentId), (old: any) => {
				if (!old) return old
				const lastPage = old.pages[old.pages.length - 1]
				return {
					...old,
					pages: [...old.pages.slice(0, -1), { ...lastPage, replies: [...lastPage.replies, newReply] }],
				}
			})
			// Increment _count.replies on parent comment in comments list
			queryClient.setQueryData<any>(queryKeys.engagement.comments(workoutId), (old: any) => {
				if (!old) return old
				return {
					...old,
					pages: old.pages.map((page: any) => ({
						...page,
						comments: page.comments.map((c: Comment) =>
							c.id === parentId
								? { ...c, _count: { ...c._count, replies: (c._count?.replies || 0) + 1 } }
								: c
						),
					})),
				}
			})
		},
	})
}

// ─────────────────────────────────────────────────────
// MUTATION — edit comment
// ─────────────────────────────────────────────────────
export function useEditComment(workoutId: string) {
	return useMutation({
		mutationFn: async ({ commentId, content }: { commentId: string; content: string }) => {
			const res = await editCommentService(commentId, content)
			if (!res.success) throw new Error('Failed to edit comment')
			return { commentId, content: res.data.content as string }
		},
		onSuccess: ({ commentId, content }) => {
			// Update in comments pages
			queryClient.setQueryData<any>(queryKeys.engagement.comments(workoutId), (old: any) => {
				if (!old) return old
				return {
					...old,
					pages: old.pages.map((page: any) => ({
						...page,
						comments: page.comments.map((c: Comment) => (c.id === commentId ? { ...c, content } : c)),
					})),
				}
			})
			// Also update if it's a reply in any cached replies list
			queryClient.setQueriesData<any>({ queryKey: ['engagement', 'replies'] }, (old: any) => {
				if (!old) return old
				return {
					...old,
					pages: old.pages.map((page: any) => ({
						...page,
						replies: page.replies.map((r: Comment) => (r.id === commentId ? { ...r, content } : r)),
					})),
				}
			})
		},
	})
}

// ─────────────────────────────────────────────────────
// MUTATION — delete comment (remove from all caches)
// ─────────────────────────────────────────────────────
export function useDeleteComment(workoutId: string) {
	return useMutation({
		mutationFn: async (commentId: string) => {
			const res = await deleteCommentService(commentId)
			if (!res.success) throw new Error('Failed to delete comment')
			return commentId
		},
		onSuccess: commentId => {
			queryClient.setQueryData<any>(queryKeys.engagement.comments(workoutId), (old: any) => {
				if (!old) return old
				return {
					...old,
					pages: old.pages.map((page: any) => ({
						...page,
						comments: page.comments.filter((c: Comment) => c.id !== commentId),
					})),
				}
			})
			// Also try removing from any replies cache
			queryClient.setQueriesData<any>({ queryKey: ['engagement', 'replies'] }, (old: any) => {
				if (!old) return old
				return {
					...old,
					pages: old.pages.map((page: any) => ({
						...page,
						replies: page.replies.filter((r: Comment) => r.id !== commentId),
					})),
				}
			})
		},
	})
}

// ─────────────────────────────────────────────────────
// MUTATION — toggle workout like (optimistic)
// ─────────────────────────────────────────────────────
export function useToggleWorkoutLike(workoutId: string) {
	return useMutation({
		mutationFn: async ({ currentUser, isLiked }: { currentUser: UserSnippet; isLiked: boolean }) => {
			if (isLiked) {
				await deleteWorkoutLikeService(workoutId)
			} else {
				await createWorkoutLikeService(workoutId)
			}
			return { currentUser, isLiked }
		},
		onMutate: async ({ currentUser, isLiked }) => {
			// Cancel any outgoing refetches
			await queryClient.cancelQueries({ queryKey: queryKeys.engagement.workoutLikes(workoutId) })

			const previous = queryClient.getQueryData<EngagementLike[]>(queryKeys.engagement.workoutLikes(workoutId))

			// Optimistic update
			queryClient.setQueryData<EngagementLike[]>(queryKeys.engagement.workoutLikes(workoutId), (old = []) => {
				if (isLiked) {
					return old.filter(l => l.userId !== currentUser.id)
				}
				return [...old, { userId: currentUser.id, createdAt: new Date().toISOString(), user: currentUser }]
			})

			return { previous }
		},
		onError: (_err, _vars, ctx) => {
			// Roll back optimistic update
			if (ctx?.previous !== undefined) {
				queryClient.setQueryData(queryKeys.engagement.workoutLikes(workoutId), ctx.previous)
			}
		},
	})
}

// ─────────────────────────────────────────────────────
// MUTATION — toggle comment like (optimistic, also updates likesCount on comment)
// ─────────────────────────────────────────────────────
export function useToggleCommentLike(workoutId: string) {
	return useMutation({
		mutationFn: async ({
			commentId,
			currentUser,
			isLiked,
		}: {
			commentId: string
			currentUser: UserSnippet
			isLiked: boolean
		}) => {
			if (isLiked) {
				await deleteCommentLikeService(commentId)
			} else {
				await createCommentLikeService(commentId)
			}
			return { commentId, currentUser, isLiked }
		},
		onMutate: async ({ commentId, currentUser, isLiked }) => {
			await queryClient.cancelQueries({ queryKey: queryKeys.engagement.commentLikes(commentId) })

			const previousLikes = queryClient.getQueryData<EngagementLike[]>(
				queryKeys.engagement.commentLikes(commentId)
			)

			// Optimistically update likes list
			queryClient.setQueryData<EngagementLike[]>(queryKeys.engagement.commentLikes(commentId), (old = []) => {
				if (isLiked) return old.filter(l => l.userId !== currentUser.id)
				return [...old, { userId: currentUser.id, createdAt: new Date().toISOString(), user: currentUser }]
			})

			// Optimistically update likesCount on the comment object inside the comments pages
			const updateCount = (pages: any[]) =>
				pages.map((page: any) => ({
					...page,
					comments: page.comments?.map((c: Comment) =>
						c.id === commentId
							? { ...c, likesCount: isLiked ? Math.max(0, c.likesCount - 1) : c.likesCount + 1 }
							: c
					),
				}))

			queryClient.setQueryData<any>(queryKeys.engagement.comments(workoutId), (old: any) => {
				if (!old) return old
				return { ...old, pages: updateCount(old.pages) }
			})

			return { previousLikes }
		},
		onError: (_err, { commentId }, ctx) => {
			if (ctx?.previousLikes !== undefined) {
				queryClient.setQueryData(queryKeys.engagement.commentLikes(commentId), ctx.previousLikes)
			}
		},
	})
}
