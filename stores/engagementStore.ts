import { createCommentService, getCommentsService, getRepliesService } from '@/services/engagementService'
import { create } from 'zustand'

export interface UserSnippet {
	id: string
	firstName: string
	lastName: string
	profilePicUrl: string | null
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
}

interface EngagementState {
	comments: Record<string, Comment[]>
	replies: Record<string, Comment[]>
	loading: boolean
	commenting: boolean
	replying: boolean
	loadingComments: Record<string, boolean>
	loadingReplies: Record<string, boolean>
	cursors: Record<string, string | null>

	fetchComments: (workoutId: string, refresh?: boolean) => Promise<void>
	fetchReplies: (commentId: string, refresh?: boolean) => Promise<void>
	addComment: (workoutId: string, content: string) => Promise<void>
	addReply: (workoutId: string, parentId: string, content: string) => Promise<void>
}

export const useEngagementStore = create<EngagementState>((set, get) => ({
	comments: {},
	replies: {},
	loading: false,
	commenting: false,
	replying: false,
	loadingComments: {},
	loadingReplies: {},
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

			set(prev => ({
				comments: {
					...prev.comments,
					[workoutId]: refresh ? fetchedComments : [...(prev.comments[workoutId] || []), ...fetchedComments],
				},
				cursors: {
					...prev.cursors,
					[workoutId]: nextCursor,
				},
			}))
		} catch (error) {
			console.error('Failed to fetch comments', error)
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
			const res = await getRepliesService(commentId, 10, cursor)
			const fetchedReplies = res.data.replies
			const nextCursor = res.data.nextCursor

			set(prev => ({
				replies: {
					...prev.replies,
					[commentId]: refresh ? fetchedReplies : [...(prev.replies[commentId] || []), ...fetchedReplies],
				},
				cursors: {
					...prev.cursors,
					[commentId]: nextCursor,
				},
			}))
		} catch (error) {
			console.error('Failed to fetch replies', error)
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
}))
