import { queryKeys } from '@/lib/queryKeys'
import { Comment, CommentsPage, EngagementUser, Like, LikeType, RepliesPage } from '@/types/engagement'
import { InfiniteData, QueryClient } from '@tanstack/react-query'

/**
 * Universal Infinite Query Updater
 * A generic helper to transform items inside InfiniteData pages.
 */
export function updateInfiniteData<TPage extends { [K in TKey]: unknown[] }, TKey extends keyof TPage>(
	oldData: InfiniteData<TPage> | undefined,
	itemKey: TKey,
	updateFn: (items: TPage[TKey]) => TPage[TKey]
): InfiniteData<TPage> | undefined {
	if (!oldData) return oldData
	return {
		...oldData,
		pages: oldData.pages.map(page => ({
			...page,
			[itemKey]: updateFn(page[itemKey]),
		})),
	}
}

/**
 * Prepends an item to the first page of an infinite query list
 */
export function prependToInfiniteData<TPage extends { [K in TKey]: { id: string }[] }, TKey extends keyof TPage>(
	oldData: InfiniteData<TPage> | undefined,
	itemKey: TKey,
	newItem: TPage[TKey][number]
): InfiniteData<TPage> | undefined {
	if (!oldData) return oldData
	return {
		...oldData,
		pages: oldData.pages.map((page, index) => {
			if (index === 0) {
				// Dedup to avoid UI glitches if server returns it later
				const exists = page[itemKey].some(item => item.id === newItem.id)
				return {
					...page,
					[itemKey]: exists ? page[itemKey] : [newItem, ...page[itemKey]],
				}
			}
			return page
		}),
	}
}

// --- Engagement Specific Helpers ---

/**
 * Updates a specific comment across all engagement caches (main list and thread lists)
 */
export function updateCommentAcrossCaches(qc: QueryClient, commentId: string, updater: (comment: Comment) => Comment) {
	// 1. Update in main comment lists
	qc.setQueriesData({ queryKey: queryKeys.engagement.commentsRoot }, (old: InfiniteData<CommentsPage> | undefined) =>
		updateInfiniteData(old, 'comments', items => items.map(c => (c.id === commentId ? updater(c) : c)))
	)

	// 2. Update in reply thread lists
	qc.setQueriesData({ queryKey: queryKeys.engagement.repliesRoot }, (old: InfiniteData<RepliesPage> | undefined) =>
		updateInfiniteData(old, 'replies', items => items.map(r => (r.id === commentId ? updater(r) : r)))
	)
}

/**
 * Removes a comment from all engagement caches
 */
export function removeCommentAcrossCaches(qc: QueryClient, commentId: string, parentId?: string | null) {
	// 1. Remove from main lists
	qc.setQueriesData({ queryKey: queryKeys.engagement.commentsRoot }, (old: InfiniteData<CommentsPage> | undefined) =>
		updateInfiniteData(old, 'comments', items =>
			items
				.filter(c => c.id !== commentId)
				// If this was a reply and the parent is in this page, decrement count
				.map(c => (parentId && c.id === parentId ? { ...c, repliesCount: Math.max(0, c.repliesCount - 1) } : c))
		)
	)

	// 2. Remove from replies lists
	qc.setQueriesData({ queryKey: queryKeys.engagement.repliesRoot }, (old: InfiniteData<RepliesPage> | undefined) =>
		updateInfiniteData(old, 'replies', items => items.filter(r => r.id !== commentId))
	)
}

/**
 * Increments the repliesCount of a parent comment in the cache
 */
export function incrementReplyCount(qc: QueryClient, parentId: string) {
	qc.setQueriesData({ queryKey: queryKeys.engagement.commentsRoot }, (old: InfiniteData<CommentsPage> | undefined) =>
		updateInfiniteData(old, 'comments', items =>
			items.map(c => (c.id === parentId ? { ...c, repliesCount: (c.repliesCount || 0) + 1 } : c))
		)
	)
}

