import { Button } from '@/components/ui/Button'
import { UserProgram } from '@/types/program'

import { MaterialCommunityIcons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import { Link, router } from 'expo-router'
import React from 'react'
import { Pressable, Text, View } from 'react-native'

export default function UserProgramCard({ program }: { program: UserProgram }) {
	const totalDays = program.durationWeeks * 7
	const completedDays = program.progress.currentWeek * 7 + program.progress.currentDay
	const progressPercent = Math.round(Math.min(100, Math.max(0, (completedDays / totalDays) * 100)))

	const isActive = program.status === 'active'

	const handleStart = () => {
		router.push(`/(app)/user-program/${program.id}`)
	}

	const getStatusColor = () => {
		switch (program.status) {
			case 'active':
				return 'blue'
			case 'completed':
				return 'green'
			case 'paused':
				return 'yellow'
			case 'cancelled':
				return 'red'
			default:
				return 'neutral'
		}
	}

	const statusColor = getStatusColor()

	return (
		<Link
			href={`/(app)/user-program/${program.id}`}
			onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
			asChild
		>
			<Pressable
				className={`${isActive ? 'h-44' : ''} w-full gap-2 rounded-2xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900`}
			>
				{/* Top Section: Title and Progress */}
				<View className="flex-row items-end justify-between">
					<View className="flex-1 gap-1">
						<View className="flex-row items-center gap-2">
							<Text className="line-clamp-1 text-lg font-bold text-black dark:text-white">
								{program.program.title}
							</Text>
						</View>
						<Text className="text-sm font-medium text-neutral-500 dark:text-neutral-400">
							Week {program.progress.currentWeek + 1} of {program.durationWeeks} • Day{' '}
							{program.progress.currentDay + 1}
						</Text>
					</View>
					<View className={`rounded-full bg-${statusColor}-100 px-3 py-1 dark:bg-${statusColor}-900/30`}>
						<Text className={`text-xs font-bold text-${statusColor}-600 dark:text-${statusColor}-400`}>
							{progressPercent}%
						</Text>
					</View>
				</View>

				{/* Progress Bar */}
				<View className="h-2 w-full overflow-hidden rounded-full bg-neutral-100 dark:bg-neutral-800">
					<View className={`h-full bg-${statusColor}-600`} style={{ width: `${progressPercent}%` }} />
				</View>

				{/* Footer: Next Workout and Action Button (Only for Active) */}
				{isActive && (
					<View className="mt-1 flex-row items-center justify-between border-t border-neutral-100 pt-3 dark:border-neutral-800">
						<View className="flex-1">
							<Text className="text-xs font-semibold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
								Next Up
							</Text>
							<Text
								className={`mt-1 text-base font-semibold ${
									program.progress.isRestDay
										? 'font-bold text-emerald-500'
										: 'text-black dark:text-white'
								}`}
							>
								{program.progress.isRestDay
									? 'Rest Day'
									: program.progress.workoutTitle || 'Next Workout'}
							</Text>
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
				)}
			</Pressable>
		</Link>
	)
}
