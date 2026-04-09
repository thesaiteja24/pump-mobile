import { Button } from '@/components/ui/Button'
import { Program } from '@/stores/programStore'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import { Link, router } from 'expo-router'
import { Pressable, Text, View } from 'react-native'

export default function ProgramCard({ program }: { program: Program }) {
	const handleStart = () => {
		router.push(`/(app)/program/${program.id}`)
	}

	return (
		<Link
			href={`/(app)/program/${program.id}`}
			onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
			asChild
		>
			<Pressable className="ml-4 w-[80%] gap-2 rounded-2xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
				{/* Header */}
				<View className="flex-col justify-between gap-1">
					<View className="flex-row items-center justify-between gap-4">
						<Text className="line-clamp-1 text-lg font-medium text-black dark:text-white">
							{program.title}
						</Text>
					</View>
					{program.description ? (
						<Text className="line-clamp-2 text-sm font-normal text-neutral-500 dark:text-neutral-400">
							{program.description}
						</Text>
					) : null}
				</View>
				<View className="flex-row items-center justify-between gap-2">
					<View className="flex-row items-center gap-2">
						<View>
							{program.experienceLevel === 'beginner' && (
								<Text className="self-start rounded-full bg-green-200 px-2 py-1 text-right text-xs font-normal text-green-600">
									{program.experienceLevel}
								</Text>
							)}
							{program.experienceLevel === 'intermediate' && (
								<Text className="self-start rounded-full bg-yellow-200 px-2 py-1 text-right text-xs font-normal text-yellow-600">
									{program.experienceLevel}
								</Text>
							)}
							{program.experienceLevel === 'advanced' && (
								<Text className="self-start rounded-full bg-red-200 px-2 py-1 text-right text-xs font-normal text-red-600">
									{program.experienceLevel}
								</Text>
							)}
						</View>
						<View>
							<Text className="self-start rounded-full bg-purple-200 px-2 py-1 text-right text-xs font-normal text-purple-600">
								{program.durationOptions.join(', ')} weeks
							</Text>
						</View>
					</View>

					<Button
						title=""
						onPress={e => {
							e.preventDefault()
							handleStart()
						}}
						rightIcon={<MaterialCommunityIcons name="chevron-right" size={24} color="white" />}
						variant="primary"
						className="rounded-full"
					/>
				</View>
			</Pressable>
		</Link>
	)
}
