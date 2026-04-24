import { useThemeColor } from '@/hooks/useThemeColor'
import { Ionicons } from '@expo/vector-icons'
import { BottomSheetBackdrop, BottomSheetModal, BottomSheetView } from '@gorhom/bottom-sheet'
import React, { forwardRef, useCallback, useImperativeHandle, useRef } from 'react'
import { Text, useColorScheme, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Button } from '@/components/ui/Button'
import { GlassBackground } from '@/components/ui/GlassBackground'

interface ProgramWorkoutPromptProps {
	programTitle: string
	workoutTitle: string
	onSelectProgram: () => void
	onSelectEmpty: () => void
}

export interface ProgramWorkoutPromptHandle {
	present: () => void
	dismiss: () => void
}

const ProgramWorkoutPromptModal = forwardRef<ProgramWorkoutPromptHandle, ProgramWorkoutPromptProps>(
	({ programTitle, workoutTitle, onSelectProgram, onSelectEmpty }, ref) => {
		const bottomSheetRef = useRef<BottomSheetModal>(null)
		const colors = useThemeColor()
		const isDark = useColorScheme() === 'dark'
		const insets = useSafeAreaInsets()

		useImperativeHandle(ref, () => ({
			present: () => bottomSheetRef.current?.present(),
			dismiss: () => bottomSheetRef.current?.dismiss(),
		}))

		const renderBackdrop = useCallback(
			(props: any) => <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} opacity={0.4} />,
			[]
		)

		return (
			<BottomSheetModal
				ref={bottomSheetRef}
				index={0}
				snapPoints={['40%']}
				enableDynamicSizing={false}
				enablePanDownToClose={true}
				backdropComponent={renderBackdrop}
				backgroundComponent={GlassBackground}
				handleIndicatorStyle={{ backgroundColor: isDark ? '#525252' : '#d1d5db' }}
				animationConfigs={{ duration: 350 }}
			>
				<BottomSheetView style={{ paddingBottom: insets.bottom + 24 }} className="flex-1 px-6">
					<View className="mb-6 items-center">
						<View className="mb-4 h-16 w-16 items-center justify-center rounded-full bg-primary/10">
							<Ionicons name="calendar-outline" size={32} color={colors.primary} />
						</View>
						<Text className="text-center text-xl font-bold text-black dark:text-white">
							Today&apos;s Program Workout
						</Text>
						<Text className="mt-2 text-center text-neutral-500 dark:text-neutral-400">
							You have a scheduled workout for{' '}
							<Text className="font-semibold text-primary">{programTitle}</Text>
						</Text>
						<Text className="mt-1 text-center font-medium text-black dark:text-white">{workoutTitle}</Text>
					</View>

					<View className="flex-col gap-3">
						<Button
							title="Start Scheduled Workout"
							onPress={() => {
								onSelectProgram()
								bottomSheetRef.current?.dismiss()
							}}
							fullWidth
							liquidGlass
						/>
						<Button
							title="Start Empty Workout"
							variant="secondary"
							onPress={() => {
								onSelectEmpty()
								bottomSheetRef.current?.dismiss()
							}}
							fullWidth
							liquidGlass
						/>
					</View>
				</BottomSheetView>
			</BottomSheetModal>
		)
	}
)

ProgramWorkoutPromptModal.displayName = 'ProgramWorkoutPromptModal'
export default ProgramWorkoutPromptModal
