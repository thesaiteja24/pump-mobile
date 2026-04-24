import { ReadOnlyExerciseRow } from '@/components/workout/ReadOnlyExerciseRow'
import { ProgramDay, UserProgramDay } from '@/types/program'
import { FontAwesome6 } from '@expo/vector-icons'
import { BottomSheetBackdrop, BottomSheetModal, BottomSheetScrollView } from '@gorhom/bottom-sheet'
import { router } from 'expo-router'
import React, { forwardRef, useCallback, useImperativeHandle, useMemo, useRef, useState } from 'react'
import { BackHandler, Text, View, useColorScheme } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Button } from '@/components/ui/Button'
import { GlassBackground } from '@/components/ui/GlassBackground'

export interface WorkoutDetailsModalHandle {
	present: (day: ProgramDay | UserProgramDay, isStartable?: boolean) => void
	dismiss: () => void
}

export interface WorkoutDetailsModalProps {
	onOpenChange?: (isOpen: boolean) => void
	onStartWorkout?: (day: UserProgramDay) => void
}

export const WorkoutDetailsModal = forwardRef<WorkoutDetailsModalHandle, WorkoutDetailsModalProps>(
	({ onOpenChange, onStartWorkout }, ref) => {
		const [selectedDay, setSelectedDay] = useState<ProgramDay | UserProgramDay | null>(null)
		const [isStartable, setIsStartable] = useState(false)
		const isDark = useColorScheme() === 'dark'
		const insets = useSafeAreaInsets()
		const [isOpen, setIsOpen] = useState(false)
		const bottomSheetModalRef = useRef<BottomSheetModal>(null)
		const dynamicSizing = selectedDay?.isRestDay ? true : false

		useImperativeHandle(ref, () => ({
			present: (day: ProgramDay | UserProgramDay, startable: boolean = false) => {
				setSelectedDay(day)
				setIsStartable(startable)
				setIsOpen(true)
				onOpenChange?.(true)
				bottomSheetModalRef.current?.present()
			},
			dismiss: () => {
				bottomSheetModalRef.current?.dismiss()
			},
		}))

		// ✅ Handle Android back gesture
		React.useEffect(() => {
			const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
				if (isOpen) {
					bottomSheetModalRef.current?.dismiss()
					return true // consume back press
				}
				return false // allow navigation
			})

			return () => subscription.remove()
		}, [isOpen])

		const renderBackdrop = useCallback(
			(props: any) => <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} opacity={0.4} />,
			[]
		)

		const template = useMemo(() => {
			if (!selectedDay) return null
			return 'template' in selectedDay
				? (selectedDay as ProgramDay).template
				: (selectedDay as UserProgramDay).templateSnapshot
		}, [selectedDay])

		const groupMap = useMemo(() => {
			const map = new Map<string, any>()
			template?.exerciseGroups?.forEach((g: any) => map.set(g.id, g))
			return map
		}, [template?.exerciseGroups])

		const snapPoints = useMemo(() => ['75%'], [])

		const renderContent = () => {
			if (!selectedDay) return null

			if (selectedDay.isRestDay) {
				return (
					<View className="items-center justify-center px-6 py-12">
						<View className="mb-6 h-20 w-20 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30">
							<FontAwesome6 name="heart-circle-bolt" size={40} color="#10b981" />
						</View>
						<Text className="mb-2 text-center text-2xl font-bold text-black dark:text-white">
							Rest & Recovery
						</Text>
						<Text className="text-center text-base leading-6 text-neutral-600 dark:text-neutral-400">
							Your muscles grow while you rest, not while you work. Take this time to refuel and recharge
							for your next session!
						</Text>
					</View>
				)
			}

			if (!template) {
				return (
					<View className="items-center justify-center py-12">
						<Text className="text-neutral-500">No workout linked for this day.</Text>
					</View>
				)
			}

			return (
				<View className="flex-1">
					{/* Header */}
					<View className="border-b border-neutral-100 p-4 dark:border-neutral-900">
						<Text className="mb-2 text-2xl font-bold text-black dark:text-white">{template.title}</Text>
						{template.notes && (
							<Text className="mb-4 text-base text-neutral-600 dark:text-neutral-400">
								{template.notes}
							</Text>
						)}
						<View className="flex-row gap-4">
							<View className="rounded-full bg-neutral-100 px-3 py-1 dark:bg-neutral-800">
								<Text className="text-sm font-medium text-neutral-500">
									{template.exercises.length} Exercises
								</Text>
							</View>
							<View className="rounded-full bg-blue-100 px-3 py-1 dark:bg-blue-900/30">
								<Text className="text-sm font-medium text-blue-600 dark:text-blue-400">
									{selectedDay.name}
								</Text>
							</View>
						</View>
					</View>

					{/* Exercise List */}
					<View className="gap-4 p-4">
						{template.exercises.map((ex: any, idx: number) => (
							<ReadOnlyExerciseRow
								key={ex.id || idx}
								exercise={ex}
								group={ex.exerciseGroupId ? groupMap.get(ex.exerciseGroupId) : null}
							/>
						))}
					</View>

					{/* Footer Start Button */}
					{isStartable && (
						<View className="mt-4 p-4">
							<Button
								title="Start Scheduled Workout"
								onPress={() => {
									if (selectedDay && 'templateSnapshot' in selectedDay) {
										onStartWorkout?.(selectedDay as UserProgramDay)
									}
									bottomSheetModalRef.current?.dismiss()
									router.push({
										pathname: '/(app)/workout/start',
									})
								}}
								liquidGlass
							/>
						</View>
					)}
				</View>
			)
		}

		return (
			<BottomSheetModal
				ref={bottomSheetModalRef}
				snapPoints={snapPoints}
				enableDynamicSizing={dynamicSizing}
				backdropComponent={renderBackdrop}
				backgroundComponent={GlassBackground}
				onDismiss={() => {
					setIsOpen(false)
					onOpenChange?.(false)
				}}
				onChange={index => {
					const open = index >= 0
					setIsOpen(open)
					onOpenChange?.(open)
				}}
				handleIndicatorStyle={{
					backgroundColor: isDark ? '#525252' : '#d1d5db',
				}}
				animationConfigs={{ duration: 350 }}
			>
				<BottomSheetScrollView
					style={{ marginBottom: insets.bottom }}
					showsVerticalScrollIndicator={false}
					contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
				>
					{renderContent()}
				</BottomSheetScrollView>
			</BottomSheetModal>
		)
	}
)

WorkoutDetailsModal.displayName = 'WorkoutDetailsModal'
