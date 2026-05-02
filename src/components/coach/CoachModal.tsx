import { Button } from '@/components/ui/buttons/Button'
import { useCoach } from '@/hooks/coach'
import { useModalBackHandler } from '@/hooks/modal'
import { useThemeColor } from '@/hooks/theme'
import { useSubscriptionStore } from '@/stores/subscriptions.store'
import { CoachMessage } from '@/types/coach'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetScrollView,
} from '@gorhom/bottom-sheet'
import { useRouter } from 'expo-router'
import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react'
import { Text, View, useColorScheme } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

export interface CoachModalHandle {
  present: () => void
  dismiss: () => void
}

type Props = {
  onClose?: () => void
  persistOnNavigation?: boolean
}

const ChatBubble = ({ message }: { message: CoachMessage }) => {
  const isCoach = message.role === 'coach'

  return (
    <View className={`my-2 w-full flex-row ${isCoach ? 'justify-start' : 'justify-end'}`}>
      <View className="relative max-w-[85%]">
        {/* Bubble */}
        <View
          className={`px-4 py-2 ${
            isCoach
              ? 'rounded-2xl rounded-bl-sm bg-blue-600'
              : 'rounded-2xl rounded-br-sm bg-green-600'
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

const CoachModal = forwardRef<CoachModalHandle, Props>(({ onClose, persistOnNavigation = false }, ref) => {
  const colors = useThemeColor()
  const isDark = useColorScheme() === 'dark'
  const bottomSheetModalRef = useRef<BottomSheetModal>(null)
  const scrollViewRef = useRef<any>(null)

  const insets = useSafeAreaInsets()
  const router = useRouter()
  const isPro = useSubscriptionStore((s) => s.isPro)

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
  useModalBackHandler(isOpen, dismiss)

  const renderBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop {...props} appearsOnIndex={0} disappearsOnIndex={-1} opacity={0.4} />
    ),
    [],
  )

  const snapPoints = useMemo(() => ['90%'], [])

  useEffect(() => {
    if (messages.length === 0 && isOpen && isPro) {
      initializeConversation()
    }
  }, [isOpen, messages.length, initializeConversation, isPro])

  return (
    <BottomSheetModal
      ref={bottomSheetModalRef}
      snapPoints={snapPoints}
      backdropComponent={renderBackdrop}
      onDismiss={() => {
        setIsOpen(false)
        onClose?.()
      }}
      onChange={(index) => setIsOpen(index >= 0)}
      enablePanDownToClose
      enableDynamicSizing={false}
      handleIndicatorStyle={{
        backgroundColor: isDark ? '#525252' : '#d1d5db',
      }}
      backgroundStyle={{ backgroundColor: colors.background }}
      animationConfigs={{
        duration: 350,
      }}
    >
      <View style={{ flex: 1, paddingBottom: insets.bottom }}>
        {isPro ? (
          <View className="flex-1 flex-col">
            <BottomSheetScrollView
              ref={scrollViewRef as any}
              className="flex-1"
              contentContainerStyle={{ padding: 16 }}
              showsVerticalScrollIndicator={false}
              onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
            >
              {messages.map((message) => (
                <ChatBubble key={message.id} message={message} />
              ))}
            </BottomSheetScrollView>

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
                  dismiss()
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
            <Text
              className="text-center text-base leading-6"
              style={{ color: colors.neutral[500] }}
            >
              Upgrade to Pro to unlock your personal AI voice coach that guides you through
              workouts, analyzes performance, and gives real-time motivation.
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
      </View>
    </BottomSheetModal>
  )
})

CoachModal.displayName = 'CoachModal'

export default CoachModal
