import { useRepliesQuery, useToggleLikeMutation } from '@/hooks/queries/useEngagement'
import { useUserQuery } from '@/hooks/queries/useUser'
import { useAuth } from '@/stores/authStore'
import { Comment } from '@/types/engagement'
import { SelfUser } from '@/types/user'
import { formatTimeAgo } from '@/utils/time'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import React, { memo, useMemo, useState } from 'react'
import { Image, Text, TouchableOpacity, View, useColorScheme } from 'react-native'

const CommentItem = ({
	comment,
	workoutId,
	onReplyPress,
	onOptionsPress,
	onViewReplies,
	isThreadParent = false,
	depth = 0,
}: {
	comment: Comment
	workoutId: string
	onReplyPress: (comment: Comment) => void
	onOptionsPress: (comment: Comment) => void
	onViewReplies?: (comment: Comment) => void
	isThreadParent?: boolean
	depth?: number
}) => {
	const isDark = useColorScheme() === 'dark'
	const textColor = isDark ? 'white' : 'black'
	const subTextColor = isDark ? '#a3a3a3' : '#525252'

	const currentUserId = useAuth(state => state.userId)
	const { data: userData } = useUserQuery(currentUserId!)
	const user = userData as SelfUser | null
	const userId = user?.id

	// TanStack Query hooks for comment engagement
	const toggleLikeMutation = useToggleLikeMutation()

	// Replies — only load when needed
	const [expanded, setExpanded] = useState(isThreadParent || depth === 1)
	const {
		data: repliesPages,
		fetchNextPage,
		hasNextPage,
		isFetchingNextPage,
	} = useRepliesQuery(expanded || isThreadParent ? comment.id : undefined)

	const replies = useMemo(() => repliesPages?.pages.flatMap(p => p.replies) ?? [], [repliesPages])

	const isLikedByMe = comment.isLiked

	const handleToggleLike = () => {
		if (!user || !userId) return
		toggleLikeMutation.mutate({
			id: comment.id,
			type: 'comment',
			liked: !isLikedByMe,
			user: user
				? {
						id: userId!,
						firstName: user.firstName || '',
						lastName: user.lastName || '',
						profilePicUrl: user.profilePicUrl || null,
					}
				: undefined,
			workoutId: workoutId,
		})
	}

	const toggleExpand = () => {
		setExpanded(!expanded)
	}

	const hasReplies = (comment.repliesCount || 0) > 0
	const remainingRepliesCount = hasReplies ? comment.repliesCount - replies.length : 0

	const avatarSize = 24

	const paddingStyles = useMemo(
		() => ({
			flexDirection: 'row' as const,
			paddingTop: depth === 1 ? 0 : 16,
			paddingBottom: depth === 1 ? 32 : 0,
			paddingLeft: depth > 0 ? 0 : 16,
			paddingRight: depth > 1 ? 0 : 16,
		}),
		[depth]
	)

	const renderAvatarColumn = () => (
		<View className="mr-2 items-center gap-4" style={{ width: avatarSize }}>
			<Image
				source={
					comment.user?.profilePicUrl
						? { uri: comment.user?.profilePicUrl }
						: require('../../assets/images/icon.png')
				}
				style={{
					width: avatarSize,
					height: avatarSize,
					borderRadius: avatarSize / 2,
					borderColor: isDark ? 'white' : '#black',
					borderWidth: 0.25,
				}}
			/>
		</View>
	)

	const renderCommentHeader = () => (
		<View className="flex-row items-center justify-between">
			<View className="flex-row items-center">
				<Text className="text-sm font-bold" style={{ color: textColor }}>
					@{comment.user?.firstName || 'Unknown'}
				</Text>
				<Text className="ml-2 text-xs" style={{ color: subTextColor }}>
					{formatTimeAgo(new Date(comment.createdAt))}
				</Text>
			</View>
			{comment.user?.id === userId && (
				<View style={{ width: 40, alignItems: 'flex-end' }}>
					<TouchableOpacity onPress={() => onOptionsPress(comment)}>
						<MaterialCommunityIcons name="dots-horizontal" size={24} color={textColor} />
					</TouchableOpacity>
				</View>
			)}
		</View>
	)

	const renderCommentActions = () => (
		<View className="mt-2 flex-row items-center pb-1">
			<TouchableOpacity onPress={handleToggleLike} className="flex-row items-center">
				<MaterialCommunityIcons
					name={isLikedByMe ? 'cards-heart' : 'heart-outline'}
					size={20}
					color={isLikedByMe ? '#F43F5E' : textColor}
				/>
				<Text className="ml-1 text-xs font-medium" style={{ color: subTextColor }}>
					{comment.likesCount > 0 ? comment.likesCount : ''}
				</Text>
			</TouchableOpacity>
			<TouchableOpacity className="ml-5" onPress={() => onReplyPress(comment)}>
				<Text className="text-xs font-semibold" style={{ color: textColor }}>
					Reply
				</Text>
			</TouchableOpacity>

			{/* Top-level View Replies Action */}
			{hasReplies && depth === 0 && !isThreadParent && onViewReplies && (
				<TouchableOpacity className="ml-5 flex-row items-center" onPress={() => onViewReplies(comment)}>
					<Text className="text-sm font-semibold text-blue-500">{comment.repliesCount || 0} replies</Text>
				</TouchableOpacity>
			)}

			{/* Inline Toggle Replies Action for nested levels */}
			{hasReplies && depth > 0 && !expanded && !isThreadParent && (
				<TouchableOpacity className="ml-5 flex-row items-center" onPress={toggleExpand}>
					<Text className="text-sm font-semibold text-blue-500">{comment.repliesCount || 0} replies</Text>
				</TouchableOpacity>
			)}
		</View>
	)

	const renderNestedReplies = () => {
		if (!expanded || replies.length === 0) return null

		return (
			<View className="mt-2">
				{replies.map(reply => (
					<CommentItem
						key={reply.id}
						comment={reply}
						workoutId={workoutId}
						depth={depth + 1}
						onReplyPress={onReplyPress}
						onOptionsPress={onOptionsPress}
					/>
				))}

				{/* Load more replies */}
				{(hasNextPage || isFetchingNextPage) && (
					<TouchableOpacity
						className="mt-2 flex-row items-center pt-1"
						onPress={() => fetchNextPage()}
						disabled={isFetchingNextPage}
					>
						<Text className="text-sm font-bold text-blue-500">
							{isFetchingNextPage ? 'Loading...' : `Show ${remainingRepliesCount} more replies`}
						</Text>
					</TouchableOpacity>
				)}
			</View>
		)
	}

	return (
		<View style={paddingStyles}>
			{renderAvatarColumn()}
			<View className="flex-1">
				{renderCommentHeader()}
				<Text className="mt-1 text-[15px]" style={{ color: textColor }}>
					{comment.content}
				</Text>
				{renderCommentActions()}
				{renderNestedReplies()}
			</View>
		</View>
	)
}

export default memo(CommentItem)
