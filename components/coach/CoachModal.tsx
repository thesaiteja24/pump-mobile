import { useCoach } from '@/hooks/useCoach'
import { CoachMessage } from '@/types/coach'
import { useThemeColor } from '@/hooks/useThemeColor'
import { useSubscriptionStore } from '@/stores/subscriptionStore'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { BottomSheetBackdrop, BottomSheetModal, BottomSheetView } from '@gorhom/bottom-sheet'
import { useRouter } from 'expo-router'
import React, { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react'
import { BackHandler, Text, View, useColorScheme } from 'react-native'
import { ScrollView } from 'react-native-gesture-handler'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Button } from '../ui/Button'

export interface CoachModalHandle {
	present: () => void
	dismiss: () => void
}

type Props = {
	onClose?: () => void
}

const ChatBubble = ({ message }: { message: CoachMessage }) => {
	const isCoach = message.role === 'coach'

	return (
		<View className={`my-2 w-full flex-row ${isCoach ? 'justify-start' : 'justify-end'}`}>
			<View className="relative max-w-[85%]">
				{/* Bubble */}
				<View
					className={`px-4 py-2 ${
						isCoach ? 'rounded-2xl rounded-bl-sm bg-blue-600' : 'rounded-2xl rounded-br-sm bg-green-600'
					}`}
				>
					{message.thinking && isCoach ? (
						<Text className="text-sm text-white">Thinking...</Text>
					) : (
						<Text className="text-sm text-white">{message.text}</Text>
					)}
				</View>

				{/* Tail */}
				{/* <View
          className={`absolute bottom-0 h-3 w-3 rotate-45 ${
            isCoach ? "-left-1 bg-blue-600" : "-right-1 bg-green-600"
          }`}
        /> */}
			</View>
		</View>
	)
}

const CoachModal = forwardRef<CoachModalHandle, Props>(({ onClose }, ref) => {
	const colors = useThemeColor()
	const isDark = useColorScheme() === 'dark'
	const bottomSheetModalRef = useRef<BottomSheetModal>(null)
	const scrollViewRef = useRef<ScrollView>(null)

	const insets = useSafeAreaInsets()
	const router = useRouter()
	const isPro = useSubscriptionStore(s => s.isPro)

	const {
		messages,
		isThinking,
		recorderState,
		startRecording,
		sendVoiceMessage,
		clearMessages,

		initializeConversation,
	} = useCoach()

	const [isOpen, setIsOpen] = useState(false)

	useImperativeHandle(ref, () => ({
		present: () => {
			setIsOpen(true)
			bottomSheetModalRef.current?.present()
		},
		dismiss: () => {
			bottomSheetModalRef.current?.dismiss()
		},
	}))

	// ✅ Handle Android back gesture
	useEffect(() => {
		const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
			if (isOpen) {
				bottomSheetModalRef.current?.dismiss()
				return true // consume back press
			}
			return false // allow navigation
		})

		return () => subscription.remove()
	}, [isOpen])

	const renderBackdrop = useCallback(
		(props: any) => <BottomSheetBackdrop {...props} appearsOnIndex={0} disappearsOnIndex={-1} opacity={0.4} />,
		[]
	)

	const snapPoints = useMemo(() => ['90%'], [])

	useEffect(() => {
		if (messages.length === 0 && isOpen && isPro) {
			initializeConversation()
		}
	}, [isOpen, messages.length, initializeConversation, isPro])

	useEffect(() => {
		scrollViewRef.current?.scrollToEnd({ animated: true })
	}, [messages])

	return (
		<BottomSheetModal
			ref={bottomSheetModalRef}
			snapPoints={snapPoints}
			backdropComponent={renderBackdrop}
			onDismiss={() => {
				setIsOpen(false)
				onClose?.()
			}}
			enablePanDownToClose
			backgroundStyle={{
				backgroundColor: isDark ? '#171717' : 'white',
			}}
			handleIndicatorStyle={{
				backgroundColor: isDark ? '#525252' : '#d1d5db',
			}}
			animationConfigs={{
				duration: 350,
			}}
		>
			<BottomSheetView
				style={{
					height: '100%',
					flex: 1,
					paddingBottom: insets.bottom,
				}}
				className="dark:bg-neutral-900"
			>
				{isPro ? (
					<View className="flex-1 flex-col gap-4">
						<ScrollView
							ref={scrollViewRef}
							className="flex-col gap-4"
							contentContainerStyle={{ padding: 16 }}
							showsVerticalScrollIndicator={false}
							onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
						>
							{messages.map(message => (
								<ChatBubble key={message.id} message={message} />
							))}
						</ScrollView>

						<View className="flex-row items-center justify-center gap-4 px-2 pb-4">
							{recorderState.isRecording ? (
								<Button
									title=""
									className="w-1/3 rounded-full"
									leftIcon={
										<MaterialCommunityIcons
											name="stop"
											size={24}
											color={colors.isDark ? 'white' : 'red'}
										/>
									}
									disabled={isThinking}
									variant="danger"
									onPress={() => {
										sendVoiceMessage()
									}}
								/>
							) : (
								<Button
									title=""
									className="w-1/3 rounded-full"
									leftIcon={<MaterialCommunityIcons name="microphone" size={24} color="white" />}
									disabled={isThinking}
									variant="primary"
									onPress={() => {
										startRecording()
									}}
								/>
							)}
							<Button
								title=""
								leftIcon={<MaterialCommunityIcons name="trash-can" size={24} color="red" />}
								onPress={() => {
									clearMessages()
									setIsOpen(false)
								}}
							/>
						</View>
					</View>
				) : (
					<View className="flex-1 items-center justify-center gap-4 px-6">
						<View className="rounded-full bg-blue-100 p-4 dark:bg-blue-900/30">
							<MaterialCommunityIcons name="robot" size={48} color={colors.primary || '#3b82f6'} />
						</View>
						<Text className="text-center text-2xl font-bold" style={{ color: colors.text }}>
							AI Training Coach
						</Text>
						<Text className="text-center text-base leading-6" style={{ color: colors.neutral[500] }}>
							Upgrade to Pro to unlock your personal AI voice coach that guides you through workouts,
							analyzes performance, and gives real-time motivation.
						</Text>
						<View className="mt-4 w-full">
							<Button
								title="View Plans"
								variant="primary"
								fullWidth
								onPress={() => {
									bottomSheetModalRef.current?.dismiss()
									router.push('/paywall')
								}}
							/>
						</View>
					</View>
				)}
			</BottomSheetView>
		</BottomSheetModal>
	)
})

CoachModal.displayName = 'CoachModal'

export default CoachModal
