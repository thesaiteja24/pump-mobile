import MetaModal, { MetaModalHandle } from '@/components/modals/MetaModal'
import { DeleteConfirmModal, DeleteConfirmModalHandle } from '@/components/modals/DeleteConfirmModal'

import { useEquipment, useMuscleGroups } from '@/hooks/queries/useMeta'
import { useDeleteExercise, useExercises, useUpdateExercise } from '@/hooks/queries/useExercises'
import { ExerciseType } from '@/types/exercises'
import { MetaItem } from '@/types/meta'
import { Ionicons } from '@expo/vector-icons'
import * as ImagePicker from 'expo-image-picker'
import { router, useLocalSearchParams, useNavigation } from 'expo-router'
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Keyboard, Platform, ScrollView, Text, TextInput, TouchableOpacity, useColorScheme, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Toast from 'react-native-toast-message'

export default function EditExercise() {
	const navigation = useNavigation()
	const { id } = useLocalSearchParams<{ id: string }>()
	const isDarkMode = useColorScheme() === 'dark'
	const insets = useSafeAreaInsets()
	const placeholderColor = isDarkMode ? '#a3a3a3' : '#737373'

	const { data: exerciseList = [] } = useExercises()
	const updateExerciseMutation = useUpdateExercise()
	const deleteExerciseMutation = useDeleteExercise()

	const { data: equipmentList = [] } = useEquipment()
	const { data: muscleGroupList = [] } = useMuscleGroups()

	const original = useMemo(() => exerciseList.find(e => e.id === id), [exerciseList, id])

	const [title, setTitle] = useState(original?.title || '')
	const [instructions, setInstructions] = useState(original?.instructions || '')
	const [videoUri, setVideoUri] = useState<string | null>(null)
	const [uploading, setUploading] = useState(false)

	const [equipmentId, setEquipmentId] = useState(original?.equipmentId || '')
	const [primaryMuscleGroupId, setPrimaryMuscleGroupId] = useState(original?.primaryMuscleGroupId || '')
	const [exerciseType, setExerciseType] = useState<ExerciseType>(original?.exerciseType || 'repsOnly')

	const equipmentModalRef = useRef<MetaModalHandle>(null)
	const primaryMuscleModalRef = useRef<MetaModalHandle>(null)
	const deleteModalRef = useRef<DeleteConfirmModalHandle>(null)

	const lineHeight = Platform.OS === 'ios' ? 0 : 30

	const isDirty = useMemo(() => {
		if (!original) return false

		return (
			title !== original.title ||
			instructions !== original.instructions ||
			equipmentId !== original.equipmentId ||
			primaryMuscleGroupId !== original.primaryMuscleGroupId ||
			exerciseType !== original.exerciseType ||
			videoUri !== null // Only dirty if a new video is selected
		)
	}, [original, title, instructions, equipmentId, primaryMuscleGroupId, exerciseType, videoUri])

	useEffect(() => {
		if (original) {
			setTitle(original.title)
			setInstructions(original.instructions || '')
			setEquipmentId(original.equipmentId)
			setPrimaryMuscleGroupId(original.primaryMuscleGroupId)
			setExerciseType(original.exerciseType)
		}
	}, [original])

	const onSave = useCallback(async () => {
		if (!title.trim() || !equipmentId || !primaryMuscleGroupId || updateExerciseMutation.isPending || !original) {
			Toast.show({
				type: 'info',
				text1: 'Title, Equipment, and Primary Muscle Group are required',
			})
			return
		}

		Keyboard.dismiss()

		try {
			const formData = new FormData()
			formData.append('title', title.trim())
			formData.append('instructions', instructions.trim())
			formData.append('exerciseType', exerciseType)
			formData.append('equipmentId', equipmentId)
			formData.append('primaryMuscleGroupId', primaryMuscleGroupId)

			if (videoUri) {
				setUploading(true)
				formData.append('video', {
					uri: videoUri,
					name: 'exercise.mp4',
					type: 'video/mp4',
				} as any)
			}

			await updateExerciseMutation.mutateAsync({ id, data: formData })

			Toast.show({
				type: 'success',
				text1: 'Exercise updated successfully',
			})
			// Query is automatically invalidated by useUpdateExercise
			navigation.goBack()
		} catch (e: any) {
			Toast.show({
				type: 'error',
				text1: 'Failed to update exercise',
				text2: e.message,
			})
		} finally {
			setUploading(false)
		}
	}, [
		id,
		title,
		instructions,
		exerciseType,
		equipmentId,
		primaryMuscleGroupId,
		videoUri,
		updateExerciseMutation,
		navigation,
		original,
	])

	useEffect(() => {
		;(navigation as any).setOptions({
			title: 'Edit Exercise',
			rightIcons: [
				{
					name: 'trash-outline',
					onPress: () => deleteModalRef.current?.present(),
					disabled: updateExerciseMutation.isPending,
				},
				{
					name: 'checkmark-done',
					onPress: onSave,
					disabled:
						updateExerciseMutation.isPending ||
						!title.trim() ||
						!equipmentId ||
						!primaryMuscleGroupId ||
						!isDirty,
					color: 'green',
				},
			],
		})
	}, [navigation, onSave, updateExerciseMutation.isPending, title, equipmentId, primaryMuscleGroupId, isDirty])

	if (!original) {
		return (
			<View className="flex-1 items-center justify-center bg-white dark:bg-black">
				<Text className="text-lg text-neutral-500">Exercise not found.</Text>
			</View>
		)
	}

	const handleSelectVideo = async () => {
		const result = await ImagePicker.launchImageLibraryAsync({
			mediaTypes: ImagePicker.MediaTypeOptions.Videos,
			allowsEditing: true,
			quality: 1,
		})

		if (!result.canceled && result.assets && result.assets.length > 0) {
			setVideoUri(result.assets[0].uri)
		}
	}

	return (
		<View className="flex-1 bg-white dark:bg-black" style={{ paddingBottom: insets.bottom }}>
			<ScrollView className="p-4">
				{/* Video picker */}
				<View className="mb-6 items-center">
					<TouchableOpacity
						onPress={handleSelectVideo}
						disabled={updateExerciseMutation.isPending || uploading}
						className="items-center justify-center rounded-2xl border-2 border-dashed border-neutral-300 bg-neutral-50 px-6 py-8 dark:border-neutral-700 dark:bg-neutral-900"
						style={{
							height: 160,
							width: '100%',
							opacity: updateExerciseMutation.isPending || uploading ? 0.5 : 1,
						}}
					>
						{videoUri ? (
							<>
								<Ionicons name="videocam" size={48} color={isDarkMode ? '#93c5fd' : '#3b82f6'} />
								<Text className="mt-2 text-center text-sm font-medium text-blue-500">
									New Video Selected
								</Text>
								<Text className="mt-1 text-center text-xs text-neutral-500">
									Tap to choose a different video
								</Text>
							</>
						) : original?.thumbnailUrl ? (
							<>
								{/* In a real app we'd just render an Image with the thumbnail, but Ionicons is a faster mockup here since EditableAvatar is gone */}
								<Ionicons name="film-outline" size={48} color={isDarkMode ? '#a3a3a3' : '#525252'} />
								<Text className="mt-2 text-center text-base font-medium text-neutral-600 dark:text-neutral-400">
									Existing Video Present
								</Text>
								<Text className="mt-1 text-center text-xs text-neutral-500">
									Tap to replace the video
								</Text>
							</>
						) : (
							<>
								<Ionicons name="cloud-upload-outline" size={48} color={placeholderColor} />
								<Text className="mt-2 text-center text-base font-medium text-neutral-600 dark:text-neutral-400">
									Select Exercise Video
								</Text>
								<Text className="mt-1 text-center text-xs text-neutral-500">MP4 format supported</Text>
							</>
						)}
					</TouchableOpacity>
				</View>

				{/* Title input */}
				<View className="mt-4 flex flex-row items-center gap-4">
					<Text className="w-24 text-lg font-semibold text-black dark:text-white">Title</Text>
					<TextInput
						value={title}
						onChangeText={setTitle}
						editable={!updateExerciseMutation.isPending}
						placeholder="e.g. Bench Press"
						className="flex-1 text-lg text-blue-500"
						placeholderTextColor={placeholderColor}
						style={{ lineHeight }}
					/>
				</View>

				{/* Instructions */}
				<View className="mt-6 flex flex-col gap-2">
					<Text className="text-lg font-semibold text-black dark:text-white">Instructions</Text>
					<TextInput
						value={instructions}
						onChangeText={setInstructions}
						editable={!updateExerciseMutation.isPending}
						placeholder="Describe how to perform the exercise..."
						className="min-h-[80px] rounded-xl border border-neutral-200 p-3 text-base text-black dark:border-neutral-800 dark:text-white"
						placeholderTextColor={placeholderColor}
						multiline
					/>
				</View>

				{/* Fields Selection */}
				<View className="mt-6 flex flex-col gap-4">
					<TouchableOpacity
						className="flex flex-row items-center justify-between rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3 dark:border-neutral-800 dark:bg-neutral-900"
						onPress={() => equipmentModalRef.current?.present()}
					>
						<Text className="text-lg font-semibold text-black dark:text-white">Equipment</Text>
						<Text className="text-lg text-neutral-500 dark:text-neutral-400">
							{equipmentList.find((e: MetaItem) => e.id === equipmentId)?.title || 'Select'}
						</Text>
					</TouchableOpacity>

					<TouchableOpacity
						className="flex flex-row items-center justify-between rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3 dark:border-neutral-800 dark:bg-neutral-900"
						onPress={() => primaryMuscleModalRef.current?.present()}
					>
						<Text className="text-lg font-semibold text-black dark:text-white">Primary Muscle</Text>
						<Text className="text-lg text-neutral-500 dark:text-neutral-400">
							{muscleGroupList.find((m: MetaItem) => m.id === primaryMuscleGroupId)?.title || 'Select'}
						</Text>
					</TouchableOpacity>
				</View>

				<View className="h-10" />
			</ScrollView>

			{/* Modals */}
			<MetaModal
				ref={equipmentModalRef}
				title="Equipment"
				items={equipmentList}
				loading={false}
				enableCreate={false}
				onClose={() => {}}
				onSelect={item => {
					setEquipmentId(item.id)
					equipmentModalRef.current?.dismiss()
				}}
			/>

			<MetaModal
				ref={primaryMuscleModalRef}
				title="Muscle Groups"
				items={muscleGroupList}
				loading={false}
				enableCreate={false}
				onClose={() => {}}
				onSelect={item => {
					setPrimaryMuscleGroupId(item.id)
					primaryMuscleModalRef.current?.dismiss()
				}}
			/>

			<DeleteConfirmModal
				ref={deleteModalRef}
				title="Delete Exercise"
				description="Are you sure you want to delete this exercise? This action cannot be undone."
				confirmText="Delete"
				onConfirm={async () => {
					try {
						await deleteExerciseMutation.mutateAsync(id)
						Toast.show({
							type: 'success',
							text1: 'Exercise deleted successfully',
						})
						// Query is automatically invalidated by useDeleteExercise
						router.back()
					} catch (e: any) {
						Toast.show({
							type: 'error',
							text1: 'Failed to delete exercise',
							text2: e.message,
						})
					}
				}}
				onCancel={() => {}}
			/>
		</View>
	)
}