/**
 * Adds a comment to the main lists
 */
export function prependCommentToCaches(qc: QueryClient, newComment: Comment) {
	qc.setQueriesData({ queryKey: queryKeys.engagement.commentsRoot }, (old: InfiniteData<CommentsPage> | undefined) =>
		prependToInfiniteData(old, 'comments', newComment)
	)
}

/**
 * Adds a reply to a specific thread's cache
 */
export function prependReplyToThread(qc: QueryClient, parentId: string, newReply: Comment) {
	qc.setQueriesData({ queryKey: queryKeys.engagement.replies(parentId) }, (old: InfiniteData<RepliesPage> | undefined) =>
		prependToInfiniteData(old, 'replies', newReply)
	)
}

/**
 * Optimistically toggles a like in the comments cache
 */
export function toggleLikeInComments(qc: QueryClient, id: string, liked: boolean) {
	qc.setQueriesData({ queryKey: queryKeys.engagement.commentsRoot }, (old: InfiniteData<CommentsPage> | undefined) =>
		updateInfiniteData(old, 'comments', items =>
			items.map(c =>
				c.id === id ? { ...c, isLiked: liked, likesCount: Math.max(0, c.likesCount + (liked ? 1 : -1)) } : c
			)
		)
	)
}

/**
 * Optimistically toggles a like in the replies cache
 */
export function toggleLikeInReplies(qc: QueryClient, id: string, liked: boolean) {
	qc.setQueriesData({ queryKey: queryKeys.engagement.repliesRoot }, (old: InfiniteData<RepliesPage> | undefined) =>
		updateInfiniteData(old, 'replies', items =>
			items.map(r =>
				r.id === id ? { ...r, isLiked: liked, likesCount: Math.max(0, r.likesCount + (liked ? 1 : -1)) } : r
			)
		)
	)
}

/**
 * Optimistically updates the specific likes list for a target
 */
export function toggleLikeInLikesList(
	qc: QueryClient,
	id: string,
	type: LikeType,
	liked: boolean,
	user?: EngagementUser
) {
	qc.setQueryData(queryKeys.engagement.likes(id, type), (old: Like[] | undefined) => {
		if (!old) return old

		if (liked) {
			if (!user) return old

			const exists = old.some(like => like.userId === user.id)
			if (exists) return old

			return [
				{
					id: 'optimistic',
					userId: user.id,
					targetId: id,
					targetType: type,
					user,
				},
				...old,
			]
		}

		return old.filter(like => like.userId !== user?.id)
	})
}

/**
 * Optimistically toggles a like in workout caches (discover and history)
 */
export function toggleLikeInWorkouts(qc: QueryClient, id: string, liked: boolean) {
	// 1. Update in discover feed
	qc.setQueriesData({ queryKey: queryKeys.workouts.discover }, (old: InfiniteData<{ workouts: any[] }> | undefined) =>
		updateInfiniteData(old, 'workouts', items =>
			items.map((w: any) =>
				w.id === id ? { ...w, isLiked: liked, likesCount: Math.max(0, w.likesCount + (liked ? 1 : -1)) } : w
			)
		)
	)

	// 2. Update in user history
	qc.setQueriesData({ queryKey: queryKeys.workouts.all }, (old: InfiniteData<{ workouts: any[] }> | undefined) =>
		updateInfiniteData(old, 'workouts', items =>
			items.map((w: any) =>
				w.id === id ? { ...w, isLiked: liked, likesCount: Math.max(0, w.likesCount + (liked ? 1 : -1)) } : w
			)
		)
	)

	// 3. Update in single workout detail
	qc.setQueryData(queryKeys.workouts.byId(id), (old: any) => {
		if (!old) return old
		return {
			...old,
			isLiked: liked,
			likesCount: Math.max(0, old.likesCount + (liked ? 1 : -1)),
		}
	})
}
