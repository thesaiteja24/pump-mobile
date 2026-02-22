import { useThemeColor } from '@/hooks/useThemeColor'
import { BottomSheetBackdrop, BottomSheetModal, BottomSheetView } from '@gorhom/bottom-sheet'
import * as Haptics from 'expo-haptics'
import React, { useCallback, useMemo, useRef, useState } from 'react'
import { Pressable, Text, View, useColorScheme } from 'react-native'
import DatePicker from 'react-native-date-picker'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Button } from './Button'

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
	const insets = useSafeAreaInsets()

	const { value, onUpdate, dateOnly = false, is24Hour } = props

	const isModal = props.isModal !== false

	const initialDate = value ?? new Date()

	// Ref for the Bottom Sheet
	const bottomSheetModalRef = useRef<BottomSheetModal>(null)

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

	const renderBackdrop = useCallback(
		(props: any) => <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} opacity={0.4} />,
		[]
	)

	/* ---------------------------------------------
     Display string
  --------------------------------------------- */
	const displayValue = useMemo(() => {
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
	}, [value, dateOnly, is24Hour])

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

			<BottomSheetModal
				ref={bottomSheetModalRef}
				index={0}
				enableDynamicSizing={true}
				backdropComponent={renderBackdrop}
				backgroundStyle={{
					backgroundColor: isDark ? '#171717' : 'white',
				}}
				handleIndicatorStyle={{
					backgroundColor: isDark ? '#525252' : '#d1d5db',
				}}
				// Smoother, slightly slower animation
				animationConfigs={{
					duration: 350,
				}}
			>
				<BottomSheetView
					style={{
						paddingBottom: insets.bottom + 16,
						paddingHorizontal: 24,
						paddingTop: 8,
					}}
				>
					<Text className="mb-4 text-center text-xl font-bold" style={{ color: colors.text }}>
						{title}
					</Text>

					<DatePicker
						date={draft}
						onDateChange={setDraft}
						mode={dateOnly ? 'date' : 'datetime'}
						theme={isDark ? 'dark' : 'light'}
						is24hourSource={is24Hour !== undefined ? (is24Hour ? 'locale' : 'device') : 'device'}
						style={{ alignSelf: 'center' }}
					/>

					<View className="mt-6 flex-row gap-4">
						<View className="w-1/2">
							<Button title="Cancel" variant="outline" onPress={handleDismiss} />
						</View>
						<View className="w-1/2">
							<Button title="Confirm" variant="primary" onPress={handleConfirm} />
						</View>
					</View>
				</BottomSheetView>
			</BottomSheetModal>
		</>
	)
}
