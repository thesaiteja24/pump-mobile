import { DeleteConfirmModal, DeleteConfirmModalHandle } from '@/components/ui/DeleteConfirmModal'
import { Comment as EngagementComment, useEngagementStore } from '@/stores/engagementStore'
import { Ionicons } from '@expo/vector-icons'
import { BottomSheetBackdrop, BottomSheetFlatList, BottomSheetModal, BottomSheetView } from '@gorhom/bottom-sheet'
import React, { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react'
import {
	ActivityIndicator,
	Alert,
	BackHandler,
	Dimensions,
	ScrollView,
	Text,
	TouchableOpacity,
	useColorScheme,
	View,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import CommentInputFooter from './CommentInputFooter'
import CommentItem from './CommentItem'

export interface CommentsModalHandle {
	present: () => void
	dismiss: () => void
}

type Props = {
	workoutId: string
	onClose?: () => void
}

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
	const [editingComment, setEditingComment] = useState<EngagementComment | null>(null)

	const sliderRef = useRef<ScrollView>(null)
	const footerRef = useRef<any>(null)
	const optionsBottomSheetRef = useRef<BottomSheetModal>(null)
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
			setEditingComment(null)
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
			setEditingComment(null)
		}, 300)
	}

	const handleReplyPress = (comment: EngagementComment) => {
		setReplyingTo(comment)
	}

	const handleOptionsPress = (comment: EngagementComment) => {
		setSelectedCommentForOptions(comment)
		optionsBottomSheetRef.current?.present()
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
			<CommentInputFooter
				{...props}
				ref={footerRef}
				workoutId={workoutId}
				viewingThreadId={viewingThreadId}
				replyingTo={replyingTo}
				setReplyingTo={setReplyingTo}
				editingComment={editingComment}
				setEditingComment={setEditingComment}
			/>
		),
		[workoutId, viewingThreadId, replyingTo, editingComment]
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
						<View className="items-center justify-center">
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

			<BottomSheetModal
				ref={optionsBottomSheetRef}
				stackBehavior="push"
				enableDynamicSizing={true}
				backdropComponent={renderBackdrop}
				backgroundStyle={{ backgroundColor: bgColor }}
				handleIndicatorStyle={{ backgroundColor: isDark ? '#525252' : '#d1d5db' }}
				animationConfigs={{ duration: 350 }}
			>
				<BottomSheetView style={{ paddingBottom: insets.bottom + 16 }}>
					<TouchableOpacity
						className="px-4 py-4"
						onPress={() => {
							optionsBottomSheetRef.current?.dismiss()
							if (selectedCommentForOptions) {
								setEditingComment(selectedCommentForOptions)
								setReplyingTo(null)
							}
						}}
					>
						<Text className="text-base text-blue-500">Edit Comment</Text>
					</TouchableOpacity>
					<View className="h-px bg-neutral-200 dark:bg-neutral-800" />
					<TouchableOpacity
						className="px-4 py-4"
						onPress={() => {
							optionsBottomSheetRef.current?.dismiss()
							setTimeout(() => deleteModalRef.current?.present(), 300)
						}}
					>
						<Text className="text-base text-red-500">Delete Comment</Text>
					</TouchableOpacity>
				</BottomSheetView>
			</BottomSheetModal>

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
