import SetRow from '@/components/workout/SetRow'
import { Exercise, ExerciseType } from '@/stores/exerciseStore'
import { TemplateExercise, TemplateExerciseGroup } from '@/stores/template/types'
import { WeightUnits } from '@/stores/userStore'
import { WorkoutLogExercise, WorkoutLogGroup } from '@/stores/workoutStore'
import { Entypo } from '@expo/vector-icons'
import { BottomSheetBackdrop, BottomSheetModal, BottomSheetView } from '@gorhom/bottom-sheet'
import { Image } from 'expo-image'
import React, { memo, useCallback, useRef, useState } from 'react'
import { Text, TouchableOpacity, View, useColorScheme } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Button } from '../ui/Button'
import RestTimerPickerModal, { RestTimerPickerModalHandle } from './RestTimerPickerModal'

/* ───────────────── Capabilities ───────────────── */

const EXERCISE_CAPABILITIES: Record<ExerciseType, { hasWeight: boolean; hasReps: boolean; hasDuration: boolean }> = {
	weighted: { hasWeight: true, hasReps: true, hasDuration: false },
	repsOnly: { hasWeight: false, hasReps: true, hasDuration: false },
	assisted: { hasWeight: false, hasReps: true, hasDuration: false },
	durationOnly: { hasWeight: false, hasReps: false, hasDuration: true },
}

const COL_SET = 'w-[40%] flex-row items-center justify-evenly'
const COL_STD = 'w-[20%] flex-row items-center justify-evenly'
const COL_RPE = 'w-[20%] flex-row items-center justify-evenly'

// Colors for different groups
const GROUP_COLORS = [
	'#4C1D95', // deep purple
	'#7C2D12', // dark orange / brown
	'#14532D', // dark green
	'#7F1D1D', // dark red
	'#1E3A8A', // deep blue
	'#581C87', // violet
	'#0F766E', // teal
	'#1F2937', // slate
]

// Simple hash function to map a string to an index
function hashStringToIndex(str: string, modulo: number) {
	let hash = 0

	for (let i = 0; i < str.length; i++) {
		hash = (hash << 5) - hash + str.charCodeAt(i)
		hash |= 0 // force 32-bit
	}

	return Math.abs(hash) % modulo
}

// Get color for a group based on its ID
function getGroupColor(groupId: string) {
	const index = hashStringToIndex(groupId, GROUP_COLORS.length)
	return GROUP_COLORS[index]
}

/* ───────────────── Props ───────────────── */

/**
 * Props for the ExerciseRow component.
 * Handles both Active Workout usage (interactive, timer-aware) and Template usage (static definition).
 */
type Props = {
	/** The exercise data to display. Union of Active and Template types. */
	exercise: WorkoutLogExercise | TemplateExercise
	/** Static reference data for the exercise (title, thumbnail, type). */
	exerciseDetails: Exercise
	/** Whether this is the currently active exercise in the list (for highlighting). */
	isActive: boolean
	/** Whether this exercise is currently being dragged/reordered. */
	isDragging: boolean
	/** Grouping details if part of a Superset or Giant Set. */
	groupDetails?: WorkoutLogGroup | TemplateExerciseGroup | null
	/** User preference for weight display (kg/lbs). */
	preferredWeightUnit: WeightUnits
	/**
	 * If true, renders in "Template Mode":
	 * - Hides "Previous Set" column
	 * - Disables timers
	 * - Enables duration input editing
	 */
	isTemplate?: boolean

	/* ─── Interactions ─── */
	drag?: () => void
	onPress?: () => void

	/* ─── Exercise Actions ─── */
	onReplaceExercise: () => void
	onCreateSuperSet: () => void
	onCreateGiantSet: () => void
	onRemoveExerciseGroup: () => void
	onDeleteExercise: () => void

	/* ─── Set Actions ─── */
	onAddSet: (exerciseId: string) => void
	onUpdateSet: (exerciseId: string, setId: string, patch: any) => void
	onToggleCompleteSet?: (exerciseId: string, setId: string) => void
	onDeleteSet: (exerciseId: string, setId: string) => void

	/* ─── Timer Actions ─── */
	onStartSetTimer?: (exerciseId: string, setId: string) => void
	onStopSetTimer?: (exerciseId: string, setId: string) => void

	/* ─── Shortcuts ─── */
	onSaveRestPreset?: (exerciseId: string, setId: string, seconds: number) => void
}

