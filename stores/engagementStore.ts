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
import { create } from 'zustand'

export interface UserSnippet {
	id: string
	firstName: string
	lastName: string
	profilePicUrl: string | null
}

export interface EngagementLike {
	userId: string
	createdAt: string
	user: UserSnippet | null
}

export interface Comment {
	id: string
	workoutId: string
	userId: string
	content: string
	parentId: string | null
	likesCount: number
	createdAt: string
	updatedAt: string
	deletedAt: string | null
	user: UserSnippet | null
	_count: {
		replies: number
	}
	replies?: Comment[] // Eager loaded Reddit-style nested replies
}

interface EngagementState {
	comments: Record<string, Comment[]>
	replies: Record<string, Comment[]>
	workoutLikes: Record<string, EngagementLike[]>
	commentLikes: Record<string, EngagementLike[]>
	loading: boolean
	commenting: boolean
	replying: boolean
	loadingComments: Record<string, boolean>
	loadingReplies: Record<string, boolean>
	loadingWorkoutLikes: Record<string, boolean>
	loadingCommentLikes: Record<string, boolean>
	cursors: Record<string, string | null>

	fetchComments: (workoutId: string, refresh?: boolean) => Promise<void>
	fetchReplies: (commentId: string, refresh?: boolean) => Promise<void>
	addComment: (workoutId: string, content: string) => Promise<void>
	addReply: (workoutId: string, parentId: string, content: string) => Promise<void>
	editComment: (commentId: string, content: string) => Promise<void>
	deleteComment: (commentId: string) => Promise<void>

	fetchWorkoutLikes: (workoutId: string) => Promise<void>
	toggleWorkoutLike: (workoutId: string, currentUser: UserSnippet) => Promise<void>
	fetchCommentLikes: (commentId: string) => Promise<void>
	toggleCommentLike: (commentId: string, currentUser: UserSnippet) => Promise<void>
}

