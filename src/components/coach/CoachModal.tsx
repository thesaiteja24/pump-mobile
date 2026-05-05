import { BaseModal, BaseModalHandle } from '@/components/ui/BaseModal'
import { Button } from '@/components/ui/buttons/Button'
import { useCoach } from '@/hooks/coach'
import { useThemeColor } from '@/hooks/theme'
import { useSubscriptionStore } from '@/stores/subscriptions.store'
import { CoachMessage } from '@/types/coach'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { BottomSheetScrollView } from '@gorhom/bottom-sheet'
import { useRouter } from 'expo-router'
import { forwardRef, useEffect, useState } from 'react'
import { Text, View } from 'react-native'

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

const CoachModal = forwardRef<BaseModalHandle, Props>(({ onClose }, ref) => {
  const colors = useThemeColor()
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

  useEffect(() => {
    if (messages.length === 0 && isOpen && isPro) {
      initializeConversation()
    }
  }, [isOpen, messages.length, initializeConversation, isPro])

  return (
    <BaseModal
      ref={ref}
      title="AI Training Coach"
      onDismiss={() => {
        setIsOpen(false)
        onClose?.()
      }}
      // @ts-ignore
      onChange={(index) => setIsOpen(index >= 0)}
    >
      <View style={{ height: 600 }}>
        {isPro ? (
          <View className="flex-1 flex-col">
            <BottomSheetScrollView
              className="flex-1"
              contentContainerStyle={{ padding: 16 }}
              showsVerticalScrollIndicator={false}
            >
              {messages.map((message) => (
                <ChatBubble key={message.id} message={message} />
              ))}
            </BottomSheetScrollView>

            <View className="flex-row items-center justify-center gap-4 px-2 pb-4 pt-2">
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
                  // @ts-ignore
                  ref?.current?.dismiss()
                }}
              />
            </View>
          </View>
        ) : (
          <View className="flex-1 items-center justify-center gap-4 px-6">
            <View className="rounded-full bg-blue-100 p-4 dark:bg-blue-900/30">
              <MaterialCommunityIcons name="robot" size={48} color={colors.primary || '#3b82f6'} />
            </View>
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
                  // @ts-ignore
                  ref?.current?.dismiss()
                  router.push('/paywall')
                }}
              />
            </View>
          </View>
        )}
      </View>
    </BaseModal>
  )
})

CoachModal.displayName = 'CoachModal'

export default CoachModal
