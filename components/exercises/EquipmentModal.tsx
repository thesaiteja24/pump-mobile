import { BottomSheetBackdrop, BottomSheetModal, BottomSheetScrollView, BottomSheetView } from '@gorhom/bottom-sheet'
import { Image } from 'expo-image'
import React, { forwardRef, useCallback, useImperativeHandle, useMemo, useRef } from 'react'
import { ActivityIndicator, Text, TouchableOpacity, View, useColorScheme } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

export interface EquipmentModalHandle {
	present: () => void
	dismiss: () => void
}

type Props = {
	loading: boolean
	enableCreate?: boolean
	equipment: any[]

	onClose?: () => void
	onSelect: (equipment: any) => void
	onLongPress?: (equipment: any) => void
	onCreatePress?: () => void
}

const EquipmentModal = forwardRef<EquipmentModalHandle, Props>(
	({ loading, enableCreate, equipment, onClose, onSelect, onLongPress, onCreatePress }, ref) => {
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

		const snapPoints = useMemo(() => ['85%'], [])

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
				enableDynamicSizing={false}
				// Smoother, slightly slower animation
				animationConfigs={{
					duration: 350,
				}}
			>
				<BottomSheetView style={{ flex: 1, paddingBottom: insets.bottom }} className="dark:bg-neutral-900">
					<View className="px-6 pt-4">
						<View
							className={`flex-row items-center ${
								onCreatePress && enableCreate ? 'justify-between' : 'justify-center'
							} mb-6`}
						>
							<Text className="text-xl font-bold text-black dark:text-white">Equipment</Text>

							{onCreatePress && enableCreate && (
								<TouchableOpacity onPress={onCreatePress}>
									<Text className="text-xl text-primary">Create</Text>
								</TouchableOpacity>
							)}
						</View>
					</View>

					{loading ? (
						<View className="flex-1 items-center justify-center">
							<ActivityIndicator animating size="large" />
						</View>
					) : (
						<BottomSheetScrollView contentContainerStyle={{ paddingHorizontal: 24 }}>
							{equipment.map(item => (
								<TouchableOpacity
									key={item.id}
									className="flex-row items-center justify-between pb-4"
									onPress={() => onSelect(item)}
									onLongPress={() => onLongPress?.(item)}
									delayLongPress={700}
								>
									<Text className="text-xl font-semibold text-black dark:text-white">
										{item.title}
									</Text>

									<Image
										source={item.thumbnailUrl}
										style={{
											width: 50,
											height: 50,
											borderRadius: 100,
											borderWidth: 1,
											borderColor: 'gray',
											backgroundColor: 'white',
										}}
										contentFit="contain"
									/>
								</TouchableOpacity>
							))}
						</BottomSheetScrollView>
					)}
				</BottomSheetView>
			</BottomSheetModal>
		)
	}
)

EquipmentModal.displayName = 'EquipmentModal'

export default EquipmentModal
