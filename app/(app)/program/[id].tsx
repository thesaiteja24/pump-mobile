import { Button } from '@/components/ui/Button'
import { DeleteConfirmModal, DeleteConfirmModalHandle } from '@/components/ui/DeleteConfirmModal'
import { useProgramById } from '@/hooks/queries/usePrograms'
import { Ionicons } from '@expo/vector-icons'
import { router, useLocalSearchParams, useNavigation } from 'expo-router'
import React, { useEffect, useRef } from 'react'
import { ScrollView, Text, TouchableOpacity, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import Toast from 'react-native-toast-message'

import ShimmerProgramDetails from '@/components/program/ShimmerProgramDetails'
import { WorkoutDetailsModal, WorkoutDetailsModalHandle } from '@/components/program/WorkoutDetailsModal'

export default function ProgramDetails() {
	const params = useLocalSearchParams()
	const navigation = useNavigation()
	const { data: program, isLoading: programByIdLoading } = useProgramById(params.id as string)
	const [isModalOpen, setIsModalOpen] = React.useState(false)
	const deleteModalRef = useRef<DeleteConfirmModalHandle>(null)
	const workoutDetailsModalRef = useRef<WorkoutDetailsModalHandle>(null)

	useEffect(() => {
		if (program) {
			navigation.setOptions({
				title: 'Program Details',
				gestureEnabled: !isModalOpen,
				rightIcons: [
					{
						name: 'create-outline',
						onPress: () =>
							router.push({
								pathname: '/(app)/program',
								params: { mode: 'edit', id: program.id },
							}),
						color: '#3b82f6',
					},
					{
						name: 'trash',
						onPress: () => deleteModalRef.current?.present(),
						color: 'red',
					},
				],
			})
		}
	}, [navigation, program, isModalOpen])

	useEffect(() => {
		const unsubscribe = navigation.addListener('beforeRemove', e => {
			if (isModalOpen) {
				e.preventDefault()
				workoutDetailsModalRef.current?.dismiss()
			}
		})

		return unsubscribe
	}, [navigation, isModalOpen])

	if (programByIdLoading) {
		return <ShimmerProgramDetails />
	}

	if (!program) {
		return (
			<View className="flex-1 items-center justify-center bg-white dark:bg-black">
				<Text className="text-neutral-500">Program not found.</Text>
				<Button title="Go Back" onPress={() => router.back()} className="mt-4" />
			</View>
		)
	}

	// const isActive = activeProgramId === program.id
	const isActive = false

	return (
		<SafeAreaView className="flex-1 bg-white dark:bg-black" edges={['bottom']}>
			<ScrollView contentContainerStyle={{ padding: 16 }}>
				<Text className="mb-2 text-3xl font-bold text-black dark:text-white">{program.title}</Text>
				{program.description ? (
					<Text className="mb-6 text-base text-neutral-600 dark:text-neutral-400">{program.description}</Text>
				) : null}

				<Button
					title={isActive ? 'In Progress' : 'Start This Program'}
					variant={isActive ? 'secondary' : 'primary'}
					onPress={() => {
						// setActiveProgram(isActive ? null : program.id)
						Toast.show({ type: 'success', text1: isActive ? 'Program deactivated' : 'Program activated' })
					}}
					className="mb-8"
				/>

				<Text className="mb-4 text-xl font-bold text-black dark:text-white">Schedule Overview</Text>

				{program?.weeks?.map(week => (
					<View key={week.id} className="mb-6">
						<Text className="mb-3 text-lg font-semibold text-black dark:text-white">{week.name}</Text>
						<View className="gap-2">
							{week.days.map(day => (
								<TouchableOpacity
									key={day.id}
									activeOpacity={0.7}
									onPress={() => workoutDetailsModalRef.current?.present(day)}
									className="flex-row items-center justify-between rounded-xl border border-neutral-200 bg-neutral-100 p-4 dark:border-neutral-800 dark:bg-neutral-900"
								>
									<View>
										<Text className="text-base font-medium text-black dark:text-white">
											{day.name}
										</Text>
										{day.isRestDay ? (
											<Text className="mt-1 text-sm text-emerald-500">Rest Day</Text>
										) : (
											<Text className="mt-1 text-sm text-blue-500">
												{day.template?.title || 'No Template Linked'}
											</Text>
										)}
									</View>
									{!day.isRestDay && <Ionicons name="barbell-outline" size={24} color="#9ca3af" />}
								</TouchableOpacity>
							))}
						</View>
					</View>
				))}
			</ScrollView>

			<DeleteConfirmModal
				ref={deleteModalRef}
				title="Delete Program"
				description="Are you sure you want to delete this program? This action cannot be undone."
				confirmText="Delete"
				onConfirm={async () => {
					// const res = await deleteProgram(program.id)
					// if (res.success) {
					// if (activeProgramId === program.id) {
					// 	setActiveProgram(null)
					// }
					Toast.show({ type: 'success', text1: 'Program deleted' })
					// router.back()
					// } else {
					// 	Toast.show({ type: 'error', text1: 'Failed to delete' })
					// }
				}}
				onCancel={() => {}}
			/>

			<WorkoutDetailsModal ref={workoutDetailsModalRef} onOpenChange={setIsModalOpen} />
		</SafeAreaView>
	)
}
