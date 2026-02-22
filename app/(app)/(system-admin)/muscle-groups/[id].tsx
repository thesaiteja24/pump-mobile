import EditableAvatar from '@/components/EditableAvatar'
import { DeleteConfirmModal, DeleteConfirmModalHandle } from '@/components/ui/DeleteConfirmModal'
import { useMuscleGroup } from '@/stores/muscleGroupStore'
import { prepareImageForUpload } from '@/utils/prepareImageForUpload'
import { useLocalSearchParams, useNavigation } from 'expo-router'
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { ActivityIndicator, Keyboard, Platform, Text, TextInput, useColorScheme, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Toast from 'react-native-toast-message'

export default function EditMuscleGroup() {
	const { id } = useLocalSearchParams<{ id: string }>()
	const navigation = useNavigation()
	const isDarkMode = useColorScheme() === 'dark'
	const insets = useSafeAreaInsets()

	const normalize = (v: string | null | undefined) => v ?? ''

	const {
		getMuscleGroupById,
		getAllMuscleGroups: refreshMuscleGroups,
		updateMuscleGroup,
		muscleGroupLoading,
		deleteMuscleGroup,
	} = useMuscleGroup()

	const deleteConfirmModalRef = React.useRef<DeleteConfirmModalHandle>(null)

	// current editable state
	const [title, setTitle] = useState('')
	const [thumbnailUri, setThumbnailUri] = useState<string | null>(null)

	const [uploading, setUploading] = useState(false)
	const lineHeight = Platform.OS === 'ios' ? 0 : 30

	// snapshot for dirty check
	const [original, setOriginal] = useState({
		title: '',
		thumbnailUrl: '',
	})

	// load muscle group
	useEffect(() => {
		if (!id) return

		getMuscleGroupById(id).then(res => {
			const data = res.data

			setTitle(data.title)
			setThumbnailUri(data.thumbnailUrl)

			// ✅ initialize snapshot
			setOriginal({
				title: data.title,
				thumbnailUrl: data.thumbnailUrl,
			})
		})
	}, [id])

	// dirty checking (same pattern as EditProfile)
	const isDirty = useMemo(() => {
		return title !== original.title || normalize(thumbnailUri) !== original.thumbnailUrl
	}, [title, thumbnailUri, original])

	// save handler
	const onSave = useCallback(async () => {
		if (!isDirty || muscleGroupLoading) return

		Keyboard.dismiss()

		try {
			const formData = new FormData()
			formData.append('title', title)

			if (thumbnailUri && normalize(thumbnailUri) !== original.thumbnailUrl) {
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

			const response = await updateMuscleGroup(id, formData)

			console.warn('Update muscle group response:', response)

			if (response?.success) {
				Toast.show({
					type: 'success',
					text1: 'Muscle group updated',
				})

				await refreshMuscleGroups()

				// ✅ reset snapshot AFTER save
				setOriginal({
					title: response.data.title,
					thumbnailUrl: response.data.thumbnailUrl,
				})

				// keep editable state in sync
				setTitle(response.data.title)
				setThumbnailUri(response.data.thumbnailUrl)
			} else {
				throw new Error()
			}
		} catch {
			Toast.show({
				type: 'error',
				text1: 'Muscle group update failed',
			})
		} finally {
			setUploading(false)
		}
	}, [id, title, thumbnailUri, isDirty, muscleGroupLoading, original, updateMuscleGroup, refreshMuscleGroups])

	// header save button
	useEffect(() => {
		;(navigation as any).setOptions({
			rightIcons: [
				{
					name: 'checkmark-done',
					onPress: onSave,
					disabled: !isDirty || muscleGroupLoading,
					color: 'green',
				},
				{
					name: 'trash',
					onPress: async () => {
						deleteConfirmModalRef.current?.present()
					},
					color: 'red',
				},
			],
		})
	}, [navigation, isDirty, onSave, muscleGroupLoading])

	if (muscleGroupLoading) {
		return (
			<View className="flex-1 items-center justify-center bg-white dark:bg-black">
				<ActivityIndicator animating size={'large'} />
			</View>
		)
	}

	return (
		<View className="flex-1 bg-white p-4 dark:bg-black" style={{ paddingBottom: insets.bottom }}>
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
					placeholder="e.g. Abdominals"
					className="text-lg text-blue-500"
					placeholderTextColor={isDarkMode ? '#a3a3a3' : '#737373'}
					style={{ lineHeight }}
				/>
			</View>

			{/* Delete Modal */}
			<DeleteConfirmModal
				ref={deleteConfirmModalRef}
				title={`Delete "${original.title}"?`}
				description="This muscle group will be permanently removed."
				onCancel={() => {}}
				onConfirm={async () => {
					const res = await deleteMuscleGroup(id)

					if (res?.success) {
						Toast.show({
							type: 'success',
							text1: 'Muscle group deleted',
						})

						await refreshMuscleGroups()
						navigation.goBack()
					} else {
						Toast.show({
							type: 'error',
							text1: 'Failed to delete muscle group',
						})
					}
				}}
			/>
		</View>
	)
}