export const useEngagementStore = create<EngagementState>((set, get) => ({
	comments: {},
	replies: {},
	workoutLikes: {},
	commentLikes: {},
	loading: false,
	commenting: false,
	replying: false,
	loadingComments: {},
	loadingReplies: {},
	loadingWorkoutLikes: {},
	loadingCommentLikes: {},
	cursors: {},

	fetchComments: async (workoutId: string, refresh = false) => {
		const state = get()
		if (state.loadingComments[workoutId]) return

		const cursor = refresh ? undefined : state.cursors[workoutId] || undefined
		if (!refresh && state.cursors[workoutId] === null) return // Reached end

		set(prev => ({
			loading: true,
			loadingComments: { ...prev.loadingComments, [workoutId]: true },
		}))

		try {
			const res = await getCommentsService(workoutId, 20, cursor)
			const fetchedComments = res.data.comments
			const nextCursor = res.data.nextCursor

			set(prev => {
				const mergedReplies = { ...prev.replies }

				// Extract pre-fetched nested replies if present
				fetchedComments.forEach((comment: Comment) => {
					if (comment.replies && comment.replies.length > 0) {
						mergedReplies[comment.id] = comment.replies
					}
				})

				const existingComments = prev.comments[workoutId] || []
				let newCommentsList = refresh ? fetchedComments : [...existingComments, ...fetchedComments]

				// Deduplicate by ID
				const seenCommentIds = new Set<string>()
				newCommentsList = newCommentsList.filter((c: Comment) => {
					if (seenCommentIds.has(c.id)) return false
					seenCommentIds.add(c.id)
					return true
				})

				return {
					comments: {
						...prev.comments,
						[workoutId]: newCommentsList,
					},
					replies: mergedReplies,
					cursors: {
						...prev.cursors,
						[workoutId]: nextCursor,
					},
				}
			})
		} catch (error) {
			console.error('Failed to fetch comments', error)
			set(prev => ({
				cursors: {
					...prev.cursors,
					[workoutId]: null,
				},
			}))
		} finally {
			set(prev => ({
				loading: false,
				loadingComments: { ...prev.loadingComments, [workoutId]: false },
			}))
		}
	},

	fetchReplies: async (commentId: string, refresh = false) => {
		const state = get()
		if (state.loadingReplies[commentId]) return

		const cursor = refresh ? undefined : state.cursors[commentId] || undefined
		if (!refresh && state.cursors[commentId] === null) return // Reached end

		set(prev => ({
			loadingReplies: { ...prev.loadingReplies, [commentId]: true },
		}))

		try {
			const res = await getCommentsService(commentId, 10, cursor, true)
			const fetchedReplies = res.data.replies
			const nextCursor = res.data.nextCursor

			set(prev => {
				const mergedReplies = { ...prev.replies }

				// Extract pre-fetched deep nested replies if present
				fetchedReplies.forEach((reply: Comment) => {
					if (reply.replies && reply.replies.length > 0) {
						mergedReplies[reply.id] = reply.replies
					}
				})

				const existingReplies = mergedReplies[commentId] || []
				let newRepliesList = refresh ? fetchedReplies : [...existingReplies, ...fetchedReplies]

				// Deduplicate by ID
				const seenReplyIds = new Set<string>()
				newRepliesList = newRepliesList.filter((r: Comment) => {
					if (seenReplyIds.has(r.id)) return false
					seenReplyIds.add(r.id)
					return true
				})

				return {
					replies: {
						...mergedReplies,
						[commentId]: newRepliesList,
					},
					cursors: {
						...prev.cursors,
						[commentId]: nextCursor,
					},
				}
			})
		} catch (error) {
			console.error('Failed to fetch replies', error)
			set(prev => ({
				cursors: {
					...prev.cursors,
					[commentId]: null,
				},
			}))
		} finally {
			set(prev => ({
				loadingReplies: { ...prev.loadingReplies, [commentId]: false },
			}))
		}
	},

	addComment: async (workoutId: string, content: string) => {
		set({ commenting: true })

		try {
			const response = await createCommentService(workoutId, { content })

			if (response.success) {
				const newComment = {
					...response.data,
					_count: response.data._count || { replies: 0 },
				}

				set(prev => {
					const existing = prev.comments[workoutId] || []

					// Prevent duplicate
					if (existing.some(c => c.id === newComment.id)) {
						return {}
					}

					return {
						comments: {
							...prev.comments,
							[workoutId]: [newComment, ...existing],
						},
					}
				})
			}
		} catch (error) {
			console.error('Failed to add comment', error)
			throw error
		} finally {
			set({ commenting: false })
		}
	},

	addReply: async (workoutId: string, parentId: string, content: string) => {
		set({ replying: true })

		try {
			const response = await createCommentService(workoutId, { content, parentId })

			if (response.success) {
				const newReply = {
					...response.data,
					_count: response.data._count || { replies: 0 },
				}

				set(prev => {
					// Helper to increment reply count anywhere
					const incrementReplyCount = (list: Comment[]) =>
						list.map(item =>
							item.id === parentId
								? {
										...item,
										_count: {
											...item._count,
											replies: (item._count?.replies || 0) + 1,
										},
									}
								: item
						)

					// First, increment counts across all existing replies maps
					const updatedReplies = Object.fromEntries(
						Object.entries(prev.replies).map(([key, value]) => [key, incrementReplyCount(value)])
					)

					return {
						// 1️⃣ Try increment in top-level comments
						comments: {
							...prev.comments,
							[workoutId]: incrementReplyCount(prev.comments[workoutId] || []),
						},

						// 2️⃣ Apply the increments AND insert the new reply under its parent
						replies: {
							...updatedReplies,
							[parentId]: [...(updatedReplies[parentId] || []), newReply],
						},
					}
				})
			}
		} catch (error) {
			console.error('Failed to add reply', error)
			throw error
		} finally {
			set({ replying: false })
		}
	},

	deleteComment: async (commentId: string) => {
		set(prev => ({ loadingComments: { ...prev.loadingComments, [commentId]: true } }))

		try {
			const response = await deleteCommentService(commentId)

			if (response.success) {
				set(prev => {
					// Helper to remove comment from any list
					const removeComment = (list: Comment[]) => list.filter(item => item.id !== commentId)

					const newComments = Object.fromEntries(
						Object.entries(prev.comments).map(([key, list]) => [key, removeComment(list)])
					)

					const newReplies = Object.fromEntries(
						Object.entries(prev.replies).map(([key, list]) => [key, removeComment(list)])
					)

					return {
						comments: newComments,
						replies: newReplies,
					}
				})
			}
		} catch (error) {
			console.error('Failed to delete comment', error)
			throw error
		} finally {
			set(prev => ({ loadingComments: { ...prev.loadingComments, [commentId]: false } }))
		}
	},

	editComment: async (commentId: string, content: string) => {
		set(prev => ({ loadingComments: { ...prev.loadingComments, [commentId]: true } }))

		try {
			const response = await editCommentService(commentId, content)

			if (response.success) {
				set(prev => {
					// Helper to edit comment in any list
					const editCommentInList = (list: Comment[]) =>
						list.map(item => (item.id === commentId ? { ...item, content: response.data.content } : item))

					const newComments = Object.fromEntries(
						Object.entries(prev.comments).map(([key, list]) => [key, editCommentInList(list)])
					)

					const newReplies = Object.fromEntries(
						Object.entries(prev.replies).map(([key, list]) => [key, editCommentInList(list)])
					)

					return {
						comments: newComments,
						replies: newReplies,
					}
				})
			}
		} catch (error) {
			console.error('Failed to edit comment', error)
			throw error
		} finally {
			set(prev => ({ loadingComments: { ...prev.loadingComments, [commentId]: false } }))
		}
	},

	fetchWorkoutLikes: async (workoutId: string) => {
		const state = get()
		if (state.loadingWorkoutLikes[workoutId]) return

		set(prev => ({ loadingWorkoutLikes: { ...prev.loadingWorkoutLikes, [workoutId]: true } }))

		try {
			const res = await getWorkoutLikesService(workoutId)
			set(prev => ({
				workoutLikes: {
					...prev.workoutLikes,
					[workoutId]: res.data,
				},
			}))
		} catch (error) {
			console.error('Failed to fetch workout likes', error)
		} finally {
			set(prev => ({ loadingWorkoutLikes: { ...prev.loadingWorkoutLikes, [workoutId]: false } }))
		}
	},

	toggleWorkoutLike: async (workoutId: string, currentUser: UserSnippet) => {
		const state = get()
		const currentLikes = state.workoutLikes[workoutId] || []
		const isLiked = currentLikes.some(like => like.userId === currentUser.id)

		// Optimistic update
		set(prev => {
			let newLikes = [...(prev.workoutLikes[workoutId] || [])]
			if (isLiked) {
				newLikes = newLikes.filter(like => like.userId !== currentUser.id)
			} else {
				newLikes.push({
					userId: currentUser.id,
					createdAt: new Date().toISOString(),
					user: currentUser,
				})
			}
			return {
				workoutLikes: {
					...prev.workoutLikes,
					[workoutId]: newLikes,
				},
			}
		})

		try {
			if (isLiked) {
				await deleteWorkoutLikeService(workoutId)
			} else {
				await createWorkoutLikeService(workoutId)
			}
		} catch (error) {
			console.error('Failed to toggle workout like', error)
			// Revert optimistic update
			set(prev => ({
				workoutLikes: {
					...prev.workoutLikes,
					[workoutId]: currentLikes,
				},
			}))
			throw error
		}
	},

	fetchCommentLikes: async (commentId: string) => {
		const state = get()
		if (state.loadingCommentLikes[commentId]) return

		set(prev => ({ loadingCommentLikes: { ...prev.loadingCommentLikes, [commentId]: true } }))

		try {
			const res = await getCommentLikesService(commentId)
			set(prev => ({
				commentLikes: {
					...prev.commentLikes,
					[commentId]: res.data,
				},
			}))
		} catch (error) {
			console.error('Failed to fetch comment likes', error)
		} finally {
			set(prev => ({ loadingCommentLikes: { ...prev.loadingCommentLikes, [commentId]: false } }))
		}
	},

	toggleCommentLike: async (commentId: string, currentUser: UserSnippet) => {
		const state = get()
		const currentLikes = state.commentLikes[commentId] || []
		const isLiked = currentLikes.some(like => like.userId === currentUser.id)

		// Optimistic update for likes tracking
		set(prev => {
			let newLikes = [...(prev.commentLikes[commentId] || [])]
			if (isLiked) {
				newLikes = newLikes.filter(like => like.userId !== currentUser.id)
			} else {
				newLikes.push({
					userId: currentUser.id,
					createdAt: new Date().toISOString(),
					user: currentUser,
				})
			}

			// Helper to update like count on a comment object
			const updateLikeCountInfo = (list: Comment[]) =>
				list.map(item =>
					item.id === commentId
						? {
								...item,
								likesCount: isLiked ? Math.max(0, item.likesCount - 1) : item.likesCount + 1,
							}
						: item
				)

			const newComments = Object.fromEntries(
				Object.entries(prev.comments).map(([key, list]) => [key, updateLikeCountInfo(list)])
			)

			const newReplies = Object.fromEntries(
				Object.entries(prev.replies).map(([key, list]) => [key, updateLikeCountInfo(list)])
			)

			return {
				commentLikes: {
					...prev.commentLikes,
					[commentId]: newLikes,
				},
				comments: newComments,
				replies: newReplies,
			}
		})

		try {
			if (isLiked) {
				await deleteCommentLikeService(commentId)
			} else {
				await createCommentLikeService(commentId)
			}
		} catch (error) {
			console.error('Failed to toggle comment like', error)
			// Revert on error could be implemented here
			throw error
		}
	},
}))
