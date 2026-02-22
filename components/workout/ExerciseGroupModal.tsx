import { Ionicons } from '@expo/vector-icons'
import { BottomSheetBackdrop, BottomSheetModal, BottomSheetScrollView, BottomSheetView } from '@gorhom/bottom-sheet'
import { Image } from 'expo-image'
import React, { forwardRef, useCallback, useImperativeHandle, useMemo, useRef } from 'react'
import { Text, TouchableOpacity, View, useColorScheme } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Button } from '../ui/Button'

type GroupExerciseItem = {
	id: string
	title: string
	thumbnailUrl?: string
	selected: boolean
	disabled: boolean
}

export interface ExerciseGroupModalHandle {
	present: () => void
	dismiss: () => void
}

type Props = {
	exercises: GroupExerciseItem[]
	onSelect: (exercise: GroupExerciseItem) => void
	onClose?: () => void
	onConfirm?: () => void
}

const ExerciseGroupModal = forwardRef<ExerciseGroupModalHandle, Props>(
	({ exercises, onSelect, onClose, onConfirm }, ref) => {
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
				<BottomSheetView style={{ flex: 1, paddingBottom: insets.bottom + 24 }} className="dark:bg-[#111]">
					{/* Header */}
					<View className="mb-6 flex-row items-center justify-between px-6 pt-4">
						<Text className="text-xl font-bold text-black dark:text-white">Select Exercises</Text>

						<TouchableOpacity onPress={() => bottomSheetModalRef.current?.dismiss()}>
							<Ionicons name="close" size={24} color="gray" />
						</TouchableOpacity>
					</View>

					{/* Exercise list */}
					<BottomSheetScrollView
						showsVerticalScrollIndicator={false}
						contentContainerStyle={{ paddingHorizontal: 24 }}
					>
						{exercises.map(exercise => {
							const opacity = exercise.disabled ? 0.4 : 1
							const borderColor = exercise.selected ? 'border-blue-500' : 'border-neutral-300'

							return (
								<TouchableOpacity
									key={exercise.id}
									disabled={exercise.disabled}
									onPress={() => onSelect(exercise)}
									className={`mb-3 flex-row items-center gap-4 rounded-xl border ${borderColor} p-3`}
									style={{ opacity }}
								>
									<Image
										source={{ uri: exercise.thumbnailUrl }}
										style={{
											width: 44,
											height: 44,
											borderRadius: 22,
											borderWidth: 1,
											borderColor: 'gray',
										}}
									/>

									<Text className="flex-1 text-base text-black dark:text-white">
										{exercise.title}
									</Text>

									{exercise.selected && (
										<Ionicons name="checkmark-circle" size={22} color="#3b82f6" />
									)}
								</TouchableOpacity>
							)
						})}
					</BottomSheetScrollView>

					{/* Footer */}
					{onConfirm && (
						<View className="mt-4 px-6">
							<Button
								title="Confirm"
								onPress={() => {
									onConfirm()
									bottomSheetModalRef.current?.dismiss()
								}}
							/>
						</View>
					)}
				</BottomSheetView>
			</BottomSheetModal>
		)
	}
)

ExerciseGroupModal.displayName = 'ExerciseGroupModal'

export default ExerciseGroupModal
