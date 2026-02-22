import { Button } from '@/components/ui/Button'
import { DeleteConfirmModal, DeleteConfirmModalHandle } from '@/components/ui/DeleteConfirmModal'
import { useTemplate } from '@/stores/templateStore'
import { router, useLocalSearchParams, useNavigation } from 'expo-router'
import React, { useEffect, useMemo, useRef } from 'react'
import { Alert, ScrollView, Share, Text, View, useColorScheme } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { ReadOnlyExerciseRow } from '@/components/workout/ReadOnlyExerciseRow'

export default function TemplateDetails() {
	const { id } = useLocalSearchParams<{ id: string }>()
	const navigation = useNavigation()
	const isDark = useColorScheme() === 'dark'
	const safeAreaInsets = useSafeAreaInsets()

	const template = useTemplate(s => s.templates.find(t => t.id === id || t.clientId === id))
	const deleteTemplate = useTemplate(s => s.deleteTemplate)
	const startWorkoutFromTemplate = useTemplate(s => s.startWorkoutFromTemplate)

	const deleteModalRef = useRef<DeleteConfirmModalHandle>(null)

	useEffect(() => {
		const rightIcons = [{ name: 'create-outline', onPress: handleEdit }]

		if (template?.shareId) {
			rightIcons.push({
				name: 'share-outline',
				onPress: handleShare,
			})
		}

		navigation.setOptions({
			title: 'Template Details',
			rightIcons,
		})
	}, [navigation, template, isDark])

	const groupMap = useMemo(() => {
		const map = new Map<string, any>()
		template?.exerciseGroups.forEach(g => map.set(g.id, g))
		return map
	}, [template?.exerciseGroups])

	const handleEdit = () => {
		router.push({
			pathname: '/(app)/template/editor',
			params: { mode: 'edit', id: id },
		})
	}

	const handleShare = async () => {
		if (!template?.shareId) return

		const webLink = `https://pump.thesaiteja.dev/share/${template.shareId}`

		try {
			await Share.share({
				message: `Check out this workout template: ${webLink}`,
				url: webLink,
				title: template.title,
			})
		} catch (error) {
			console.error('Error sharing template:', error)
			Alert.alert('Error', 'Failed to share the template.')
		}
	}

	if (!template) {
		return (
			<View className="flex-1 items-center justify-center bg-white dark:bg-black">
				<Text className="text-neutral-500">Template not found.</Text>
			</View>
		)
	}

	return (
		<View className="relative flex-1 bg-white dark:bg-black">
			<ScrollView contentContainerStyle={{ paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
				{/* Header Info */}
				<View className="border-b border-neutral-100 p-4 dark:border-neutral-900">
					<Text className="mb-2 text-3xl font-bold text-black dark:text-white">{template.title}</Text>
					{template.notes && (
						<Text className="mb-4 text-base text-neutral-600 dark:text-neutral-400">{template.notes}</Text>
					)}

					<View className="flex-row gap-4">
						<View className="rounded-full bg-neutral-100 px-3 py-1 dark:bg-neutral-800">
							<Text className="text-base font-medium text-neutral-500">
								{template.exercises.length} Exercises
							</Text>
						</View>
						<View className="rounded-full bg-neutral-100 px-3 py-1 dark:bg-neutral-800">
							<Text className="text-base font-medium text-neutral-500">Last used: Never</Text>
						</View>
					</View>
				</View>

				{/* Read Only Exercise List */}
				<View className="gap-4 p-4">
					{template.exercises.map((ex, idx) => (
						<ReadOnlyExerciseRow
							key={ex.id || idx}
							exercise={ex}
							group={ex.exerciseGroupId ? groupMap.get(ex.exerciseGroupId) : null}
						/>
					))}
				</View>
			</ScrollView>

			{/* Floating Action Button */}
			<View
				className="absolute bottom-0 left-0 right-0 border-t border-neutral-100 bg-white p-4 dark:border-neutral-900 dark:bg-black"
				style={{ paddingBottom: safeAreaInsets.bottom + 16 }}
			>
				<View className="flex-row items-center justify-center gap-4">
					<Button
						variant="success"
						title="Start Workout"
						className="w-2/3"
						onPress={() => {
							if (id) startWorkoutFromTemplate(id)
							router.push('/(app)/workout/start')
						}}
					/>
					<Button
						title="Delete"
						className="w-1/3"
						variant="danger"
						onPress={() => {
							deleteModalRef.current?.present()
						}}
					/>
				</View>
			</View>
			<DeleteConfirmModal
				ref={deleteModalRef}
				title="Delete Template?"
				description="Are you sure you want to delete this template?"
				onConfirm={() => {
					deleteTemplate(id)
					router.back()
				}}
				confirmText="Delete"
				onCancel={() => {}}
			/>
		</View>
	)
}