/* ───────────────── Component ───────────────── */

/**
 * A complex row component representing a single Exercise and its Sets.
 *
 * Capabilities:
 * - **Reorderable**: Supports drag-and-drop handles.
 * - **Swipeable**: Inner SetRows are swipeable.
 * - **Grouping**: Visually indicates Supersets/Giant Sets via colored side-bars.
 * - **Modals**: Manages its own "More Options" menu and "Rest Timer Picker".
 */
function ExerciseRow({
	exercise,
	exerciseDetails,
	isDragging,
	isActive,
	groupDetails,
	preferredWeightUnit,
	isTemplate = false,
	drag,
	onPress,
	onReplaceExercise,
	onCreateSuperSet,
	onCreateGiantSet,
	onRemoveExerciseGroup,
	onDeleteExercise,
	onAddSet,
	onUpdateSet,
	onToggleCompleteSet,
	onDeleteSet,
	onStartSetTimer,
	onStopSetTimer,
	onSaveRestPreset,
}: Props) {
	const isDark = useColorScheme() === 'dark'
	const [notesExpanded, setNotesExpanded] = useState(false)

	const { hasWeight, hasReps, hasDuration } = EXERCISE_CAPABILITIES[exerciseDetails.exerciseType]

	const bottomSheetModalRef = useRef<BottomSheetModal>(null)

	/* ───── Local UI state only ───── */

	const activeRestSetId = useRef<string | null>(null)

	const restPickerRef = useRef<RestTimerPickerModalHandle>(null)

	/* Note: Removed menuVisible and menuRef logic */

	/* ───── Handlers ───── */
	const handleOpenRestPicker = useCallback((setId: string, restSeconds?: number) => {
		activeRestSetId.current = setId
		restPickerRef.current?.present(restSeconds ?? 60)
	}, [])

	/* ───────────────── Render ───────────────── */

	return (
		<View
			className="m-4 flex gap-2"
			style={{
				opacity: isActive ? 0.95 : 1,
				transform: [{ scale: isActive ? 1.02 : 1 }],
			}}
		>
			{/* ───── Header / drag handle ───── */}
			<View className="flex-row items-center justify-between">
				<View className="w-8/12">
					<TouchableOpacity
						onPress={onPress}
						onLongPress={drag}
						delayLongPress={200}
						activeOpacity={0.8}
						className="flex-row items-center gap-4"
					>
						<Image
							source={exerciseDetails.thumbnailUrl}
							style={{
								width: 40,
								height: 40,
								borderRadius: 100,
								borderWidth: 1,
								borderColor: 'gray',
							}}
						/>

						<Text className="text-lg font-bold text-black dark:text-white">{exerciseDetails.title}</Text>
					</TouchableOpacity>
				</View>

				<TouchableOpacity
					onPress={() => {
						bottomSheetModalRef.current?.present()
					}}
				>
					<Entypo name="dots-three-horizontal" size={20} color={isDark ? 'white' : 'black'} />
				</TouchableOpacity>
			</View>
			{groupDetails && (
				<View className="self-start rounded-full" style={{ backgroundColor: getGroupColor(groupDetails.id) }}>
					<Text className="w-full px-3 py-1 text-sm font-semibold text-white">
						{`${groupDetails.groupType.toUpperCase()} ${String.fromCharCode('A'.charCodeAt(0) + groupDetails.groupIndex)}`}
					</Text>
				</View>
			)}

			{/* ───── Sets header ───── */}
			<View className="flex-row items-center bg-white py-1 dark:bg-black">
				{/* ───── SET / PREV ───── */}
				<View className={COL_SET}>
					<Text className="mr-3 text-sm font-medium uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
						SET
					</Text>

					{!isTemplate && (
						<Text className="text-sm font-medium uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
							PREV
						</Text>
					)}
				</View>

				{/* ───── WEIGHT ───── */}
				<View className={COL_STD}>
					{hasWeight ? (
						<Text className="text-sm font-medium uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
							{preferredWeightUnit}
						</Text>
					) : (
						<Text className="text-sm text-neutral-400">—</Text>
					)}
				</View>

				{/* ───── REPS / TIME ───── */}
				<View className={COL_STD}>
					{hasReps && (
						<Text className="text-sm font-medium uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
							REPS
						</Text>
					)}

					{hasDuration && !hasReps && (
						<Text className="text-sm font-medium uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
							TIME
						</Text>
					)}
				</View>

				{/* ───── RPE ───── */}
				<View className={COL_RPE}>
					<Text className="text-sm font-medium uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
						RPE
					</Text>
				</View>
			</View>

			{/* ───── Sets ───── */}
			{exercise.sets.map(set => (
				<SetRow
					key={set.id}
					set={set}
					exerciseId={exercise.exerciseId}
					hasWeight={hasWeight}
					hasReps={hasReps}
					hasDuration={hasDuration}
					preferredWeightUnit={preferredWeightUnit}
					isTemplate={isTemplate}
					notesExpanded={notesExpanded}
					onUpdate={onUpdateSet}
					onToggleComplete={onToggleCompleteSet}
					onDelete={onDeleteSet}
					onStartTimer={onStartSetTimer}
					onStopTimer={onStopSetTimer}
					onOpenRestPicker={handleOpenRestPicker}
				/>
			))}

			{/* ───── Add set ───── */}
			<Button title="Add Set" variant="secondary" onPress={() => onAddSet(exercise.exerciseId)} />

			{/* ───── Menu ───── */}
			<BottomSheetModal
				ref={bottomSheetModalRef}
				index={0}
				enableDynamicSizing={true}
				backdropComponent={props => (
					<BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} opacity={0.4} />
				)}
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
						paddingBottom: useSafeAreaInsets().bottom + 16,
					}}
				>
					<TouchableOpacity
						onPress={() => {
							bottomSheetModalRef.current?.dismiss()
							onReplaceExercise()
						}}
						className="px-4 py-3"
					>
						<Text className="text-base text-black dark:text-white">Replace Exercise</Text>
					</TouchableOpacity>

					{groupDetails ? (
						<>
							<View className="h-px bg-neutral-200 dark:bg-neutral-800" />
							<TouchableOpacity
								onPress={() => {
									bottomSheetModalRef.current?.dismiss()
									onRemoveExerciseGroup()
								}}
								className="px-4 py-3"
							>
								<Text className="text-base text-black dark:text-white">
									Remove from
									{groupDetails?.groupType === 'superSet'
										? ' Super Set'
										: groupDetails?.groupType === 'giantSet'
											? ' Giant Set'
											: ' Group'}
								</Text>
							</TouchableOpacity>
						</>
					) : (
						<>
							<View className="h-px bg-neutral-200 dark:bg-neutral-800" />

							<TouchableOpacity
								onPress={() => {
									bottomSheetModalRef.current?.dismiss()
									onCreateSuperSet()
								}}
								className="px-4 py-3"
							>
								<Text className="text-base text-black dark:text-white">Create Super Set</Text>
							</TouchableOpacity>

							<View className="h-px bg-neutral-200 dark:bg-neutral-800" />

							<TouchableOpacity
								onPress={() => {
									bottomSheetModalRef.current?.dismiss()
									onCreateGiantSet()
								}}
								className="px-4 py-3"
							>
								<Text className="text-base text-black dark:text-white">Create Giant Set</Text>
							</TouchableOpacity>
						</>
					)}
					<View className="h-px bg-neutral-200 dark:bg-neutral-800" />

					<TouchableOpacity
						onPress={() => {
							bottomSheetModalRef.current?.dismiss()
							setNotesExpanded(o => !o)
						}}
						className="px-4 py-3"
					>
						<Text className="text-base text-black dark:text-white">
							{notesExpanded ? 'Hide Notes' : 'Take Notes'}
						</Text>
					</TouchableOpacity>

					<View className="h-px bg-neutral-200 dark:bg-neutral-800" />

					<TouchableOpacity
						onPress={() => {
							bottomSheetModalRef.current?.dismiss()
							onDeleteExercise()
						}}
						className="px-4 py-3"
					>
						<Text className="text-base text-red-600">Delete Exercise</Text>
					</TouchableOpacity>
				</BottomSheetView>
			</BottomSheetModal>

			{/* ───── Rest picker ───── */}
			<RestTimerPickerModal
				ref={restPickerRef}
				onClose={() => {
					activeRestSetId.current = null
				}}
				onConfirm={seconds => {
					if (activeRestSetId.current && onSaveRestPreset) {
						onSaveRestPreset(exercise.exerciseId, activeRestSetId.current, seconds)
					}

					activeRestSetId.current = null
				}}
			/>
		</View>
	)
}

export default memo(ExerciseRow)
