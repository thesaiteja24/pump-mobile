import { useEngagementStore } from '@/stores/engagementStore'
import { Ionicons } from '@expo/vector-icons'
import { BottomSheetFooter, BottomSheetTextInput } from '@gorhom/bottom-sheet'
import React, { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react'
import { ActivityIndicator, Keyboard, Text, TextInput, TouchableOpacity, View, useColorScheme } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

const CommentInputFooter = forwardRef(
	(
		{
			animatedFooterPosition,
			workoutId,
			viewingThreadId,
			replyingTo,
			setReplyingTo,
			editingComment,
			setEditingComment,
		}: any,
		ref: any
	) => {
		const [inputValue, setInputValue] = useState('')
		const insets = useSafeAreaInsets()
		const isDark = useColorScheme() === 'dark'
		const textColor = isDark ? 'white' : 'black'
		const bgColor = isDark ? '#171717' : 'white'
		const borderColor = isDark ? '#262626' : '#e5e5e5'
		const { addComment, addReply, editComment, commenting, replying, loadingComments } = useEngagementStore()

		const isEditingLoading = editingComment ? loadingComments[editingComment.id] : false
		const enableSubmit = commenting || replying || isEditingLoading

		const inputRef = useRef<TextInput>(null)

		useImperativeHandle(ref, () => ({
			focus: () => {
				inputRef.current?.focus()
			},
		}))

		const handleSubmit = async () => {
			if (!inputValue.trim()) return
			try {
				if (editingComment) {
					await editComment(editingComment.id, inputValue.trim())
					setEditingComment(null)
				} else if (replyingTo) {
					await addReply(workoutId, replyingTo.id, inputValue.trim())
					setReplyingTo(null)
				} else if (viewingThreadId) {
					await addReply(workoutId, viewingThreadId, inputValue.trim())
				} else {
					await addComment(workoutId, inputValue.trim())
				}
				setInputValue('')
				Keyboard.dismiss()
			} catch (error) {
				console.error(error)
			}
		}

		useEffect(() => {
			if (editingComment && inputRef.current) {
				setInputValue(editingComment.content)
				requestAnimationFrame(() => {
					inputRef.current?.focus()
				})
			} else if (replyingTo && inputRef.current) {
				requestAnimationFrame(() => {
					inputRef.current?.focus()
				})
			}
		}, [replyingTo, editingComment])

		return (
			<BottomSheetFooter animatedFooterPosition={animatedFooterPosition}>
				<View
					className="border-t px-4 py-3"
					style={{ backgroundColor: bgColor, borderColor, zIndex: 999, paddingBottom: insets.bottom }}
				>
					{replyingTo && !editingComment && (
						<View className="mb-2 flex-row items-center justify-between rounded-t-lg bg-neutral-200 px-3 py-2 dark:bg-neutral-800">
							<Text className="text-xs font-medium text-neutral-600 dark:text-neutral-400">
								Replying to @{replyingTo.user?.firstName}
							</Text>
							<TouchableOpacity onPress={() => setReplyingTo(null)}>
								<Ionicons name="close-circle" size={16} color={isDark ? '#a3a3a3' : '#525252'} />
							</TouchableOpacity>
						</View>
					)}
					{editingComment && (
						<View className="mb-2 flex-row items-center justify-between rounded-t-lg bg-blue-100 px-3 py-2 dark:bg-blue-900/40">
							<Text className="text-xs font-medium text-blue-700 dark:text-blue-300">
								Editing comment
							</Text>
							<TouchableOpacity
								onPress={() => {
									setEditingComment(null)
									setInputValue('')
								}}
							>
								<Ionicons name="close-circle" size={16} color={isDark ? '#93c5fd' : '#3b82f6'} />
							</TouchableOpacity>
						</View>
					)}
					<View className="flex-row items-center pt-1" style={{ position: 'relative' }}>
						<BottomSheetTextInput
							// @ts-ignore
							ref={inputRef}
							value={inputValue}
							onChangeText={setInputValue}
							placeholder={
								editingComment
									? 'Edit your comment...'
									: replyingTo || viewingThreadId
										? 'Add a reply...'
										: 'Add a comment...'
							}
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

export default CommentInputFooter
