import { Button } from '@/components/ui/Button'
import { useUserProgram } from '@/hooks/queries/usePrograms'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { router, useLocalSearchParams, useNavigation } from 'expo-router'
import React, { useEffect, useState } from 'react'
import { ScrollView, Text, TouchableOpacity, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import Toast from 'react-native-toast-message'

import ShimmerProgramDetails from '@/components/program/ShimmerProgramDetails'
import { WorkoutDetailsModal, WorkoutDetailsModalHandle } from '@/components/program/WorkoutDetailsModal'

export default function UserProgramDashboard() {
	const params = useLocalSearchParams()
	const navigation = useNavigation()
	const userProgramId = params.id as string

	// Track which week we are viewing (default to the user's current week)
	const [viewedWeekIndex, setViewedWeekIndex] = useState<number | null>(null)

	const { data: userProgram, isLoading } = useUserProgram(userProgramId, viewedWeekIndex ?? undefined)
	const workoutDetailsModalRef = React.useRef<WorkoutDetailsModalHandle>(null)

	const getStatusColor = () => {
		switch (userProgram?.status) {
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

	// Set initial week index once data arrives
	useEffect(() => {
		if (userProgram && viewedWeekIndex === null) {
			setViewedWeekIndex(userProgram.progress.currentWeek)
		}
	}, [userProgram, viewedWeekIndex])

	useEffect(() => {
		if (userProgram) {
			navigation.setOptions({
				title: userProgram.status === 'active' ? 'Active Program' : 'Program Details',
				rightIcons: [
					{
						name: 'settings-outline',
						onPress: () => Toast.show({ type: 'info', text1: 'Program settings coming soon' }),
						color: '#6366f1',
					},
				],
			})
		}
	}, [navigation, userProgram])

	if (isLoading && !userProgram) {
		return <ShimmerProgramDetails />
	}

	if (!userProgram) {
		return (
			<View className="flex-1 items-center justify-center bg-white dark:bg-black">
				<Text className="text-neutral-500">Program not found.</Text>
				<Button title="Go Back" onPress={() => router.back()} className="mt-4" />
			</View>
		)
	}

	const currentWeekData = userProgram.weeks?.[0] // Backend returns requested week at index 0
	const progressPercent = Math.round(
		((userProgram.progress.currentWeek * 7 + userProgram.progress.currentDay) / (userProgram.durationWeeks * 7)) *
			100
	)

	return (
		<SafeAreaView className="flex-1 bg-white dark:bg-black" edges={['bottom']}>
			<ScrollView contentContainerStyle={{ padding: 16 }}>
				{/* Header Section */}
				<View className="mb-6">
					<Text className="text-3xl font-bold text-black dark:text-white">{userProgram.program.title}</Text>
					<View className="mt-2 flex-row items-center gap-2">
						{/* Status Badge */}
						<View className={`rounded-full px-2 py-1 bg-${statusColor}-100 dark:bg-${statusColor}-900/40`}>
							<Text className={`text-sm capitalize text-${statusColor}-600 dark:text-${statusColor}-400`}>
								{userProgram.status}
							</Text>
						</View>
						<Text className="text-neutral-500">
							Week {userProgram.progress.currentWeek + 1} • Day {userProgram.progress.currentDay + 1}
						</Text>
					</View>
				</View>

				{/* Progress Stats */}
				<View className="mb-8 rounded-2xl bg-neutral-50 p-4 dark:bg-neutral-900">
					<View className="mb-2 flex-row items-center justify-between">
						<Text className="font-semibold text-black dark:text-white">Overall Progress</Text>
						<Text className="font-bold text-indigo-600">{progressPercent}%</Text>
					</View>
					<View className="h-2 w-full overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-800">
						<View className="h-full bg-indigo-600" style={{ width: `${progressPercent}%` }} />
					</View>
				</View>

				{/* Week Selector */}
				<View className="mb-4">
					<Text className="mb-3 text-lg font-bold text-black dark:text-white">Schedule Overview</Text>
					<ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row gap-2">
						{Array.from({ length: userProgram.durationWeeks }).map((_, i) => (
							<TouchableOpacity
								key={i}
								onPress={() => setViewedWeekIndex(i)}
								className={`mr-2 rounded-xl px-4 py-2 ${
									viewedWeekIndex === i ? 'bg-indigo-600' : 'bg-neutral-100 dark:bg-neutral-800'
								}`}
							>
								<Text
									className={`font-semibold ${
										viewedWeekIndex === i ? 'text-white' : 'text-neutral-500'
									}`}
								>
									Week {i + 1}
								</Text>
							</TouchableOpacity>
						))}
					</ScrollView>
				</View>

				{/* Daily Schedule */}
				<View className="gap-3">
					{currentWeekData?.days.map(day => {
						const isToday =
							userProgram.progress.currentWeek === viewedWeekIndex &&
							userProgram.progress.currentDay === day.dayIndex

						return (
							<TouchableOpacity
								key={day.id}
								activeOpacity={0.7}
								onPress={() => workoutDetailsModalRef.current?.present(day as any)}
								className={`flex-row items-center justify-between rounded-2xl border p-4 ${
									isToday
										? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/10'
										: 'border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900'
								}`}
							>
								<View className="flex-1">
									<View className="flex-row items-center gap-2">
										<Text className="text-lg font-semibold text-black dark:text-white">
											{day.name}
										</Text>
										{isToday && (
											<View className="rounded-full bg-indigo-600 px-2 py-0.5">
												<Text className="text-[10px] font-bold text-white">TODAY</Text>
											</View>
										)}
									</View>
									{day.isRestDay ? (
										<Text className="mt-1 text-sm font-medium text-emerald-500">Rest Day</Text>
									) : (
										<Text className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
											{day.templateSnapshot?.title || 'No Workout Assigned'}
										</Text>
									)}
								</View>
								<View className="h-10 w-10 items-center justify-center rounded-full bg-neutral-100 dark:bg-neutral-800">
									<MaterialCommunityIcons
										name={day.isRestDay ? 'coffee-outline' : 'arm-flex-outline'}
										size={20}
										color={isToday ? '#6366f1' : '#9ca3af'}
									/>
								</View>
							</TouchableOpacity>
						)
					})}
				</View>

				<Button
					title="Log Manual Workout"
					variant="secondary"
					className="mb-4 mt-8"
					onPress={() => Toast.show({ type: 'info', text1: 'Manual logging coming soon' })}
				/>
			</ScrollView>

			<WorkoutDetailsModal ref={workoutDetailsModalRef} />
		</SafeAreaView>
	)
}
