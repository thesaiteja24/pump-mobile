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
	replies?: Comment[]
}
