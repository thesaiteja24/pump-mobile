import { Button } from '@/components/ui/Button'
import { DeleteConfirmModal, DeleteConfirmModalHandle } from '@/components/modals/DeleteConfirmModal'
import { useDeleteTemplateMutation, useTemplateByIdQuery } from '@/hooks/queries/useTemplates'
import { useTemplate } from '@/stores/templateStore'
import * as Clipboard from 'expo-clipboard'
import { router, useLocalSearchParams, useNavigation } from 'expo-router'
import React, { useCallback, useEffect, useMemo, useRef } from 'react'
import { BackHandler, ScrollView, Text, View, useColorScheme } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Toast from 'react-native-toast-message'

import ShimmerTemplateScreen from '@/components/templates/shimmerTemplateScreen'
import { ReadOnlyExerciseRow } from '@/components/workout/ReadOnlyExerciseRow'

export default function TemplateDetails() {
	const { id } = useLocalSearchParams<{ id: string }>()
	const navigation = useNavigation()
	const isDark = useColorScheme() === 'dark'
	const safeAreaInsets = useSafeAreaInsets()

	// Fetch template directly from TQ cache / server
	const { data: template, isLoading } = useTemplateByIdQuery(id)

	const deleteMutation = useDeleteTemplateMutation()
	const startWorkoutFromTemplate = useTemplate(s => s.startWorkoutFromTemplate)
	const handleEdit = useCallback(() => {
		router.push(`/(app)/template/editor?id=${id}`)
	}, [id])

	const handleShare = useCallback(() => {
		if (!template?.shareId) {
			Toast.show({
				type: 'error',
				text1: 'Error',
				text2: 'Template has no share link',
			})
			return
		}
		Clipboard.setStringAsync(template.shareId).then(() => {
			Toast.show({
				type: 'success',
				text1: 'Link copied',
				text2: 'Share link copied to clipboard',
			})
		})
	}, [template?.shareId])

	const deleteModalRef = useRef<DeleteConfirmModalHandle>(null)

	// Configure Navigation Header
	useEffect(() => {
		const rightIcons = [
			{
				name: 'share-outline',
				onPress: handleShare,
			},
			{
				name: 'create-outline',
				onPress: handleEdit,
			},
		]

		navigation.setOptions({
			title: 'Template Details',
			rightIcons,
		})
	}, [id, navigation, handleEdit, handleShare, template, isDark])

	useEffect(() => {
		const onBackPress = () => {
			if (router.canGoBack()) {
				router.back()
			} else {
				router.push('/(app)/(tabs)/home')
			}
			return true
		}

		const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress)

		return () => subscription.remove()
	}, [])

	const groupMap = useMemo(() => {
		const map = new Map<string, any>()
		template?.exerciseGroups.forEach(g => map.set(g.id, g))
		return map
	}, [template?.exerciseGroups])

	if (isLoading) {
		return <ShimmerTemplateScreen />
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
				className="absolute bottom-0 left-0 right-0 p-6"
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
						liquidGlass
					/>
					<Button
						title="Delete"
						className="w-1/3"
						variant="danger"
						onPress={() => {
							deleteModalRef.current?.present()
						}}
						liquidGlass
					/>
				</View>
			</View>
			<DeleteConfirmModal
				ref={deleteModalRef}
				title="Delete Template?"
				description="Are you sure you want to delete this template?"
				onConfirm={() => {
					deleteMutation.mutate(id, {
						onSuccess: () => router.back(),
					})
				}}
				confirmText="Delete"
				onCancel={() => {}}
			/>
		</View>
	)
}
