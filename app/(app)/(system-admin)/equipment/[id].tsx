import EditableAvatar from '@/components/EditableAvatar'
import { DeleteConfirmModal, DeleteConfirmModalHandle } from '@/components/ui/DeleteConfirmModal'
import { useDeleteEquipment, useEquipmentById, useUpdateEquipment } from '@/hooks/queries/useEquipment'
import { EquipmentType } from '@/types/equipment'
import { prepareImageForUpload } from '@/utils/prepareImageForUpload'
import { useLocalSearchParams, useNavigation } from 'expo-router'
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { ActivityIndicator, Keyboard, Platform, Text, TextInput, TouchableOpacity, useColorScheme, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Toast from 'react-native-toast-message'

export default function EditEquipment() {
	const { id } = useLocalSearchParams<{ id: string }>()
	const navigation = useNavigation()
	const isDarkMode = useColorScheme() === 'dark'
	const insets = useSafeAreaInsets()

	const normalize = (v: string | null | undefined) => v ?? ''

	const { data: equipmentData, isLoading: loadingData } = useEquipmentById(id)
	const updateEquipmentMutation = useUpdateEquipment()
	const deleteEquipmentMutation = useDeleteEquipment()

	const deleteConfirmModalRef = React.useRef<DeleteConfirmModalHandle>(null)

	// editable state
	const [title, setTitle] = useState('')
	const [equipmentType, setEquipmentType] = useState<EquipmentType | null>(null)
	const [thumbnailUri, setThumbnailUri] = useState<string | null>(null)
	const [uploading, setUploading] = useState(false)

	const lineHeight = Platform.OS === 'ios' ? 0 : 30

	// snapshot for dirty checking
	const [original, setOriginal] = useState({ title: '', thumbnailUrl: '', type: null as EquipmentType | null })

	// Populate from query data
	useEffect(() => {
		if (equipmentData) {
			setTitle(equipmentData.title)
			setEquipmentType(equipmentData.type)
			setThumbnailUri(equipmentData.thumbnailUrl)
			setOriginal({
				title: equipmentData.title,
				thumbnailUrl: equipmentData.thumbnailUrl,
				type: equipmentData.type,
			})
		}
	}, [equipmentData])

	const isDirty = useMemo(() => {
		return (
			title !== original.title ||
			normalize(thumbnailUri) !== original.thumbnailUrl ||
			equipmentType !== original.type
		)
	}, [title, thumbnailUri, equipmentType, original])

	const onSave = useCallback(async () => {
		if (!id || !isDirty || updateEquipmentMutation.isPending) return

		Keyboard.dismiss()

		try {
			const formData = new FormData()
			formData.append('title', title)
			if (equipmentType) {
				formData.append('type', equipmentType)
			}

			if (thumbnailUri && normalize(thumbnailUri) !== original.thumbnailUrl) {
				setUploading(true)

				const prepared = await prepareImageForUpload(
					{ uri: thumbnailUri, fileName: 'equipment.jpg', type: 'image/jpeg' },
					'equipment'
				)

				formData.append('image', prepared as any)
			}

			const data = await updateEquipmentMutation.mutateAsync({ id, data: formData })

			Toast.show({ type: 'success', text1: 'Equipment updated' })
			// cache is automatically invalidated by useUpdateEquipment
			setOriginal({ title: data.title, thumbnailUrl: data.thumbnailUrl, type: data.type })
			setTitle(data.title)
			setEquipmentType(data.type)
			setThumbnailUri(data.thumbnailUrl)
		} catch {
			Toast.show({ type: 'error', text1: 'Equipment update failed' })
		} finally {
			setUploading(false)
		}
	}, [id, title, thumbnailUri, isDirty, original, updateEquipmentMutation])

	useEffect(() => {
		;(navigation as any).setOptions({
			rightIcons: [
				{
					name: 'checkmark-done',
					onPress: onSave,
					disabled: !isDirty || updateEquipmentMutation.isPending,
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
	}, [navigation, isDirty, onSave, updateEquipmentMutation.isPending])

	if (loadingData) {
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
					editable={!updateEquipmentMutation.isPending}
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
					editable={!updateEquipmentMutation.isPending}
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
							disabled={updateEquipmentMutation.isPending}
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

			{/* Delete Modal */}
			<DeleteConfirmModal
				ref={deleteConfirmModalRef}
				title={`Delete Equipment "${original.title}"?`}
				description="This equipment will be permanently removed"
				onCancel={() => {}}
				onConfirm={async () => {
					try {
						await deleteEquipmentMutation.mutateAsync(id)
						Toast.show({ type: 'success', text1: 'Equipment deleted' })
						navigation.goBack()
					} catch {
						Toast.show({ type: 'error', text1: 'Failed to delete equipment' })
					}
				}}
			/>
		</View>
	)
}
