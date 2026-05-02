import CommentInputFooter from '@/components/engagement/CommentInputFooter'
import CommentItem from '@/components/engagement/CommentItem'
import {
  DeleteConfirmModal,
  DeleteConfirmModalHandle,
} from '@/components/ui/modals/DeleteConfirmModal'
import { useModalNavigationSync } from '@/hooks/modal'
import { useCommentsQuery, useDeleteCommentMutation } from '@/hooks/queries/engagement'
import { Comment } from '@/types/engagement'
import { Ionicons } from '@expo/vector-icons'
import {
  BottomSheetBackdrop,
  BottomSheetFlatList,
  BottomSheetModal,
  BottomSheetView,
} from '@gorhom/bottom-sheet'
import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react'
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

export interface CommentsModalHandle {
  present: () => void
  dismiss: () => void
}

type Props = {
  workoutId: string
  onClose?: () => void
  persistOnNavigation?: boolean
}

const CommentsModal = forwardRef<CommentsModalHandle, Props>(
  ({ workoutId, onClose, persistOnNavigation = false }, ref) => {
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
    } = useCommentsQuery(workoutId)

    const deleteCommentMutation = useDeleteCommentMutation()

    // Flatten pages into a single list
    const workoutComments = useMemo(
      () => commentsPages?.pages.flatMap((p) => p.comments) ?? [],
      [commentsPages],
    )

    // UI State
    const [isOpen, setIsOpen] = useState(false)
    const [viewingThreadId, setViewingThreadId] = useState<string | null>(null)
    const [replyingTo, setReplyingTo] = useState<Comment | null>(null)
    const [selectedCommentForOptions, setSelectedCommentForOptions] = useState<Comment | null>(null)
    const [editingComment, setEditingComment] = useState<Comment | null>(null)

    const sliderRef = useRef<ScrollView>(null)
    const footerRef = useRef<any>(null)
    const optionsBottomSheetRef = useRef<BottomSheetModal>(null)
    const deleteModalRef = useRef<DeleteConfirmModalHandle>(null)

    const present = useCallback(() => {
      bottomSheetModalRef.current?.present()
    }, [])

    const dismiss = useCallback(() => {
      bottomSheetModalRef.current?.dismiss()
    }, [])

    useImperativeHandle(ref, () => ({
      present,
      dismiss,
    }))

    // Shared modal logic
    useModalNavigationSync({ isOpen, present, dismiss, persistOnNavigation })

    const snapPoints = useMemo(() => ['75%'], [])

    const handleClose = () => {
      setIsOpen(false)
      onClose?.()
      setTimeout(() => {
        sliderRef.current?.scrollTo({ x: 0, animated: false })
        setViewingThreadId(null)
        setReplyingTo(null)
        setEditingComment(null)
      }, 300)
    }

    const handleViewReplies = useCallback(
      (comment: Comment) => {
        setViewingThreadId(comment.id)
        sliderRef.current?.scrollTo({ x: screenWidth, animated: true })
      },
      [screenWidth],
    )

    const handleBackToMain = () => {
      sliderRef.current?.scrollTo({ x: 0, animated: true })
      setTimeout(() => {
        setViewingThreadId(null)
        setReplyingTo(null)
        setEditingComment(null)
      }, 300)
    }

    const handleReplyPress = useCallback((comment: Comment) => {
      setReplyingTo(comment)
    }, [])

    const handleOptionsPress = useCallback((comment: Comment) => {
      setSelectedCommentForOptions(comment)
      optionsBottomSheetRef.current?.present()
    }, [])

    const activeThreadComment = workoutComments.find((c) => c.id === viewingThreadId)

    const textColor = isDark ? 'white' : 'black'
    const borderColor = isDark ? '#262626' : '#e5e5e5'

    const renderBackdrop = useCallback(
      (props: any) => (
        <BottomSheetBackdrop {...props} appearsOnIndex={0} disappearsOnIndex={-1} opacity={0.4} />
      ),
      [],
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
      [workoutId, viewingThreadId, replyingTo, editingComment],
    )

    // Manual custom back handler for nested thread navigation
    useEffect(() => {
      if (!isOpen) return
      const onBackPress = () => {
        if (!bottomSheetModalRef.current) return false
        if (viewingThreadId) {
          handleBackToMain()
          return true
        }
        dismiss()
        return true
      }
      const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress)
      return () => subscription.remove()
    }, [isOpen, viewingThreadId, dismiss])

    const renderMainComments = () => (
      <View key="main-comments" style={{ width: screenWidth, flex: 1 }}>
        <View
          className="flex-row items-center justify-between border-b px-4 pb-3"
          style={{ borderColor }}
        >
          <Text className="text-lg font-bold" style={{ color: textColor }}>
            Comments
          </Text>
          <TouchableOpacity onPress={dismiss}>
            <Ionicons name="close" size={24} color={textColor} />
          </TouchableOpacity>
        </View>

        <BottomSheetFlatList
          data={workoutComments}
          keyExtractor={(item: Comment) => item.id}
          renderItem={({ item }: { item: Comment }) => (
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
          onEndReachedThreshold={1}
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
          keyExtractor={(item: Comment) => item.id}
          renderItem={({ item }: { item: Comment }) => (
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
          onChange={(index) => setIsOpen(index >= 0)}
          handleIndicatorStyle={{ backgroundColor: isDark ? '#525252' : '#d1d5db' }}
          backgroundStyle={{ backgroundColor: colors.background }}
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
          handleIndicatorStyle={{ backgroundColor: isDark ? '#525252' : '#d1d5db' }}
          backgroundStyle={{ backgroundColor: isDark ? '#171717' : '#ffffff' }}
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
                await deleteCommentMutation.mutateAsync(selectedCommentForOptions)
              } catch (error) {
                Toast.show({ type: 'error', text1: 'Error', text2: error as string })
              }
            }
          }}
          onCancel={() => {}}
        />
      </>
    )
  },
)

CommentsModal.displayName = 'CommentsModal'

export default CommentsModal
