import { BottomSheetBackdrop, BottomSheetModal, BottomSheetScrollView } from '@gorhom/bottom-sheet'
import { Image } from 'expo-image'
import React, { forwardRef, useCallback, useImperativeHandle, useMemo, useRef } from 'react'
import { ActivityIndicator, Text, TouchableOpacity, View, useColorScheme } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { GlassBackground } from '@/components/ui/GlassBackground'
import { MetaItem } from '@/types/meta'

export interface MetaModalHandle {
	present: () => void
	dismiss: () => void
}

type Props = {
	title: string
	loading: boolean
	enableCreate?: boolean
	items: MetaItem[]

	onClose?: () => void
	onSelect: (item: MetaItem) => void
	onLongPress?: (item: MetaItem) => void
	onCreatePress?: () => void
}

const MetaModal = forwardRef<MetaModalHandle, Props>(
	({ title, loading, enableCreate, items, onClose, onSelect, onLongPress, onCreatePress }, ref) => {
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
				handleIndicatorStyle={{
					backgroundColor: isDark ? '#525252' : '#d1d5db',
				}}
				backgroundComponent={GlassBackground}
				enableDynamicSizing={false}
				animationConfigs={{
					duration: 350,
				}}
			>
				<View style={{ flex: 1, paddingBottom: insets.bottom }}>
					<View className="px-6 pt-4">
						<View
							className={`flex-row items-center ${
								onCreatePress && enableCreate ? 'justify-between' : 'justify-center'
							} mb-6`}
						>
							<Text className="text-xl font-bold text-black dark:text-white">{title}</Text>

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
						<BottomSheetScrollView
							style={{ flex: 1 }}
							contentContainerStyle={{
								paddingHorizontal: 24,
							}}
							showsVerticalScrollIndicator={false}
						>
							{items.map(item => (
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
				</View>
			</BottomSheetModal>
		)
	}
)

MetaModal.displayName = 'MetaModal'

export default MetaModal
