export interface SearchedUser {
	id: string
	firstName: string
	lastName: string
	profilePicUrl: string | null
	isFollowing: boolean
	isPro: boolean
	proSubscriptionType: string | null
	followLoading: boolean
}

export interface EngagementUser {
	id: string
	firstName: string
	lastName: string
	profilePicUrl: string | null
}

export interface Comment {
	id: string
	userId: string
	workoutId: string
	parentId: string | null

	content: string
	likesCount: number
	repliesCount: number
	isLiked?: boolean

	createdAt: string
	updatedAt: string
	deletedAt: string | null

	user: EngagementUser
}

export interface CommentsPage {
	comments: Comment[]
	nextCursor: string | null
}

export interface RepliesPage {
	replies: Comment[]
	nextCursor: string | null
}

export type LikeType = 'workout' | 'comment'
export interface Like {
	id: string
	userId: string
	targetId: string
	targetType: LikeType
	user: EngagementUser
}
