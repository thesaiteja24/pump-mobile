import { useThemeColor } from '@/hooks/useThemeColor'
import { VisibilityType } from '@/stores/workoutStore'
import { Ionicons } from '@expo/vector-icons'
import { BottomSheetBackdrop, BottomSheetModal, BottomSheetView } from '@gorhom/bottom-sheet'
import * as Haptics from 'expo-haptics'
import React, { forwardRef, useCallback, useImperativeHandle, useMemo, useRef } from 'react'
import { Text, TouchableOpacity, View, useColorScheme } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

const SET_TYPES: {
	key: 'public' | 'private'
	title: string
	description: string
	titleClass: string
}[] = [
	{
		key: 'public',
		title: 'Public',
		description: 'Everyone on the PUMP can see this workout.',
		titleClass: 'text-blue-500',
	},
	{
		key: 'private',
		title: 'Private',
		description: 'Only you can see this workout.',
		titleClass: 'text-red-600',
	},
]

export interface VisibilitySelectionModalHandle {
	present: () => void
	dismiss: () => void
}

type Props = {
	currentType: VisibilityType
	onSelect: (type: VisibilityType) => void
	onClose?: () => void
}

const VisibilitySelectionModal = forwardRef<VisibilitySelectionModalHandle, Props>(
	({ currentType, onSelect, onClose }, ref) => {
		const colors = useThemeColor()
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

		const renderBackdrop = useCallback(
			(props: any) => <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} opacity={0.4} />,
			[]
		)

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
				<BottomSheetView style={{ flex: 1, paddingBottom: insets.bottom + 24 }} className="dark:bg-neutral-900">
					<View className="flex-1 px-6">
						{/* Header */}
						<View className="mb-6 flex-row items-center justify-between">
							<Text className="text-xl font-bold text-black dark:text-white">Set Visibility</Text>

							<TouchableOpacity onPress={() => bottomSheetModalRef.current?.dismiss()}>
								<Ionicons name="close" size={24} color={isDark ? 'white' : 'gray'} />
							</TouchableOpacity>
						</View>

						{/* Options */}
						<View className="gap-4">
							{SET_TYPES.map(type => {
								const selected = currentType === type.key

								return (
									<TouchableOpacity
										key={type.key}
										onPress={() => {
											Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
											onSelect(type.key)
											bottomSheetModalRef.current?.dismiss()
										}}
										className={`rounded-xl border p-4 ${
											selected
												? 'border-primary bg-blue-50 dark:bg-blue-950'
												: 'border-neutral-300 dark:border-neutral-700'
										}`}
									>
										<View className="flex-row items-start justify-between">
											<View className="flex-1 pr-4">
												<Text className={`text-lg font-bold ${type.titleClass}`}>
													{type.title}
												</Text>

												<Text className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
													{type.description}
												</Text>
											</View>

											{selected && (
												<Ionicons name="checkmark-circle" size={22} color={colors.primary} />
											)}
										</View>
									</TouchableOpacity>
								)
							})}
						</View>
					</View>
				</BottomSheetView>
			</BottomSheetModal>
		)
	}
)

VisibilitySelectionModal.displayName = 'VisibilitySelectionModal'

export default VisibilitySelectionModal
