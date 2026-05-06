import { BaseModal, BaseModalHandle } from '@/components/ui/BaseModal'
import { Button } from '@/components/ui/buttons/Button'
import { useThemeColor } from '@/hooks/theme'
import { Ionicons } from '@expo/vector-icons'
import { forwardRef } from 'react'
import { Text, View } from 'react-native'

interface ProgramWorkoutPromptProps {
  programTitle: string
  workoutTitle: string
  onSelectProgram: () => void
  onSelectEmpty: () => void
}

export const ProgramWorkoutPromptModal = forwardRef<BaseModalHandle, ProgramWorkoutPromptProps>(
  ({ programTitle, workoutTitle, onSelectProgram, onSelectEmpty }, ref) => {
    const colors = useThemeColor()

    return (
      <BaseModal ref={ref} title="Today's Program Workout">
        <View className="items-center">
          <View className="mb-4 h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <Ionicons name="calendar-outline" size={32} color={colors.primary} />
          </View>
          <Text className="mt-2 text-center text-neutral-500 dark:text-neutral-400">
            You have a scheduled workout for{' '}
            <Text className="font-semibold text-primary">{programTitle}</Text>
          </Text>
          <Text className="mt-1 text-center font-medium text-black dark:text-white">
            {workoutTitle}
          </Text>
        </View>

        <View className="mt-8 flex-col gap-3">
          <Button
            title="Start Scheduled Workout"
            onPress={() => {
              onSelectProgram()
              // @ts-ignore
              ref?.current?.dismiss()
            }}
            fullWidth
          />
          <Button
            title="Start Empty Workout"
            variant="secondary"
            onPress={() => {
              onSelectEmpty()
              // @ts-ignore
              ref?.current?.dismiss()
            }}
            fullWidth
          />
        </View>
      </BaseModal>
    )
  },
)

ProgramWorkoutPromptModal.displayName = 'ProgramWorkoutPromptModal'
export default ProgramWorkoutPromptModal
