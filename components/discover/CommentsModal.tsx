import { Comment as EngagementComment, useEngagementStore } from '@/stores/engagementStore'
import { formatTimeAgo } from '@/utils/time'
import { Ionicons } from '@expo/vector-icons'
import {
	BottomSheetBackdrop,
	BottomSheetFlatList,
	BottomSheetFooter,
	BottomSheetModal,
	BottomSheetTextInput,
} from '@gorhom/bottom-sheet'
import React, { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react'
import {
	ActivityIndicator,
	Dimensions,
	Image,
	Keyboard,
	ScrollView,
	Text,
	TextInput,
	TouchableOpacity,
	useColorScheme,
	View,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

export interface CommentsModalHandle {
	present: () => void
	dismiss: () => void
}

type Props = {
	workoutId: string
	onClose?: () => void
}

// Placeholder for like function
const placeholderToggleLike = () => {
	// To be implemented later
}

const CommentItem = ({
	comment,
	onReplyPress,
	onViewReplies,
	isThreadParent = false,
	depth = 0,
}: {
	comment: EngagementComment
	onReplyPress: (comment: EngagementComment) => void
	onViewReplies?: (comment: EngagementComment) => void
	isThreadParent?: boolean
	depth?: number
}) => {
	const isDark = useColorScheme() === 'dark'
	const textColor = isDark ? 'white' : 'black'
	const subTextColor = isDark ? '#a3a3a3' : '#525252'

	// For nested replies (depth > 0)
	const replies = useEngagementStore(state => state.replies[comment.id])
	const [expanded, setExpanded] = useState(false)
	const fetchReplies = useEngagementStore(state => state.fetchReplies)

	const toggleExpand = () => {
		if (!expanded && !replies) {
			fetchReplies(comment.id, true)
		}
		setExpanded(!expanded)
	}

	const hasReplies = comment._count.replies > 0

	// YouTube style vertical line alignment
	const avatarSize = 34 // Slightly smaller to match YouTube
	const paddingLeft = 16

	return (
		<View className="flex-row py-3" style={{ paddingLeft }}>
			<View className="mr-3 items-center" style={{ width: avatarSize }}>
				<Image
					source={{
						uri:
							comment.user?.profilePicUrl ||
							'https://upload.wikimedia.org/wikipedia/commons/7/7c/Profile_avatar_placeholder_large.png',
					}}
					style={{ width: avatarSize, height: avatarSize, borderRadius: avatarSize / 2 }}
				/>
				{/* Draw vertical line for nested replies if expanded */}
				{expanded && hasReplies && (
					<View
						className="mt-2 flex-1 bg-neutral-300 dark:bg-neutral-700"
						style={{ width: 1.5, marginBottom: -12 }}
					/>
				)}
			</View>

			<View className="flex-1 pr-4">
				<View className="flex-row items-center">
					<Text className="text-sm font-bold" style={{ color: textColor }}>
						@{comment.user?.firstName || 'Unknown'}
					</Text>
					<Text className="ml-2 text-xs" style={{ color: subTextColor }}>
						{formatTimeAgo(new Date(comment.createdAt))}
					</Text>
				</View>

				<Text className="mt-1 text-[15px]" style={{ color: textColor }}>
					{comment.content}
				</Text>

				<View className="mt-2 flex-row items-center pb-1">
					<TouchableOpacity onPress={placeholderToggleLike} className="flex-row items-center">
						<Ionicons name="heart-outline" size={16} color={textColor} />
						<Text className="ml-1 text-xs font-medium" style={{ color: subTextColor }}>
							{comment.likesCount > 0 ? comment.likesCount : ''}
						</Text>
					</TouchableOpacity>
					<TouchableOpacity onPress={placeholderToggleLike} className="ml-5">
						<Ionicons name="heart-dislike-outline" size={16} color={textColor} />
					</TouchableOpacity>
					<TouchableOpacity className="ml-5" onPress={() => onReplyPress(comment)}>
						<Text className="text-xs font-semibold" style={{ color: textColor }}>
							Reply
						</Text>
					</TouchableOpacity>
				</View>

				{/* Action to view replies based on context */}
				{hasReplies && depth === 0 && !isThreadParent && onViewReplies && (
					<TouchableOpacity className="mt-1 flex-row items-center" onPress={() => onViewReplies(comment)}>
						<Text className="text-[13px] font-bold text-blue-500">{comment._count.replies} replies</Text>
					</TouchableOpacity>
				)}

				{/* Nested inline replies for deeper levels */}
				{hasReplies && depth > 0 && !expanded && (
					<TouchableOpacity className="mt-1 flex-row items-center" onPress={toggleExpand}>
						<Text className="text-[13px] font-bold text-blue-500">{comment._count.replies} replies</Text>
					</TouchableOpacity>
				)}

				{expanded && replies && (
					<View className="mt-3">
						{replies.map(reply => (
							<CommentItem key={reply.id} comment={reply} depth={depth + 1} onReplyPress={onReplyPress} />
						))}
					</View>
				)}
			</View>
		</View>
	)
}

const CustomFooter = forwardRef(
	({ animatedFooterPosition, workoutId, viewingThreadId, replyingTo, setReplyingTo }: any, ref: any) => {
		const [inputValue, setInputValue] = useState('')
		const insets = useSafeAreaInsets()
		const isDark = useColorScheme() === 'dark'
		const textColor = isDark ? 'white' : 'black'
		const bgColor = isDark ? '#171717' : 'white'
		const borderColor = isDark ? '#262626' : '#e5e5e5'
		const { addComment, addReply, commenting, replying } = useEngagementStore()
		const enableSubmit = commenting || replying

		const inputRef = useRef<TextInput>(null)

		useImperativeHandle(ref, () => ({
			focus: () => {
				inputRef.current?.focus()
			},
		}))

		const handleSubmit = async () => {
			if (!inputValue.trim()) return
			try {
				if (replyingTo) {
					await addReply(workoutId, replyingTo.id, inputValue.trim())
				} else if (viewingThreadId) {
					await addReply(workoutId, viewingThreadId, inputValue.trim())
				} else {
					await addComment(workoutId, inputValue.trim())
				}
				setInputValue('')
				setReplyingTo(null)
				Keyboard.dismiss()
			} catch (error) {
				console.error(error)
			}
		}

		useEffect(() => {
			if (replyingTo && inputRef.current) {
				requestAnimationFrame(() => {
					inputRef.current?.focus()
				})
			}
		}, [replyingTo])

		return (
			<BottomSheetFooter animatedFooterPosition={animatedFooterPosition}>
				<View
					className="border-t px-4 py-3"
					style={{ backgroundColor: bgColor, borderColor, zIndex: 999, paddingBottom: insets.bottom }}
				>
					{replyingTo && (
						<View className="mb-2 flex-row items-center justify-between rounded-t-lg bg-neutral-200 px-3 py-2 dark:bg-neutral-800">
							<Text className="text-xs font-medium text-neutral-600 dark:text-neutral-400">
								Replying to @{replyingTo.user?.firstName}
							</Text>
							<TouchableOpacity onPress={() => setReplyingTo(null)}>
								<Ionicons name="close-circle" size={16} color={isDark ? '#a3a3a3' : '#525252'} />
							</TouchableOpacity>
						</View>
					)}
					<View className="flex-row items-center pt-1" style={{ position: 'relative' }}>
						<BottomSheetTextInput
							// @ts-ignore
							ref={inputRef}
							value={inputValue}
							onChangeText={setInputValue}
							placeholder={replyingTo || viewingThreadId ? 'Add a reply...' : 'Add a comment...'}
							placeholderTextColor={isDark ? '#a3a3a3' : '#737373'}
							className="max-h-[100px] min-h-[44px] flex-1 rounded-full border px-4 py-2"
							style={{
								color: textColor,
								backgroundColor: isDark ? '#262626' : '#f5f5f5',
								borderColor: isDark ? '#404040' : '#e5e5e5',
							}}
							multiline
							editable={!enableSubmit}
						/>
						<TouchableOpacity
							className="ml-3 h-[44px] w-[44px] items-center justify-center rounded-full bg-blue-500"
							disabled={!inputValue.trim()}
							style={{ opacity: inputValue.trim() ? 1 : 0.5 }}
							onPress={handleSubmit}
						>
							{!enableSubmit ? (
								<Ionicons name="send" size={18} color="white" style={{ marginLeft: 2 }} />
							) : (
								<ActivityIndicator size="small" color="white" />
							)}
						</TouchableOpacity>
					</View>
				</View>
			</BottomSheetFooter>
		)
	}
)

const CommentsModal = forwardRef<CommentsModalHandle, Props>(({ workoutId, onClose }, ref) => {
	const bottomSheetModalRef = useRef<BottomSheetModal>(null)
	const insets = useSafeAreaInsets()
	const isDark = useColorScheme() === 'dark'
	const screenWidth = Dimensions.get('window').width

	const { fetchComments, fetchReplies, comments, replies, loadingComments, loadingReplies } = useEngagementStore()
	const workoutComments = comments[workoutId] || []

	// UI State
	const [viewingThreadId, setViewingThreadId] = useState<string | null>(null)
	// Which comment we are explicitly replying to (can be thread root or a nested reply)
	const [replyingTo, setReplyingTo] = useState<EngagementComment | null>(null)

	const sliderRef = useRef<ScrollView>(null)
	const footerRef = useRef<any>(null)

	// Initial load tracking
	const initializedWorkout = useRef<string | null>(null)

	useImperativeHandle(ref, () => ({
		present: () => {
			if (initializedWorkout.current !== workoutId) {
				fetchComments(workoutId, true)
				initializedWorkout.current = workoutId
			}
			bottomSheetModalRef.current?.present()
		},
		dismiss: () => {
			bottomSheetModalRef.current?.dismiss()
		},
	}))

	// Adjust snap points for typical comment sheets
	const snapPoints = useMemo(() => ['75%'], [])

	const handleClose = () => {
		onClose?.()
		// Wait for modal to close fully before resetting slider
		setTimeout(() => {
			sliderRef.current?.scrollTo({ x: 0, animated: false })
			setViewingThreadId(null)
			setReplyingTo(null)
		}, 300)
	}

	const handleViewReplies = (comment: EngagementComment) => {
		setViewingThreadId(comment.id)
		fetchReplies(comment.id, true)
		sliderRef.current?.scrollTo({ x: screenWidth, animated: true })
	}

	const handleBackToMain = () => {
		sliderRef.current?.scrollTo({ x: 0, animated: true })
		setTimeout(() => {
			setViewingThreadId(null)
			setReplyingTo(null)
		}, 300)
	}

	const handleReplyPress = (comment: EngagementComment) => {
		setReplyingTo(comment)
	}

	const activeThreadComment = workoutComments.find(c => c.id === viewingThreadId)
	const threadRepliesList = viewingThreadId ? replies[viewingThreadId] || [] : []

	const textColor = isDark ? 'white' : 'black'
	const bgColor = isDark ? '#171717' : 'white'
	const borderColor = isDark ? '#262626' : '#e5e5e5'

	const isLoadingComments = loadingComments[workoutId] || false
	const isLoadingReplies = viewingThreadId ? loadingReplies[viewingThreadId] || false : false

	const renderBackdrop = useCallback(
		(props: any) => <BottomSheetBackdrop {...props} appearsOnIndex={0} disappearsOnIndex={-1} opacity={0.4} />,
		[]
	)

	const renderFooter = useCallback(
		(props: any) => (
			<CustomFooter
				{...props}
				ref={footerRef}
				workoutId={workoutId}
				viewingThreadId={viewingThreadId}
				replyingTo={replyingTo}
				setReplyingTo={setReplyingTo}
			/>
		),
		[workoutId, viewingThreadId, replyingTo]
	)

	return (
		<BottomSheetModal
			ref={bottomSheetModalRef}
			snapPoints={snapPoints}
			backdropComponent={renderBackdrop}
			footerComponent={renderFooter}
			enablePanDownToClose
			onDismiss={handleClose}
			backgroundStyle={{ backgroundColor: bgColor }}
			handleIndicatorStyle={{ backgroundColor: isDark ? '#525252' : '#d1d5db' }}
			keyboardBehavior="extend" // Important for iOS keyboard padding
			enableDynamicSizing={false}
		>
			<ScrollView
				ref={sliderRef}
				horizontal
				pagingEnabled
				showsHorizontalScrollIndicator={false}
				keyboardShouldPersistTaps="handled"
			>
				{/* View 1: Main Comments */}
				<View style={{ width: screenWidth, flex: 1 }}>
					<View className="flex-row items-center justify-between border-b px-4 pb-3" style={{ borderColor }}>
						<Text className="text-lg font-bold" style={{ color: textColor }}>
							Comments{' '}
							<Text className="text-sm font-normal text-neutral-500">{workoutComments.length}</Text>
						</Text>
						<TouchableOpacity onPress={() => bottomSheetModalRef.current?.dismiss()}>
							<Ionicons name="close" size={24} color={textColor} />
						</TouchableOpacity>
					</View>

					<BottomSheetFlatList
						data={workoutComments}
						keyExtractor={(item: EngagementComment) => item.id}
						renderItem={({ item }: { item: EngagementComment }) => (
							<CommentItem
								comment={item}
								onViewReplies={handleViewReplies}
								onReplyPress={handleReplyPress}
							/>
						)}
						contentContainerStyle={{ paddingBottom: '30%' }}
						ListEmptyComponent={
							<View className="items-center justify-center py-8">
								{!isLoadingComments && workoutComments.length === 0 ? (
									<Text className="text-neutral-500 dark:text-neutral-400">
										No comments yet. Be the first!
									</Text>
								) : (
									<ActivityIndicator size="small" color={textColor} />
								)}
							</View>
						}
						ListFooterComponent={
							isLoadingComments && workoutComments.length > 0 ? (
								<View className="items-center justify-center py-4">
									<ActivityIndicator size="small" color={textColor} />
								</View>
							) : null
						}
						onEndReached={() => {
							if (!isLoadingComments) {
								fetchComments(workoutId, false)
							}
						}}
						onEndReachedThreshold={0.5}
						keyboardShouldPersistTaps="handled"
					/>
				</View>

				{/* View 2: Replies Thread */}
				<View style={{ width: screenWidth, flex: 1 }}>
					<View className="flex-row items-center border-b px-4 pb-3" style={{ borderColor }}>
						<TouchableOpacity onPress={handleBackToMain} className="mr-3">
							<Ionicons name="arrow-back" size={24} color={textColor} />
						</TouchableOpacity>
						<Text className="text-lg font-bold" style={{ color: textColor }}>
							Replies
						</Text>
					</View>

					<BottomSheetFlatList
						data={threadRepliesList}
						keyExtractor={(item: EngagementComment) => item.id}
						renderItem={({ item }: { item: EngagementComment }) => (
							<CommentItem comment={item} depth={1} onReplyPress={handleReplyPress} />
						)}
						contentContainerStyle={{ paddingBottom: '30%' }}
						ListEmptyComponent={
							<View className="items-center justify-center py-8">
								{isLoadingReplies ? <ActivityIndicator size="small" color={textColor} /> : null}
							</View>
						}
						ListFooterComponent={
							isLoadingReplies && threadRepliesList.length > 0 ? (
								<View className="items-center justify-center py-4">
									<ActivityIndicator size="small" color={textColor} />
								</View>
							) : null
						}
						onEndReached={() => {
							if (viewingThreadId && !isLoadingReplies) {
								fetchReplies(viewingThreadId, false)
							}
						}}
						onEndReachedThreshold={0.5}
						keyboardShouldPersistTaps="handled"
					/>
				</View>
			</ScrollView>
		</BottomSheetModal>
	)
})

CommentsModal.displayName = 'CommentsModal'

export default CommentsModal
