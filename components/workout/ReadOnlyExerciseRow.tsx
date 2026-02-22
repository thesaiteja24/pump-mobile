import { useExercise } from '@/stores/exerciseStore'
import { TemplateExercise, TemplateSet } from '@/stores/template/types'
import { SetType, WorkoutHistoryExercise, WorkoutHistorySet } from '@/stores/workout/types'
import { Image } from 'expo-image'
import { router } from 'expo-router'
import React, { useMemo } from 'react'
import { Pressable, Text, View } from 'react-native'

/* ───────────────── Group Color Logic ───────────────── */

export const GROUP_COLORS = ['#4C1D95', '#7C2D12', '#14532D', '#7F1D1D', '#1E3A8A', '#581C87', '#0F766E', '#1F2937']

export function hashStringToIndex(str: string, modulo: number) {
	let hash = 0
	for (let i = 0; i < str.length; i++) {
		hash = (hash << 5) - hash + str.charCodeAt(i)
		hash |= 0
	}
	return Math.abs(hash) % modulo
}

export function getGroupColor(groupId: string) {
	return GROUP_COLORS[hashStringToIndex(groupId, GROUP_COLORS.length)]
}

/* ───────────────── Set Type Color Logic ───────────────── */
export function getSetTypeColor(
	set: TemplateSet | WorkoutHistorySet | any, // allowing any for flexibility with slightly different shapes if needed
	type: SetType,
	completed: boolean
): { style: string; value: string | number } {
	switch (type) {
		case 'warmup':
			if (completed) {
				return { style: 'text-white', value: 'W' }
			}
			return { style: 'text-yellow-500', value: 'W' }
		case 'dropSet':
			if (completed) {
				return { style: 'text-white', value: 'D' }
			}
			return { style: 'text-purple-500', value: 'D' }
		case 'failureSet':
			if (completed) {
				return { style: 'text-white', value: 'F' }
			}
			return { style: 'text-red-600', value: 'F' }
		default:
			if (completed) {
				return { style: 'text-white', value: set.setIndex + 1 }
			}
			return { style: 'text-black dark:text-white', value: set.setIndex + 1 }
	}
}

interface ReadOnlyExerciseRowProps {
	exercise: TemplateExercise | WorkoutHistoryExercise | any // simplistic union for now
	group: any | null
}

export function ReadOnlyExerciseRow({ exercise, group }: ReadOnlyExerciseRowProps) {
	const { exerciseList } = useExercise()

	const details = useMemo(() => {
		// If we have direct exercise details (e.g. from WorkoutHistory), use them
		if ('exercise' in exercise && exercise.exercise) {
			return exercise.exercise
		}
		// Otherwise fallback to store lookup
		return exerciseList.find(e => e.id === exercise.exerciseId)
	}, [exerciseList, exercise])

	if (!details) return null

	return (
		<View className="mb-4 rounded-2xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
			<View className="mb-3 flex-row items-center gap-3">
				<Image source={details.thumbnailUrl} style={{ width: 40, height: 40, borderRadius: 6 }} />
				<View>
					<Pressable
						onPress={() => {
							router.push(`/(app)/exercises/${details.id}/(tabs)/summary`)
						}}
					>
						<Text className="text-lg font-semibold text-black dark:text-white">{details.title}</Text>
					</Pressable>
					{/* Some types use 'exerciseType' directly on details */}
					<Text className="text-base capitalize text-neutral-500">{details.exerciseType}</Text>
				</View>
			</View>

			{group && (
				<View className="mb-3 self-start rounded-full" style={{ backgroundColor: getGroupColor(group.id) }}>
					<Text className="px-3 py-1 text-sm font-medium text-white">
						{`${group.groupType.toUpperCase()} ${String.fromCharCode(
							'A'.charCodeAt(0) + group.groupIndex
						)}`}
					</Text>
				</View>
			)}

			<View className="gap-2">
				{exercise.sets.map((set: any, idx: number) => (
					<View
						key={set.id || idx}
						className="flex-row items-center rounded bg-neutral-50 p-2 dark:bg-neutral-800/50"
					>
						{/* Set index */}
						<View className="w-10 items-center">
							<Text
								className={`text-base font-semibold ${getSetTypeColor(set, set.setType, false).style}`}
							>
								{getSetTypeColor(set, set.setType, true).value}
							</Text>
						</View>

						{/* Main value (weight × reps OR duration) */}
						<View className="flex-1 flex-row items-center gap-2">
							{set.weight != null && (
								<Text className="text-base font-medium text-neutral-700 dark:text-neutral-300">
									{set.weight} kg
								</Text>
							)}

							{set.reps != null && (
								<Text className="text-base font-medium text-neutral-700 dark:text-neutral-300">
									× {set.reps}
								</Text>
							)}

							{set.durationSeconds != null && (
								<Text className="text-base font-medium text-neutral-700 dark:text-neutral-300">
									{set.durationSeconds}s
								</Text>
							)}

							{set.weight == null && set.reps == null && set.durationSeconds == null && (
								<Text className="text-base text-neutral-400">—</Text>
							)}
						</View>

						{/* RPE */}
						<View className="w-20 items-center">
							<Text className="text-base text-neutral-400">
								{set.rpe != null ? `RPE ${set.rpe}` : '—'}
							</Text>
						</View>

						{/* Rest */}
						<View className="w-24 items-end">
							<Text className="text-base text-neutral-400">
								{set.restSeconds != null ? `Rest ${set.restSeconds}s` : '—'}
							</Text>
						</View>
					</View>
				))}
			</View>
		</View>
	)
}
