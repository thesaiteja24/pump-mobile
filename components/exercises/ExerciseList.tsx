import { Exercise } from '@/stores/exerciseStore'
import { Image } from 'expo-image'
import React, { useCallback } from 'react'
import { ActivityIndicator, FlatList, Text, TouchableOpacity, View } from 'react-native'

/* ───────────────── Types ───────────────── */

type Props = {
	loading: boolean
	exercises: Exercise[]
	isSelecting?: boolean

	isSelected?: (id: string) => boolean
	onPress: (exercise: Exercise) => void
	onLongPress?: (exercise: Exercise) => void
}

/* ───────────────── Row ───────────────── */

const ExerciseRow = React.memo(
	({
		item,
		isSelecting,
		selected,
		onPress,
		onLongPress,
	}: {
		item: Exercise
		isSelecting?: boolean
		selected: boolean
		onPress: (e: Exercise) => void
		onLongPress?: (e: Exercise) => void
	}) => {
		return (
			<TouchableOpacity
				activeOpacity={1}
				className={`mb-2 h-20 flex-row items-center justify-between px-4 ${
					selected && isSelecting ? 'rounded-l-lg border-l-4 border-l-amber-500' : ''
				}`}
				onPress={() => onPress(item)}
				onLongPress={() => onLongPress?.(item)}
				delayLongPress={700}
			>
				<View className="w-3/4">
					<Text className="text-lg font-semibold text-black dark:text-white">{item.title}</Text>

					<View className="mt-1 flex-row gap-4">
						{item.equipment && <Text className="text-sm text-primary">{item.equipment.title}</Text>}

						{item.primaryMuscleGroup && (
							<Text className="text-sm text-primary">{item.primaryMuscleGroup.title}</Text>
						)}

						<Text className="text-sm text-red-600">PR</Text>
					</View>
				</View>

				<Image
					source={item.thumbnailUrl}
					style={{
						width: 48,
						height: 48,
						borderRadius: 100,
						borderWidth: 1,
						borderColor: 'gray',
						backgroundColor: 'white',
					}}
					contentFit="cover"
				/>
			</TouchableOpacity>
		)
	}
)

ExerciseRow.displayName = 'ExerciseRow'

/* ───────────────── List ───────────────── */

export default function ExerciseList({ loading, exercises, isSelecting, isSelected, onPress, onLongPress }: Props) {
	// Move useCallback before any early returns to comply with rules-of-hooks
	const renderItem = useCallback(
		({ item }: { item: Exercise }) => (
			<ExerciseRow
				item={item}
				isSelecting={isSelecting}
				selected={isSelected?.(item.id) ?? false}
				onPress={onPress}
				onLongPress={onLongPress}
			/>
		),
		[isSelecting, isSelected, onPress, onLongPress]
	)

	if (loading) {
		return <ActivityIndicator animating size="large" className="mt-8" />
	}

	if (!exercises.length) {
		return (
			<View className="my-8 px-4">
				<Text className="text-center text-black dark:text-white">No exercises found.</Text>
			</View>
		)
	}

	return (
		<FlatList
			data={exercises}
			keyExtractor={item => item.id}
			renderItem={renderItem}
			showsVerticalScrollIndicator={false}
		/>
	)
}
