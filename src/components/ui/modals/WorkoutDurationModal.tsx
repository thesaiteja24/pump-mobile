import { Button } from '@/components/ui/buttons/Button'
import { useModalBackHandler, useModalNavigationSync } from '@/hooks/modal'
import { formatSeconds } from '@/utils/time'
import { BottomSheetBackdrop, BottomSheetModal, BottomSheetView } from '@gorhom/bottom-sheet'
import * as Haptics from 'expo-haptics'
import React, {
  forwardRef,
  useCallback,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react'
import { Pressable, Text, View, useColorScheme } from 'react-native'
import DatePicker from 'react-native-date-picker'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

export interface WorkoutDurationModalHandle {
  present: () => void
  dismiss: () => void
}

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
  persistOnNavigation?: boolean
}

const MIN_DURATION_SECONDS = 0
const MAX_DURATION_SECONDS = 4 * 60 * 60
const DURATION_STEP_SECONDS = 60

const WorkoutDurationModal = React.memo(
  forwardRef<WorkoutDurationModalHandle, Props>(
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
        persistOnNavigation = false,
      },
      ref,
    ) => {
      const isDark = useColorScheme() === 'dark'
      const bottomSheetModalRef = useRef<BottomSheetModal>(null)
      const insets = useSafeAreaInsets()
      const [isOpen, setIsOpen] = useState(false)
      const [isEditingStartTime, setIsEditingStartTime] = useState(false)

      const present = useCallback(() => {
        bottomSheetModalRef.current?.present()
      }, [])

      const dismiss = useCallback(() => {
        bottomSheetModalRef.current?.dismiss()
        setIsEditingStartTime(false)
      }, [])

      useImperativeHandle(ref, () => ({
        present,
        dismiss,
      }))

      useModalBackHandler(isOpen, dismiss)
      useModalNavigationSync({ isOpen, present, dismiss, persistOnNavigation })

      const renderBackdrop = useCallback(
        (props: any) => (
          <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} opacity={0.4} />
        ),
        [],
      )

      const snapPoints = useMemo(() => ['64%'], [])

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
        <BottomSheetModal
          ref={bottomSheetModalRef}
          snapPoints={snapPoints}
          backdropComponent={renderBackdrop}
          onDismiss={onClose}
          enablePanDownToClose
          enableDynamicSizing={false}
          onChange={(index) => setIsOpen(index >= 0)}
          handleIndicatorStyle={{
            backgroundColor: isDark ? '#525252' : '#d1d5db',
          }}
          animationConfigs={{ duration: 350 }}
        >
          <BottomSheetView
            style={{
              flex: 1,
              paddingHorizontal: 24,
              paddingBottom: insets.bottom + 24,
              paddingTop: 8,
            }}
          >
            <Text className="mb-6 text-center text-xl font-bold text-black dark:text-white">
              {title}
            </Text>

            {mode === 'live' && (
              <View className="mb-6 items-center">
                <Text className="text-5xl font-bold text-primary">{formatSeconds(elapsedSeconds)}</Text>
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
                      <Button title="-1 min" variant="outline" onPress={() => adjustDuration(-DURATION_STEP_SECONDS)} />
                    </View>
                    <View className="flex-1">
                      <Button title="+1 min" variant="outline" onPress={() => adjustDuration(DURATION_STEP_SECONDS)} />
                    </View>
                  </View>
                </View>
              )}
            </View>

            <View className="mt-6 flex-row gap-3">
              {mode === 'live' && (onPause || onResume) && (
                <View className="flex-1">
                  <Button
                    title={isPaused ? 'Resume Workout' : 'Pause Workout'}
                    variant={isPaused ? 'primary' : 'secondary'}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
                      if (isPaused) {
                        onResume?.()
                      } else {
                        onPause?.()
                      }
                    }}
                  />
                </View>
              )}
              <View className="flex-1">
                <Button title="Done" variant="primary" onPress={dismiss} />
              </View>
            </View>
          </BottomSheetView>
        </BottomSheetModal>
      )
    },
  ),
)

export default WorkoutDurationModal
