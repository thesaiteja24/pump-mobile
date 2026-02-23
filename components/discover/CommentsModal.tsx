import { CustomModal, ModalHandle } from '@/components/ui/CustomModal'
import { DeleteConfirmModal, DeleteConfirmModalHandle } from '@/components/ui/DeleteConfirmModal'
import { Comment as EngagementComment, useEngagementStore } from '@/stores/engagementStore'
import { formatTimeAgo } from '@/utils/time'
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons'
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
	Alert,
	BackHandler,
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
				style={{ width: avatarSize, height: avatarSize, borderRadius: avatarSize / 2 }}
			/>
			{/* Parent Vertical Timeline */}
			{hasReplies && (expanded || isThreadParent) && (
				<View
					style={{
						position: 'absolute',
						top: 24,
						bottom: 0,
						left: avatarSize / 2 - 1,
						width: 0.5,
						backgroundColor: '#e5e7eb',
					}}
				/>
			)}
			{/* Connecting Elbow Line for Nested Reply */}
			{depth > 0 && (
				<View
					style={{
						position: 'absolute',
						top: -4, // 4 - 8 for vertical centering
						left: -20,
						width: 20,
						height: 16,
						borderLeftWidth: 0.5,
						borderBottomWidth: 0.5,
						borderColor: '#e5e7eb',
						borderBottomLeftRadius: 8,
					}}
				/>
			)}
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
			<View style={{ width: 40, alignItems: 'flex-end' }}>
				<TouchableOpacity onPress={() => onOptionsPress(comment)}>
					<MaterialCommunityIcons name="dots-horizontal" size={24} color={textColor} />
				</TouchableOpacity>
			</View>
		</View>
	)

	const renderCommentActions = () => (
		<View className="mt-2 flex-row items-center pb-1">
			<TouchableOpacity onPress={placeholderToggleLike} className="flex-row items-center">
				<Ionicons name="heart-outline" size={20} color={textColor} />
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
	const [selectedCommentForOptions, setSelectedCommentForOptions] = useState<EngagementComment | null>(null)

	const sliderRef = useRef<ScrollView>(null)
	const footerRef = useRef<any>(null)
	const optionsModalRef = useRef<ModalHandle>(null)
	const deleteModalRef = useRef<DeleteConfirmModalHandle>(null)

	const deleteComment = useEngagementStore(state => state.deleteComment)

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

	const handleOptionsPress = (comment: EngagementComment) => {
		setSelectedCommentForOptions(comment)
		optionsModalRef.current?.open()
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

	useEffect(() => {
		const onBackPress = () => {
			// If modal is not open → let default behavior happen
			if (!bottomSheetModalRef.current) return false

			// If inside replies → go back to main comments
			if (viewingThreadId) {
				handleBackToMain()
				return true // prevent default back (app exit)
			}

			// If on main comments → close modal
			bottomSheetModalRef.current?.dismiss()
			return true // prevent default back
		}

		const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress)

		return () => subscription.remove()
	}, [viewingThreadId])

	const renderMainComments = () => (
		<View key="main-comments" style={{ width: screenWidth, flex: 1 }}>
			<View className="flex-row items-center justify-between border-b px-4 pb-3" style={{ borderColor }}>
				<Text className="text-lg font-bold" style={{ color: textColor }}>
					Comments
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
						onOptionsPress={handleOptionsPress}
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
					if (!isLoadingComments && workoutComments.length > 0) {
						fetchComments(workoutId, false)
					}
				}}
				onEndReachedThreshold={0.5}
				keyboardShouldPersistTaps="handled"
			/>
		</View>
	)

	const renderRepliesThread = () => (
		<View key="replies-thread" style={{ width: screenWidth, flex: 1 }}>
			<View className="flex-row items-center border-b px-4 pb-3" style={{ borderColor }}>
				<TouchableOpacity onPress={handleBackToMain} className="mr-3">
					<Ionicons name="arrow-back" size={24} color={textColor} />
				</TouchableOpacity>
				<Text className="text-lg font-bold" style={{ color: textColor }}>
					Replies
				</Text>
			</View>

			<BottomSheetFlatList
				data={activeThreadComment ? [activeThreadComment] : []}
				keyExtractor={(item: EngagementComment) => item.id}
				renderItem={({ item }: { item: EngagementComment }) => (
					<CommentItem
						comment={item}
						depth={0}
						isThreadParent={true}
						onReplyPress={handleReplyPress}
						onOptionsPress={handleOptionsPress}
					/>
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
					if (viewingThreadId && !isLoadingReplies && threadRepliesList.length > 0) {
						fetchReplies(viewingThreadId, false)
					}
				}}
				onEndReachedThreshold={0.5}
				keyboardShouldPersistTaps="handled"
			/>
		</View>
	)

	return (
		<>
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
					{renderMainComments()}
					{renderRepliesThread()}
				</ScrollView>
			</BottomSheetModal>

			<CustomModal ref={optionsModalRef} title="Comment Options">
				<TouchableOpacity
					className="border-b py-3 dark:border-neutral-800"
					style={{ borderColor: isDark ? '#262626' : '#e5e5e5' }}
					onPress={() => {
						optionsModalRef.current?.close()
						Alert.alert('Notice', 'Edit functionality will be implemented soon.')
					}}
				>
					<Text className="text-center text-lg font-medium text-blue-500">Edit</Text>
				</TouchableOpacity>
				<TouchableOpacity
					className="py-3"
					onPress={() => {
						optionsModalRef.current?.close()
						setTimeout(() => deleteModalRef.current?.present(), 300)
					}}
				>
					<Text className="text-center text-lg font-medium text-red-500">Delete</Text>
				</TouchableOpacity>
			</CustomModal>

			<DeleteConfirmModal
				ref={deleteModalRef}
				title="Delete Comment"
				description="Are you sure you want to delete this comment? This action cannot be undone."
				onConfirm={async () => {
					if (selectedCommentForOptions) {
						try {
							await deleteComment(selectedCommentForOptions.id)
						} catch (error) {
							Alert.alert('Error', 'Failed to delete comment.')
						}
					}
				}}
			/>
		</>
	)
})

CommentsModal.displayName = 'CommentsModal'

export default CommentsModal
