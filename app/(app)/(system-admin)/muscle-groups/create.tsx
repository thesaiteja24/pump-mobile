import EditableAvatar from '@/components/EditableAvatar'
import { useMuscleGroup } from '@/stores/muscleGroupStore'
import { prepareImageForUpload } from '@/utils/prepareImageForUpload'
import { useNavigation } from 'expo-router'
import React, { useCallback, useEffect, useState } from 'react'
import { Keyboard, Platform, Text, TextInput, useColorScheme, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Toast from 'react-native-toast-message'

export default function CreateMuscleGroup() {
	const navigation = useNavigation()
	const isDarkMode = useColorScheme() === 'dark'

	const createMuscleGroup = useMuscleGroup(s => s.createMuscleGroup)
	const refreshMuscleGroups = useMuscleGroup(s => s.getAllMuscleGroups)
	const muscleGroupLoading = useMuscleGroup(s => s.muscleGroupLoading)

	const [title, setTitle] = useState('')
	const [thumbnailUri, setThumbnailUri] = useState<string | null>(null)
	const [uploading, setUploading] = useState(false)

	const lineHeight = Platform.OS === 'ios' ? 0 : 30

	const onSave = useCallback(async () => {
		if (!title.trim() || muscleGroupLoading) {
			Toast.show({
				type: 'info',
				text1: 'Title is required',
			})
			return
		}

		Keyboard.dismiss()

		try {
			const formData = new FormData()
			formData.append('title', title.trim())

			if (thumbnailUri) {
				setUploading(true)

				const prepared = await prepareImageForUpload(
					{
						uri: thumbnailUri,
						fileName: 'muscle-group.jpg',
						type: 'image/jpeg',
					},
					'equipment'
				)

				formData.append('image', prepared as any)
			}

			const res = await createMuscleGroup(formData)

			if (res?.success) {
				Toast.show({
					type: 'success',
					text1: 'Muscle group created successfully',
				})

				await refreshMuscleGroups()
				navigation.goBack()
			} else {
				throw new Error()
			}
		} catch {
			Toast.show({
				type: 'error',
				text1: 'Failed to create Muscle Group',
			})
		} finally {
			setUploading(false)
		}
	}, [title, thumbnailUri, muscleGroupLoading, createMuscleGroup, refreshMuscleGroups, navigation])

	useEffect(() => {
		;(navigation as any).setOptions({
			title: 'Add Muscle Group',
			rightIcons: [
				{
					name: 'checkmark-done',
					onPress: onSave,
					disabled: muscleGroupLoading || !title.trim(),
					color: 'green',
				},
			],
		})
	}, [navigation, onSave, muscleGroupLoading, title])

	return (
		<View className="flex-1 bg-white p-4 dark:bg-black" style={{ paddingBottom: useSafeAreaInsets().bottom }}>
			{/* Image picker */}
			<View className="mb-6 items-center">
				<EditableAvatar
					uri={thumbnailUri}
					size={132}
					editable={!muscleGroupLoading}
					uploading={uploading}
					onChange={uri => uri && setThumbnailUri(uri)}
					shape="circle"
				/>
			</View>

			{/* Title input */}
			<View className="flex flex-row items-center gap-8">
				<Text className="text-lg font-semibold text-black dark:text-white">Title</Text>

				<TextInput
					value={title}
					onChangeText={setTitle}
					editable={!muscleGroupLoading}
					placeholder="e.g. Chest"
					className="text-lg text-blue-500"
					placeholderTextColor={isDarkMode ? '#a3a3a3' : '#737373'}
					style={{ lineHeight }}
				/>
			</View>
		</View>
	)
}
