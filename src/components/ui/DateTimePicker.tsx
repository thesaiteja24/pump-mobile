import { BaseModal, BaseModalHandle } from '@/components/ui/BaseModal'
import { useThemeColor } from '@/hooks/theme'
import * as Haptics from 'expo-haptics'
import { useCallback, useMemo, useRef, useState } from 'react'
import { Pressable, Text, View, useColorScheme } from 'react-native'
import DatePicker from 'react-native-date-picker'

/* --------------------------------------------------
   Types
-------------------------------------------------- */

interface BaseDateTimePickerProps {
  /**
   * Current value of the picker.
   * If omitted, defaults to the current date/time.
   */
  value?: Date

  /**
   * Called when the date changes.
   *
   * - In modal mode: called only after confirmation
   * - In inline mode: called immediately on change
   */
  onUpdate: (date: Date) => void

  /**
   * Disable time selection and allow date-only picking.
   *
   * @default false
   */
  dateOnly?: boolean

  /**
   * Force 24-hour or 12-hour time format.
   * Uses device preference if omitted.
   */
  is24Hour?: boolean

  /**
   * Return null if the date is not set.
   */
  returnUndefined?: boolean

  /**
   * Minimum date for the picker.
   */
  minimumDate?: Date
}

export interface DateTimePickerModalProps extends BaseDateTimePickerProps {
  /**
   * Render the picker inside a confirmation modal.
   *
   * @default true
   */
  isModal?: true

  /**
   * Title displayed at the top of the modal.
   *
   * @default "Select date"
   */
  title?: string

  /**
   * Styling for the displayed value text.
   */
  textClassName?: string
}

export interface DateTimePickerInlineProps extends BaseDateTimePickerProps {
  /**
   * Render the picker inline without a modal.
   */
  isModal: false
}

export type DateTimePickerProps = DateTimePickerModalProps | DateTimePickerInlineProps

/* --------------------------------------------------
   Component
-------------------------------------------------- */

export default function DateTimePicker(props: DateTimePickerProps) {
  const isDark = useColorScheme() === 'dark'
  const colors = useThemeColor()

  const { value, onUpdate, dateOnly = false, is24Hour, minimumDate } = props

  const isModal = props.isModal !== false

  const initialDate = useMemo(() => value ?? new Date(), [value])

  // Ref for the Bottom Sheet
  const bottomSheetModalRef = useRef<BaseModalHandle>(null)

  // Local state for draft value
  const [draft, setDraft] = useState<Date>(initialDate)

  // Update draft whenever the modal opens or value changes
  // We can hook into the sheet change or just rely on `present` resetting it if we exposed a method,
  // but here the trigger is internal.
  // We'll reset draft when we open the modal.

  const handlePresent = useCallback(() => {
    setDraft(value ?? new Date())
    bottomSheetModalRef.current?.present()
  }, [value])

  const handleDismiss = useCallback(() => {
    bottomSheetModalRef.current?.dismiss()
  }, [])

  const handleConfirm = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    onUpdate(draft)
    handleDismiss()
  }, [draft, onUpdate, handleDismiss])

  /* ---------------------------------------------
     Display string
  --------------------------------------------- */
  const displayValue = useMemo(() => {
    if (!value && props.returnUndefined) return 'Not Set'

    const d = value ?? initialDate

    if (dateOnly) {
      return d.toLocaleDateString()
    }

    return d.toLocaleString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: is24Hour !== undefined ? !is24Hour : undefined,
    })
  }, [value, dateOnly, is24Hour, initialDate, props.returnUndefined])

  /* ---------------------------------------------
     Inline mode
  --------------------------------------------- */

  if (!isModal) {
    return (
      <DatePicker
        date={initialDate}
        onDateChange={onUpdate}
        mode={dateOnly ? 'date' : 'datetime'}
        theme={isDark ? 'dark' : 'light'}
        is24hourSource={is24Hour !== undefined ? (is24Hour ? 'locale' : 'device') : 'device'}
      />
    )
  }

  /* ---------------------------------------------
     Modal mode
  --------------------------------------------- */

  const { textClassName, title = 'Select date' } = props

  return (
    <>
      <Pressable onPress={handlePresent}>
        <Text
          className={textClassName ?? 'text-base font-medium'}
          style={!textClassName ? { color: colors.primary } : undefined}
        >
          {displayValue}
        </Text>
      </Pressable>

      <BaseModal
        ref={bottomSheetModalRef}
        title={title}
        confirmAction={{
          title: 'Confirm',
          onPress: handleConfirm,
        }}
        cancelAction={{
          onPress: handleDismiss,
        }}
      >
        <View className="items-center">
          <DatePicker
            date={draft}
            onDateChange={setDraft}
            mode={dateOnly ? 'date' : 'datetime'}
            theme={isDark ? 'dark' : 'light'}
            is24hourSource={is24Hour !== undefined ? (is24Hour ? 'locale' : 'device') : 'device'}
            style={{ alignSelf: 'center' }}
            minimumDate={minimumDate}
          />
        </View>
      </BaseModal>
    </>
  )
}
