import { DeleteConfirmModal, DeleteConfirmModalHandle } from '@/components/ui/DeleteConfirmModal'
import { useDeleteComment, useWorkoutComments } from '@/hooks/queries/useComments'
import { Comment as EngagementComment } from '@/types/comments'
import { Ionicons } from '@expo/vector-icons'
import { BottomSheetBackdrop, BottomSheetFlatList, BottomSheetModal, BottomSheetView } from '@gorhom/bottom-sheet'
import React, { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react'
import {
	ActivityIndicator,
	BackHandler,
	Dimensions,
	ScrollView,
	Text,
	TouchableOpacity,
	useColorScheme,
	View,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Toast from 'react-native-toast-message'
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

	// TanStack Query hooks
	const {
		data: commentsPages,
		isLoading: isLoadingComments,
		fetchNextPage,
		hasNextPage,
		isFetchingNextPage,
	} = useWorkoutComments(workoutId)

	const deleteCommentMutation = useDeleteComment(workoutId)

	// Flatten pages into a single list
	const workoutComments = useMemo(() => commentsPages?.pages.flatMap(p => p.comments) ?? [], [commentsPages])

	// UI State
	const [viewingThreadId, setViewingThreadId] = useState<string | null>(null)
	const [replyingTo, setReplyingTo] = useState<EngagementComment | null>(null)
	const [selectedCommentForOptions, setSelectedCommentForOptions] = useState<EngagementComment | null>(null)
	const [editingComment, setEditingComment] = useState<EngagementComment | null>(null)

	const sliderRef = useRef<ScrollView>(null)
	const footerRef = useRef<any>(null)
	const optionsBottomSheetRef = useRef<BottomSheetModal>(null)
	const deleteModalRef = useRef<DeleteConfirmModalHandle>(null)

	useImperativeHandle(ref, () => ({
		present: () => {
			bottomSheetModalRef.current?.present()
		},
		dismiss: () => {
			bottomSheetModalRef.current?.dismiss()
		},
	}))

	const snapPoints = useMemo(() => ['75%'], [])

	const handleClose = () => {
		onClose?.()
		setTimeout(() => {
			sliderRef.current?.scrollTo({ x: 0, animated: false })
			setViewingThreadId(null)
			setReplyingTo(null)
			setEditingComment(null)
		}, 300)
	}

	const handleViewReplies = (comment: EngagementComment) => {
		setViewingThreadId(comment.id)
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

	const textColor = isDark ? 'white' : 'black'
	const bgColor = isDark ? '#171717' : 'white'
	const borderColor = isDark ? '#262626' : '#e5e5e5'

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
			if (!bottomSheetModalRef.current) return false
			if (viewingThreadId) {
				handleBackToMain()
				return true
			}
			bottomSheetModalRef.current?.dismiss()
			return true
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
						workoutId={workoutId}
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
					isFetchingNextPage ? (
						<View className="items-center justify-center py-4">
							<ActivityIndicator size="small" color={textColor} />
						</View>
					) : null
				}
				onEndReached={() => {
					if (hasNextPage && !isFetchingNextPage) {
						fetchNextPage()
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
						workoutId={workoutId}
						depth={0}
						isThreadParent={true}
						onReplyPress={handleReplyPress}
						onOptionsPress={handleOptionsPress}
					/>
				)}
				contentContainerStyle={{ paddingBottom: '30%' }}
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
				keyboardBehavior="extend"
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
				animationConfigs={{ duration: 550 }}
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
							await deleteCommentMutation.mutateAsync(selectedCommentForOptions.id)
						} catch (error) {
							Toast.show({ type: 'error', text1: 'Error', text2: error as string })
						}
					}
				}}
				onCancel={() => {}}
			/>
		</>
	)
})

CommentsModal.displayName = 'CommentsModal'

export default CommentsModal
