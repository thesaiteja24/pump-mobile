import { Button } from '@/components/ui/Button'
import { WorkoutTemplate } from '@/stores/template/types'
import { useTemplate } from '@/stores/templateStore'
import * as Haptics from 'expo-haptics'
import { Image } from 'expo-image'
import { Link, router } from 'expo-router'
import { Pressable, Text, View } from 'react-native'

export default function TemplateCard({ template }: { template: WorkoutTemplate }) {
	const { startWorkoutFromTemplate } = useTemplate()

	const previewExercises = template.exercises.slice(0, 3)
	const remaining = template.exercises.length - previewExercises.length

	const handleStart = () => {
		startWorkoutFromTemplate(template.id)
		router.push('/(app)/workout/start')
	}

	return (
		<Link
			href={`/(app)/template/${template.id}`}
			onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
			asChild
		>
			<Pressable className="ml-4 w-[80%] rounded-2xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
				{/* Header */}
				<View className="mb-3 flex-col justify-between gap-1">
					<View className="flex-row items-center justify-between gap-4">
						<Text className="line-clamp-1 text-lg font-medium text-black dark:text-white">
							{template.title}
						</Text>
						<Text className="self-end rounded-full bg-blue-200 px-2 py-1 text-right text-xs font-normal text-blue-600">
							{template.syncStatus}
						</Text>
					</View>
					<Text className="text-sm font-normal text-neutral-500 dark:text-neutral-400">
						created by {template.authorName}
					</Text>
				</View>

				{/* Exercise preview */}
				<View className="mb-4 flex-1">
					{previewExercises.map(ex => (
						<View key={ex.id} className="mb-2 flex-row items-center gap-2">
							<Image
								source={ex.thumbnailUrl}
								style={{ width: 32, height: 32, borderRadius: 999 }}
								contentFit="cover"
							/>
							<Text
								numberOfLines={1}
								className="flex-1 text-sm font-medium text-neutral-700 dark:text-neutral-300"
							>
								{ex.sets.length} sets of {ex.title || 'Exercise'}
							</Text>
						</View>
					))}
					{remaining > 0 && <Text className="text-xs text-neutral-500">+{remaining} more exercises</Text>}
				</View>

				<Button
					title="Use Template"
					onPress={e => {
						e.preventDefault()
						handleStart()
					}}
					variant="primary"
					className="mt-auto"
				/>
			</Pressable>
		</Link>
	)
}
