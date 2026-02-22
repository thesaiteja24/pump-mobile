import { BottomSheetBackdrop, BottomSheetModal, BottomSheetView } from '@gorhom/bottom-sheet'
import * as Haptics from 'expo-haptics'
import React, { forwardRef, useCallback, useImperativeHandle, useMemo, useRef } from 'react'
import { Text, TouchableOpacity, View, useColorScheme } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Button } from '../ui/Button'

/* ───────────────── Constants ───────────────── */

const RPE_VALUES = [10, 9.5, 9, 8.5, 8, 7.5, 7] as const

const RPE_DESCRIPTIONS: Record<number, string> = {
	10: 'Max effort. No reps left in reserve.',
	9.5: 'Near max. Maybe half a rep left.',
	9: 'Very hard. One rep left in reserve.',
	8.5: 'Hard. One to two reps left.',
	8: 'Challenging but controlled.',
	7.5: 'Moderate-hard training effort.',
	7: 'Comfortably challenging.',
}

/* ───────────────── Handle & Props ───────────────── */

export interface RPESelectionModalHandle {
	present: () => void
	dismiss: () => void
}

type Props = {
	currentValue?: number | null // 0 / undefined = unset
	onClose?: () => void
	onSelect: (value?: number) => void // undefined = reset
}

/* ───────────────── Component ───────────────── */

const RPESelectionModal = forwardRef<RPESelectionModalHandle, Props>(({ currentValue, onClose, onSelect }, ref) => {
	const isDark = useColorScheme() === 'dark'
	const bottomSheetModalRef = useRef<BottomSheetModal>(null)
	const insets = useSafeAreaInsets()

	useImperativeHandle(ref, () => ({
		present: () => {
			bottomSheetModalRef.current?.present()
		},
		dismiss: () => {
			bottomSheetModalRef.current?.dismiss()
		},
	}))

	const selectedValue = currentValue && currentValue > 0 ? currentValue : null

	const description = useMemo(() => {
		if (!selectedValue) {
			return 'Select perceived effort for this set.'
		}
		return RPE_DESCRIPTIONS[selectedValue]
	}, [selectedValue])

	const renderBackdrop = useCallback(
		(props: any) => <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} opacity={0.4} />,
		[]
	)

	// Using a dynamic or fixed snap point. Fixed is safest for this content.
	const snapPoints = useMemo(() => ['60%'], [])

	return (
		<BottomSheetModal
			ref={bottomSheetModalRef}
			snapPoints={snapPoints}
			backdropComponent={renderBackdrop}
			onDismiss={onClose}
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
			<BottomSheetView style={{ flex: 1, paddingBottom: insets.bottom }} className="dark:bg-neutral-900">
				{/* Header */}
				<Text className="mb-4 text-center text-lg font-bold text-black dark:text-white">RPE</Text>

				<View className="flex-1 px-6">
					<View className="flex-row">
						{/* ───── Left: Scale ───── */}
						<View className="flex-1 items-center">
							<View className="gap-4 rounded-full bg-slate-50 px-2 py-4 dark:bg-neutral-800">
								{RPE_VALUES.map(value => {
									const isSelected = value === selectedValue

									return (
										<TouchableOpacity
											key={value}
											onPress={() => {
												Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)

												if (isSelected) {
													onSelect(undefined)
												} else {
													onSelect(value)
												}
											}}
											className={`flex-row items-center justify-center gap-4 px-2 ${
												isSelected ? 'rounded-full bg-blue-100 dark:bg-blue-900' : ''
											}`}
										>
											<Text
												className={`text-center text-base ${
													isSelected
														? 'font-semibold text-primary'
														: 'text-neutral-500 dark:text-neutral-400'
												}`}
											>
												{value}
											</Text>
										</TouchableOpacity>
									)
								})}
							</View>
						</View>

						{/* ───── Right: Detail ───── */}
						<View className="flex-1 items-center justify-center px-4">
							<Text className="text-4xl font-bold text-black dark:text-white">
								{selectedValue ?? '--'}
							</Text>

							<Text className="mt-2 text-center text-sm text-neutral-600 dark:text-neutral-400">
								{description}
							</Text>
						</View>
					</View>

					{/* Actions */}
					<View className="mt-4">
						<Button
							title="Done"
							variant="primary"
							onPress={() => {
								// Done
								bottomSheetModalRef.current?.dismiss()
							}}
						/>
					</View>

					{/* Footer hint */}
					<Text className="mt-4 text-center text-xs text-neutral-400">
						Tap selected value again to clear RPE
					</Text>
				</View>
			</BottomSheetView>
		</BottomSheetModal>
	)
})

RPESelectionModal.displayName = 'RPESelectionModal'

export default RPESelectionModal
