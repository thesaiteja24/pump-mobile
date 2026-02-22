import { Button } from '@/components/ui/Button'
import { useTemplate } from '@/stores/templateStore'
import { usePreventRemove } from '@react-navigation/native'
import { router, useLocalSearchParams, useNavigation } from 'expo-router'
import React, { useEffect, useMemo } from 'react'
import { Alert, ScrollView, Text, TouchableOpacity, View, useColorScheme } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { ReadOnlyExerciseRow } from '@/components/workout/ReadOnlyExerciseRow'

export default function TemplateDetails() {
	const { shareId } = useLocalSearchParams<{ shareId: string }>()

	const navigation = useNavigation()
	const isDark = useColorScheme() === 'dark'
	const safeAreaInsets = useSafeAreaInsets()
	const [loading, setLoading] = React.useState(false)

	// Stores
	const sharedTemplate = useTemplate(s => s.sharedTemplate)
	const localTemplates = useTemplate(s => s.templates)
	const getTemplateByShareId = useTemplate(s => s.getTemplateByShareId)
	const saveSharedTemplate = useTemplate(s => s.saveSharedTemplate)
	const setSharedTemplate = useTemplate(s => s.setSharedTemplate)

	usePreventRemove(true, e => {
		router.replace('/(app)/(tabs)/workout')
	})

	useEffect(() => {
		getTemplateByShareId(shareId)
	}, [shareId])

	useEffect(() => {
		navigation.setOptions({
			title: sharedTemplate?.title ?? 'Template Details',
			headerLeft: () => (
				<TouchableOpacity
					onPress={() => {
						setSharedTemplate(null)
						router.replace('/(app)/(tabs)/workout')
					}}
					style={{ marginRight: 15 }}
				>
					<Text style={{ color: isDark ? '#fff' : '#000', fontSize: 17 }}>Back</Text>
				</TouchableOpacity>
			),
		})
	}, [navigation, sharedTemplate, isDark])

	const groupMap = useMemo(() => {
		const map = new Map<string, any>()
		sharedTemplate?.exerciseGroups.forEach(g => map.set(g.id, g))
		return map
	}, [sharedTemplate?.exerciseGroups])

	// Check if we already have this template
	const existingTemplate = useMemo(() => {
		if (!sharedTemplate?.shareId) return null
		return localTemplates.find(t => t.sourceShareId === sharedTemplate.shareId)
	}, [localTemplates, sharedTemplate])

	const handleSave = async () => {
		if (!sharedTemplate) return
		setLoading(true)

		try {
			if (existingTemplate) {
				Alert.alert(
					'Overwrite Template?',
					'You already have a copy of this template. Do you want to overwrite your local version with this one?',
					[
						{
							text: 'Cancel',
							style: 'cancel',
							onPress: () => setLoading(false),
						},
						{
							text: 'Overwrite',
							style: 'destructive',
							onPress: async () => {
								const res = await saveSharedTemplate(sharedTemplate, {
									overwriteId: existingTemplate.id,
								})
								setLoading(false)
								if (res.success) {
									Alert.alert('Success', 'Template updated!', [
										{
											text: 'View Template',
											onPress: () => {
												setSharedTemplate(null)
												router.replace(`/(app)/template/${res.id}`)
											},
										},
									])
								}
							},
						},
						// Option to save as new copy? Maybe not needed for now based on plan.
						{
							text: 'Save as New',
							onPress: async () => {
								const res = await saveSharedTemplate(sharedTemplate) // No overwriteId = new
								setLoading(false)
								if (res.success) {
									Alert.alert('Success', 'Template saved as new copy!', [
										{
											text: 'View Template',
											onPress: () => {
												setSharedTemplate(null)
												router.replace(`/(app)/template/${res.id}`)
											},
										},
									])
								}
							},
						},
					]
				)
			} else {
				const res = await saveSharedTemplate(sharedTemplate)
				setLoading(false)
				if (res.success) {
					Alert.alert('Success', 'Template saved to your library!', [
						{
							text: 'View Template',
							onPress: () => {
								setSharedTemplate(null)
								router.replace(`/(app)/template/${res.id}`)
							},
						},
					])
				}
			}
		} catch (e) {
			console.error(e)
			setLoading(false)
			Alert.alert('Error', 'Failed to save template.')
		}
	}

	if (!sharedTemplate) {
		return (
			<View className="flex-1 items-center justify-center bg-white dark:bg-black">
				{loading || !shareId ? (
					<View>
						<Text className="text-neutral-500">Loading...</Text>
					</View>
				) : (
					<Text className="text-neutral-500">Template not found.</Text>
				)}
			</View>
		)
	}

	return (
		<View className="relative flex-1 bg-white dark:bg-black">
			<ScrollView contentContainerStyle={{ paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
				{/* Header Info */}
				<View className="border-b border-neutral-100 p-4 dark:border-neutral-900">
					<Text className="mb-2 text-3xl font-bold text-black dark:text-white">{sharedTemplate.title}</Text>
					{/* Author Info */}
					<Text className="mb-2 text-sm font-medium text-blue-600 dark:text-blue-400">
						{sharedTemplate.authorName ? `Created by ${sharedTemplate.authorName}` : 'Shared Template'}
					</Text>

					{sharedTemplate.notes && (
						<Text className="mb-4 text-base text-neutral-600 dark:text-neutral-400">
							{sharedTemplate.notes}
						</Text>
					)}

					<View className="flex-row gap-4">
						<View className="rounded-full bg-neutral-100 px-3 py-1 dark:bg-neutral-800">
							<Text className="text-base font-medium text-neutral-500">
								{sharedTemplate.exerciseGroups.length} Exercises
							</Text>
						</View>
					</View>
				</View>

				{/* Read Only Exercise List */}
				<View className="gap-4 p-4">
					{sharedTemplate.exercises.map((ex, idx) => (
						<ReadOnlyExerciseRow
							key={ex.id || idx}
							exercise={ex}
							group={ex.exerciseGroupId ? groupMap.get(ex.exerciseGroupId) : null}
						/>
					))}
				</View>
			</ScrollView>

			{/* Floating Action Button for Starting */}
			<View
				className="absolute bottom-0 left-0 right-0 border-t border-neutral-100 bg-white p-4 dark:border-neutral-900 dark:bg-black"
				style={{ paddingBottom: safeAreaInsets.bottom + 16 }}
			>
				<Button
					title={existingTemplate ? 'Update Saved Template' : 'Save to My Templates'}
					onPress={handleSave}
					disabled={loading}
				/>
			</View>
		</View>
	)
}
