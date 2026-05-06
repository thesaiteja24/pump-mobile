import { BaseModal, BaseModalHandle } from '@/components/ui/BaseModal'
import * as Haptics from 'expo-haptics'
import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react'
import { View, useColorScheme } from 'react-native'
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
}

const TimerDurationModal = React.memo(
  forwardRef<TimerDurationModalHandle, TimerDurationModalProps>(
    ({ title, confirmText = 'Save', onClose, onConfirm, onReset }, ref) => {
      const isDark = useColorScheme() === 'dark'
      const baseModalRef = useRef<BaseModalHandle>(null)
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
        baseModalRef.current?.present()
      }, [])

      const dismiss = useCallback(() => {
        baseModalRef.current?.dismiss()
      }, [])

      useImperativeHandle(ref, () => ({
        present,
        dismiss,
      }))

      useEffect(() => {
        selectedDurationRef.current = hours * 3600 + minutes * 60 + seconds
      }, [hours, minutes, seconds])

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

      return (
        <BaseModal
          ref={baseModalRef}
          title={title}
          onDismiss={onClose}
          confirmAction={{
            title: confirmText,
            onPress: handleConfirm,
          }}
          cancelAction={{
            onPress: dismiss,
          }}
          deleteAction={
            onReset
              ? {
                  title: 'Reset',
                  onPress: handleReset,
                }
              : undefined
          }
        >
          <View className="items-center justify-center py-4">
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
              onDurationChange={(val) => {
                setHours(val.hours)
                setMinutes(val.minutes)
                setSeconds(val.seconds)
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
        </BaseModal>
      )
    },
  ),
)

export default TimerDurationModal
