import { Button } from '@/components/ui/buttons/Button'
import { useModalBackHandler, useModalNavigationSync } from '@/hooks/modal'
import { BottomSheetBackdrop, BottomSheetModal, BottomSheetView } from '@gorhom/bottom-sheet'
import * as Haptics from 'expo-haptics'
import React, {
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
import { TimerPicker } from 'react-native-timer-picker'

export interface TimerDurationModalHandle {
  present: (initialSeconds: number) => void
  dismiss: () => void
}

export interface TimerDurationModalProps {
  title: string
  confirmText?: string
  onClose?: () => void
  onConfirm: (seconds: number) => void
  onReset?: () => void
  persistOnNavigation?: boolean
}

const TimerDurationModal = React.memo(
  forwardRef<TimerDurationModalHandle, TimerDurationModalProps>(
    (
      {
        title,
        confirmText = 'Save',
        onClose,
        onConfirm,
        onReset,
        persistOnNavigation = false,
      },
      ref,
    ) => {
      const isDark = useColorScheme() === 'dark'
      const bottomSheetModalRef = useRef<BottomSheetModal>(null)
      const insets = useSafeAreaInsets()
      const [isOpen, setIsOpen] = useState(false)
      const [hours, setHours] = useState(0)
      const [minutes, setMinutes] = useState(0)
      const [seconds, setSeconds] = useState(0)
      const [pickerKey, setPickerKey] = useState(0)
      const selectedDurationRef = useRef(0)

      const present = useCallback((initialSeconds: number) => {
        const initialHours = Math.floor(initialSeconds / 3600)
        const remainingAfterHours = initialSeconds % 3600
        const initialMinutes = Math.floor(remainingAfterHours / 60)
        const initialSecs = remainingAfterHours % 60

        selectedDurationRef.current = initialSeconds
        setHours(initialHours)
        setMinutes(initialMinutes)
        setSeconds(initialSecs)
        setPickerKey((prev) => prev + 1)
        bottomSheetModalRef.current?.present()
      }, [])

      const dismiss = useCallback(() => {
        bottomSheetModalRef.current?.dismiss()
      }, [])

      useImperativeHandle(ref, () => ({
        present,
        dismiss,
      }))

      useEffect(() => {
        selectedDurationRef.current = hours * 3600 + minutes * 60 + seconds
      }, [hours, minutes, seconds])

      useModalBackHandler(isOpen, dismiss)
      useModalNavigationSync({
        isOpen,
        present: () => present(selectedDurationRef.current),
        dismiss,
        persistOnNavigation,
      })

      const handleConfirm = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
        onConfirm(selectedDurationRef.current)
        dismiss()
      }

      const handleReset = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
        onReset?.()
        dismiss()
      }

      const renderBackdrop = useCallback(
        (props: any) => (
          <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} opacity={0.4} />
        ),
        [],
      )

      const snapPoints = useMemo(() => ['55%'], [])

      return (
        <BottomSheetModal
          ref={bottomSheetModalRef}
          snapPoints={snapPoints}
          backdropComponent={renderBackdrop}
          onDismiss={onClose}
          enablePanDownToClose={false}
          enableDynamicSizing={false}
          enableContentPanningGesture={false}
          enableHandlePanningGesture={false}
          onChange={(index) => setIsOpen(index >= 0)}
          handleIndicatorStyle={{
            backgroundColor: isDark ? '#525252' : '#d1d5db',
          }}
          animationConfigs={{
            duration: 350,
          }}
        >
          <BottomSheetView
            style={{
              flex: 1,
              paddingHorizontal: 24,
              paddingBottom: insets.bottom + 24,
            }}
          >
            <Text className="mb-6 text-center text-xl font-bold text-black dark:text-white">
              {title}
            </Text>

            <View className="flex-1 items-center justify-center">
              <TimerPicker
                key={pickerKey}
                padWithNItems={2}
                hourLabel="hr"
                minuteLabel="min"
                secondLabel="sec"
                pickerFeedback={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
                }}
                initialValue={{ hours, minutes, seconds }}
                onDurationChange={({ hours, minutes, seconds }) => {
                  setHours(hours)
                  setMinutes(minutes)
                  setSeconds(seconds)
                }}
                styles={{
                  backgroundColor: 'transparent',
                  pickerItem: {
                    color: isDark ? 'white' : 'black',
                    fontSize: 22,
                  },
                  pickerLabel: {
                    color: isDark ? '#9CA3AF' : '#6B7280',
                    fontSize: 14,
                  },
                }}
              />
            </View>

            <View className="mt-4 flex-row gap-3">
              {onReset && (
                <View className="flex-1">
                  <Button title="Reset" variant="secondary" onPress={handleReset} />
                </View>
              )}
              <View className="flex-1">
                <Button title="Cancel" variant="outline" onPress={dismiss} />
              </View>
              <View className="flex-1">
                <Button title={confirmText} variant="primary" onPress={handleConfirm} />
              </View>
            </View>
          </BottomSheetView>
        </BottomSheetModal>
      )
    },
  ),
)

export default TimerDurationModal
