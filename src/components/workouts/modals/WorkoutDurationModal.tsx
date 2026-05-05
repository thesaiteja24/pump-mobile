import { BaseModal, BaseModalHandle } from '@/components/ui/BaseModal'
import { Button } from '@/components/ui/buttons/Button'
import { formatSeconds } from '@/utils/workout'
import * as Haptics from 'expo-haptics'
import React, { forwardRef, useState } from 'react'
import { Pressable, Text, View, useColorScheme } from 'react-native'
import DatePicker from 'react-native-date-picker'

type Props = {
  title?: string
  mode?: 'live' | 'edit'
  elapsedSeconds?: number
  startTime: Date
  durationSeconds?: number
  isPaused?: boolean
  onUpdateStartTime: (date: Date) => void
  onUpdateDurationSeconds?: (seconds: number) => void
  onPause?: () => void
  onResume?: () => void
  onClose?: () => void
}

const MIN_DURATION_SECONDS = 0
const MAX_DURATION_SECONDS = 4 * 60 * 60
const DURATION_STEP_SECONDS = 60

const WorkoutDurationModal = React.memo(
  forwardRef<BaseModalHandle, Props>(
    (
      {
        title = 'Workout Duration',
        mode = 'live',
        elapsedSeconds = 0,
        startTime,
        durationSeconds = 0,
        isPaused = false,
        onUpdateStartTime,
        onUpdateDurationSeconds,
        onPause,
        onResume,
        onClose,
      },
      ref,
    ) => {
      const isDark = useColorScheme() === 'dark'
      const [isEditingStartTime, setIsEditingStartTime] = useState(false)

      const adjustDuration = (deltaSeconds: number) => {
        if (!onUpdateDurationSeconds) return

        const nextDuration = Math.min(
          MAX_DURATION_SECONDS,
          Math.max(MIN_DURATION_SECONDS, durationSeconds + deltaSeconds),
        )

        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
        onUpdateDurationSeconds(nextDuration)
      }

      return (
        <BaseModal
          ref={ref}
          title={title}
          confirmAction={{
            title: 'Done',
            onPress: () => {
              // @ts-ignore
              ref?.current?.dismiss()
            },
          }}
          onDismiss={onClose}
        >
          <View className="gap-6">
            {mode === 'live' && (
              <View className="items-center">
                <Text className="text-5xl font-bold text-primary">
                  {formatSeconds(elapsedSeconds)}
                </Text>
                <Text className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
                  Live workout duration
                </Text>
              </View>
            )}

            <View className="gap-5">
              <View className="rounded-2xl border border-neutral-200 px-4 py-4 dark:border-neutral-800">
                <Text className="text-sm text-neutral-500 dark:text-neutral-400">Start time</Text>
                <Pressable onPress={() => setIsEditingStartTime((current) => !current)}>
                  <Text className="mt-1 text-lg font-semibold text-primary">
                    {startTime.toLocaleString()}
                  </Text>
                </Pressable>

                {isEditingStartTime && (
                  <View className="mt-4 items-center">
                    <DatePicker
                      date={startTime}
                      onDateChange={onUpdateStartTime}
                      mode="datetime"
                      theme={isDark ? 'dark' : 'light'}
                    />
                  </View>
                )}
              </View>

              {mode === 'edit' && onUpdateDurationSeconds && (
                <View className="rounded-2xl border border-neutral-200 px-4 py-4 dark:border-neutral-800">
                  <Text className="text-sm text-neutral-500 dark:text-neutral-400">Duration</Text>
                  <Text className="mt-1 text-lg font-semibold text-primary">
                    {formatSeconds(durationSeconds)}
                  </Text>

                  <View className="mt-4 flex-row gap-3">
                    <View className="flex-1">
                      <Button
                        title="-1 min"
                        variant="outline"
                        onPress={() => adjustDuration(-DURATION_STEP_SECONDS)}
                      />
                    </View>
                    <View className="flex-1">
                      <Button
                        title="+1 min"
                        variant="outline"
                        onPress={() => adjustDuration(DURATION_STEP_SECONDS)}
                      />
                    </View>
                  </View>
                </View>
              )}
            </View>

            {mode === 'live' && (onPause || onResume) && (
              <Button
                title={isPaused ? 'Resume Workout' : 'Pause Workout'}
                variant={isPaused ? 'primary' : 'secondary'}
                className="mt-2"
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
                  if (isPaused) {
                    onResume?.()
                  } else {
                    onPause?.()
                  }
                }}
              />
            )}
          </View>
        </BaseModal>
      )
    },
  ),
)

WorkoutDurationModal.displayName = 'WorkoutDurationModal'

export default WorkoutDurationModal
