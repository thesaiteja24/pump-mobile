import { useAuth } from '@/stores/authStore'
import { Comment as EngagementComment, useEngagementStore } from '@/stores/engagementStore'
import { formatTimeAgo } from '@/utils/time'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import React, { useEffect, useState } from 'react'
import { Image, Text, TouchableOpacity, View, useColorScheme } from 'react-native'

const CommentItem = ({
	comment,
	onReplyPress,
	onOptionsPress,
	onViewReplies,
	isThreadParent = false,
	depth = 0,
}: {
	comment: EngagementComment
	onReplyPress: (comment: EngagementComment) => void
	onOptionsPress: (comment: EngagementComment) => void
	onViewReplies?: (comment: EngagementComment) => void
	isThreadParent?: boolean
	depth?: number
}) => {
	const isDark = useColorScheme() === 'dark'
	const textColor = isDark ? 'white' : 'black'
	const subTextColor = isDark ? '#a3a3a3' : '#525252'

	// For nested replies (depth > 0)
	const replies = useEngagementStore(state => state.replies[comment.id])
	const fetchReplies = useEngagementStore(state => state.fetchReplies)

	const { commentLikes, fetchCommentLikes, toggleCommentLike } = useEngagementStore()

	const user = useAuth(state => state.user)
	const userId = user?.userId

	useEffect(() => {
		fetchCommentLikes(comment.id)
	}, [comment.id])

	const currentLikes = commentLikes[comment.id] || []
	const isLikedByMe = user && currentLikes.some(like => like.userId === userId)

	const handleToggleLike = () => {
		if (!user || !userId) return
		toggleCommentLike(comment.id, {
			id: userId,
			firstName: user.firstName || '',
			lastName: user.lastName || '',
			profilePicUrl: user.profilePicUrl || null,
		})
	}

	// Automatically expand if thread parent or a first-level nested reply with pre-fetched replies
	const shouldBeExpandedByDefault = isThreadParent || (depth === 1 && !!replies && replies.length > 0)
	const [expanded, setExpanded] = useState(shouldBeExpandedByDefault)

	const toggleExpand = () => {
		if (!expanded && !replies) {
			fetchReplies(comment.id, true)
		}
		setExpanded(!expanded)
	}

	const hasReplies = (comment._count?.replies || 0) > 0
	const remainingRepliesCount = hasReplies ? comment._count.replies - (replies?.length || 0) : 0

	// YouTube style vertical line alignment
	const avatarSize = 24

	const paddingStyles = {
		flexDirection: 'row' as const,
		paddingTop: depth === 1 ? 0 : 16,
		paddingBottom: depth === 1 ? 32 : 0,
		paddingLeft: depth > 0 ? 0 : 16,
		paddingRight: depth > 1 ? 0 : 16,
	}

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
					<Text className="text-sm font-semibold text-blue-500">{comment._count?.replies || 0} replies</Text>
				</TouchableOpacity>
			)}

			{/* Inline Toggle Replies Action for nested levels */}
			{hasReplies && depth > 0 && !expanded && !isThreadParent && (
				<TouchableOpacity className="ml-5 flex-row items-center" onPress={toggleExpand}>
					<Text className="text-sm font-semibold text-blue-500">{comment._count?.replies || 0} replies</Text>
				</TouchableOpacity>
			)}
		</View>
	)

	const renderNestedReplies = () => {
		if (!expanded || !replies) return null

		return (
			<View className="mt-2">
				{replies.map(reply => (
					<CommentItem
						key={reply.id}
						comment={reply}
						depth={depth + 1}
						onReplyPress={onReplyPress}
						onOptionsPress={onOptionsPress}
					/>
				))}

				{/* Paginated "Show more" button */}
				{remainingRepliesCount > 0 && (
					<TouchableOpacity
						className="mt-2 flex-row items-center pt-1"
						onPress={() => fetchReplies(comment.id, false)}
					>
						<Text className="text-sm font-bold text-blue-500">
							Show {remainingRepliesCount} more replies
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

export default CommentItem
