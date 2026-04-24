import EditableAvatar from '@/components/EditableAvatar'
import { useCreateEquipment } from '@/hooks/queries/useEquipment'
import { EquipmentType } from '@/types/equipment'
import { prepareImageForUpload } from '@/utils/prepareImageForUpload'
import { useNavigation } from 'expo-router'
import React, { useCallback, useEffect, useState } from 'react'
import { Keyboard, Platform, Text, TextInput, TouchableOpacity, useColorScheme, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Toast from 'react-native-toast-message'

export default function CreateEquipment() {
	const navigation = useNavigation()
	const isDarkMode = useColorScheme() === 'dark'

	const createEquipmentMutation = useCreateEquipment()

	const [title, setTitle] = useState('')
	const [equipmentType, setEquipmentType] = useState<EquipmentType | null>('other')
	const [thumbnailUri, setThumbnailUri] = useState<string | null>(null)
	const [uploading, setUploading] = useState(false)

	const lineHeight = Platform.OS === 'ios' ? 0 : 30

	const onSave = useCallback(async () => {
		if (!title.trim() || createEquipmentMutation.isPending) {
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
			if (equipmentType) {
				formData.append('type', equipmentType)
			}

			if (thumbnailUri) {
				setUploading(true)

				const prepared = await prepareImageForUpload(
					{
						uri: thumbnailUri,
						fileName: 'equipment.jpg',
						type: 'image/jpeg',
					},
					'equipment'
				)

				formData.append('image', prepared as any)
			}

			await createEquipmentMutation.mutateAsync(formData)

			Toast.show({
				type: 'success',
				text1: 'Equipment created successfully',
			})
			navigation.goBack()
		} catch (e: any) {
			Toast.show({
				type: 'error',
				text1: e.message || 'Failed to create equipment',
			})
		} finally {
			setUploading(false)
		}
	}, [title, equipmentType, thumbnailUri, createEquipmentMutation, navigation])

	useEffect(() => {
		;(navigation as any).setOptions({
			title: 'Add Equipment',
			rightIcons: [
				{
					name: 'checkmark-done',
					onPress: onSave,
					disabled: createEquipmentMutation.isPending || !title.trim(),
					color: 'green',
				},
			],
		})
	}, [navigation, onSave, createEquipmentMutation.isPending, title])

	return (
		<View className="flex-1 bg-white p-4 dark:bg-black" style={{ paddingBottom: useSafeAreaInsets().bottom }}>
			{/* Image picker */}
			<View className="mb-6 items-center">
				<EditableAvatar
					uri={thumbnailUri}
					size={132}
					editable={!createEquipmentMutation.isPending}
					uploading={uploading}
					onChange={uri => uri && setThumbnailUri(uri)}
					shape="circle"
				/>
			</View>

			{/* Title input */}
			<View className="mb-6 flex flex-row items-center gap-8">
				<Text className="w-16 text-lg font-semibold text-black dark:text-white">Title</Text>

				<TextInput
					value={title}
					onChangeText={setTitle}
					editable={!createEquipmentMutation.isPending}
					placeholder="e.g. Barbell"
					className="flex-1 text-lg text-blue-500"
					placeholderTextColor={isDarkMode ? '#a3a3a3' : '#737373'}
					style={{ lineHeight }}
				/>
			</View>

			{/* Type selection */}
			<View className="flex flex-row items-center gap-8">
				<Text className="w-16 text-lg font-semibold text-black dark:text-white">Type</Text>

				<View className="flex-1 flex-row flex-wrap gap-2">
					{(
						[
							'bodyweight',
							'dumbbells',
							'barbells',
							'kettlebells',
							'resistanceBands',
							'machines',
							'other',
						] as EquipmentType[]
					).map(t => (
						<TouchableOpacity
							key={t}
							onPress={() => setEquipmentType(t)}
							disabled={createEquipmentMutation.isPending}
							className={`rounded-full px-4 py-2 ${
								equipmentType === t ? 'bg-blue-500' : 'bg-neutral-100 dark:bg-neutral-800'
							}`}
						>
							<Text
								className={`text-sm font-medium ${
									equipmentType === t ? 'text-white' : 'text-neutral-600 dark:text-neutral-400'
								}`}
							>
								{t.charAt(0).toUpperCase() + t.slice(1)}
							</Text>
						</TouchableOpacity>
					))}
				</View>
			</View>
		</View>
	)
}
