import EditableAvatar from '@/components/EditableAvatar'
import { DeleteConfirmModal, DeleteConfirmModalHandle } from '@/components/ui/DeleteConfirmModal'
import { useDeleteMeta, useMetaById, useUpdateMeta } from '@/hooks/queries/useMeta'
import { EquipmentType, MetaResource } from '@/types/meta'
import { prepareImageForUpload } from '@/utils/prepareImageForUpload'
import { useLocalSearchParams, useNavigation } from 'expo-router'
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import {
	ActivityIndicator,
	Keyboard,
	Platform,
	Text,
	TextInput,
	TouchableOpacity,
	useColorScheme,
	View,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Toast from 'react-native-toast-message'

export default function EditMeta() {
	const { resource, id } = useLocalSearchParams<{ resource: MetaResource; id: string }>()
	const navigation = useNavigation()
	const isDarkMode = useColorScheme() === 'dark'
	const insets = useSafeAreaInsets()

	const isEquipment = resource === 'equipment'
	const label = isEquipment ? 'Equipment' : 'Muscle Group'

	const normalize = (v: string | null | undefined) => v ?? ''

	const { data: itemData, isLoading: loadingData } = useMetaById(resource, id)
	const updateMutation = useUpdateMeta(resource)
	const deleteMutation = useDeleteMeta(resource)

	const deleteConfirmModalRef = React.useRef<DeleteConfirmModalHandle>(null)

	// current state
	const [title, setTitle] = useState('')
	const [equipmentType, setEquipmentType] = useState<EquipmentType | null>(null)
	const [thumbnailUri, setThumbnailUri] = useState<string | null>(null)
	const [uploading, setUploading] = useState(false)

	const lineHeight = Platform.OS === 'ios' ? 0 : 30

	// snapshot for dirty check
	const [original, setOriginal] = useState({ title: '', thumbnailUrl: '', type: null as EquipmentType | null })

	useEffect(() => {
		if (itemData) {
			setTitle(itemData.title)
			setEquipmentType(itemData.type ?? null)
			setThumbnailUri(itemData.thumbnailUrl)
			setOriginal({
				title: itemData.title,
				thumbnailUrl: itemData.thumbnailUrl,
				type: itemData.type ?? null,
			})
		}
	}, [itemData])

	const isDirty = useMemo(() => {
		return (
			title !== original.title ||
			normalize(thumbnailUri) !== original.thumbnailUrl ||
			(isEquipment && equipmentType !== original.type)
		)
	}, [title, thumbnailUri, equipmentType, original, isEquipment])

	const onSave = useCallback(async () => {
		if (!id || !isDirty || updateMutation.isPending) return

		Keyboard.dismiss()

		try {
			const formData = new FormData()
			formData.append('title', title.trim())
			if (isEquipment && equipmentType) {
				formData.append('type', equipmentType)
			}

			if (thumbnailUri && normalize(thumbnailUri) !== original.thumbnailUrl) {
				setUploading(true)

				const prepared = await prepareImageForUpload(
					{ uri: thumbnailUri, fileName: `${resource}.jpg`, type: 'image/jpeg' },
					'equipment'
				)

				formData.append('image', prepared as any)
			}

			const data = await updateMutation.mutateAsync({ id, data: formData })

			Toast.show({ type: 'success', text1: `${label} updated` })
			setOriginal({
				title: data.title,
				thumbnailUrl: data.thumbnailUrl,
				type: data.type ?? null,
			})
			setTitle(data.title)
			setEquipmentType(data.type ?? null)
			setThumbnailUri(data.thumbnailUrl)
		} catch (e: any) {
			Toast.show({ type: 'error', text1: e.message || `${label} update failed` })
		} finally {
			setUploading(false)
		}
	}, [id, title, thumbnailUri, isDirty, original, updateMutation, isEquipment, equipmentType, label, resource])

	useEffect(() => {
		;(navigation as any).setOptions({
			title: `Edit ${label}`,
			rightIcons: [
				{
					name: 'checkmark-done',
					onPress: onSave,
					disabled: !isDirty || updateMutation.isPending,
					color: 'green',
				},
				{
					name: 'trash',
					onPress: () => deleteConfirmModalRef.current?.present(),
					color: 'red',
				},
			],
		})
	}, [navigation, isDirty, onSave, updateMutation.isPending, label])

	if (loadingData) {
		return (
			<View className="flex-1 items-center justify-center bg-white dark:bg-black">
				<ActivityIndicator animating size={'large'} />
			</View>
		)
	}

	return (
		<View className="flex-1 bg-white p-4 dark:bg-black" style={{ paddingBottom: insets.bottom }}>
			<View className="mb-6 items-center">
				<EditableAvatar
					uri={thumbnailUri}
					size={132}
					editable={!updateMutation.isPending}
					uploading={uploading}
					onChange={uri => uri && setThumbnailUri(uri)}
					shape="circle"
				/>
			</View>

			<View className="mb-6 flex flex-row items-center gap-8">
				<Text className="w-16 text-lg font-semibold text-black dark:text-white">Title</Text>
				<TextInput
					value={title}
					onChangeText={setTitle}
					editable={!updateMutation.isPending}
					placeholder={`e.g. ${isEquipment ? 'Barbell' : 'Chest'}`}
					className="flex-1 text-lg text-blue-500"
					placeholderTextColor={isDarkMode ? '#a3a3a3' : '#737373'}
					style={{ lineHeight }}
				/>
			</View>

			{isEquipment && (
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
								disabled={updateMutation.isPending}
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
			)}

			<DeleteConfirmModal
				ref={deleteConfirmModalRef}
				title={`Delete ${label}?`}
				description={`This ${label.toLowerCase()} will be permanently removed.`}
				onCancel={() => {}}
				onConfirm={async () => {
					try {
						await deleteMutation.mutateAsync(id)
						Toast.show({ type: 'success', text1: `${label} deleted` })
						navigation.goBack()
					} catch (e: any) {
						Toast.show({ type: 'error', text1: e.message || `Failed to delete ${label.toLowerCase()}` })
					}
				}}
			/>
		</View>
	)
}
