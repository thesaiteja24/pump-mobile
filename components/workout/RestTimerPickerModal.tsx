import { BottomSheetBackdrop, BottomSheetModal, BottomSheetView } from '@gorhom/bottom-sheet'
import * as Haptics from 'expo-haptics'
import React, { forwardRef, useCallback, useImperativeHandle, useMemo, useRef, useState } from 'react'
import { Text, TouchableOpacity, View, useColorScheme } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { TimerPicker } from 'react-native-timer-picker'

/* --------------------------------------------------
   Types
-------------------------------------------------- */

export interface RestTimerPickerModalHandle {
	present: (initialSeconds: number) => void
	dismiss: () => void
}

export interface RestTimerPickerModalProps {
	/**
	 * Called when the modal is dismissed without confirming.
	 */
	onClose?: () => void

	/**
	 * Called when the user confirms a duration.
	 *
	 * @param seconds Total selected duration in seconds
	 */
	onConfirm: (seconds: number) => void
}

/* --------------------------------------------------
   Component
-------------------------------------------------- */

const RestTimerPickerModal = React.memo(
	forwardRef<RestTimerPickerModalHandle, RestTimerPickerModalProps>(({ onClose, onConfirm }, ref) => {
		const isDark = useColorScheme() === 'dark'
		const bottomSheetModalRef = useRef<BottomSheetModal>(null)
		const insets = useSafeAreaInsets()

		// Internal state for the picker
		const [hours, setHours] = useState(0)
		const [minutes, setMinutes] = useState(0)
		const [seconds, setSeconds] = useState(0)

		const [pickerKey, setPickerKey] = useState(0)

		// Expose methods to parent
		useImperativeHandle(ref, () => ({
			present: (initialSeconds: number) => {
				const initialHours = Math.floor(initialSeconds / 3600)
				const remainingAfterHours = initialSeconds % 3600
				const initialMinutes = Math.floor(remainingAfterHours / 60)
				const initialSecs = remainingAfterHours % 60

				setHours(initialHours)
				setMinutes(initialMinutes)
				setSeconds(initialSecs)

				// Force re-mount of picker to apply new initial values
				setPickerKey(prev => prev + 1)

				bottomSheetModalRef.current?.present()
			},
			dismiss: () => {
				bottomSheetModalRef.current?.dismiss()
			},
		}))

		const handleConfirm = () => {
			const totalSeconds = hours * 3600 + minutes * 60 + seconds
			Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
			onConfirm(totalSeconds)
			bottomSheetModalRef.current?.dismiss()
		}

		const handlePickerFeedback = () => {
			Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
		}

		// Backdrop
		const renderBackdrop = useCallback(
			(props: any) => <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} opacity={0.4} />,
			[]
		)

		const snapPoints = useMemo(() => ['55%'], [])

		return (
			<BottomSheetModal
				ref={bottomSheetModalRef}
				snapPoints={snapPoints}
				backdropComponent={renderBackdrop}
				onDismiss={onClose}
				enablePanDownToClose={true}
				enableDynamicSizing={false}
				enableContentPanningGesture={false}
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
						flex: 1,
						paddingHorizontal: 24,
						paddingBottom: insets.bottom + 24,
					}}
					className="dark:bg-neutral-900"
				>
					{/* Title */}
					<Text className="mb-6 text-center text-xl font-bold text-black dark:text-white">Rest Timer</Text>

					{/* Picker */}
					<View className="flex-1 items-center justify-center">
						<TimerPicker
							key={pickerKey}
							padWithNItems={2}
							hourLabel="hr"
							minuteLabel="min"
							secondLabel="sec"
							pickerFeedback={handlePickerFeedback}
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

					{/* Actions */}
					<View className="mt-4 flex-row gap-4">
						<TouchableOpacity
							onPress={() => bottomSheetModalRef.current?.dismiss()}
							className="h-12 flex-1 justify-center rounded-2xl border border-neutral-300 dark:border-neutral-700"
						>
							<Text className="text-center text-lg font-semibold text-black dark:text-white">Cancel</Text>
						</TouchableOpacity>

						<TouchableOpacity
							onPress={handleConfirm}
							className="h-12 flex-1 justify-center rounded-2xl bg-primary"
						>
							<Text className="text-center text-lg font-semibold text-white">Confirm</Text>
						</TouchableOpacity>
					</View>
				</BottomSheetView>
			</BottomSheetModal>
		)
	})
)

export default RestTimerPickerModal
